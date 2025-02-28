import "@openzeppelin/hardhat-upgrades";
import hre from "hardhat";
import { StandaloneOptions } from "@openzeppelin/hardhat-upgrades/dist/utils/options";
import { Contract, ContractFactory } from "ethers";
import { ContractHelpers } from "../libs/contractHelpers";
import { DeployHelpers } from "../libs/deployHelpers";
import { Address, FunctionArgs } from "../types/abi";
import {
    DeployOptions,
    DeterministicOptions,
    FeeOverridingOptions,
} from "../types/options";
import { DefaultProxyOptions } from "./env";

export async function deploy({
	contractName,
	initializationArgs = [],
	isUpgradeable = false,
	implConstructorArgs = [],
	implForceDeploy = false,
	writeDeploymentResult = true,
	gasLimit = 0,
	deterministicOptions = undefined,
}: DeployOptions): Promise<Contract> {
	const [deployer] = await hre.ethers.getSigners();

	await DeployHelpers.printDeploymentTime(deployer);

	const { artifactName, deploymentName, factory, feeOverridingOpts } =
		await getContractDetails(contractName, implConstructorArgs);

	if (gasLimit > 0) {
		feeOverridingOpts.gasLimit = gasLimit;
	}

	const { proxyOptions } = getProxyOptions(
		isUpgradeable,
		implConstructorArgs,
		implForceDeploy,
		feeOverridingOpts,
		deterministicOptions,
	);

	// Deploy contract
	const deployedContract = await deployContract(
		factory,
		initializationArgs,
		implConstructorArgs,
		feeOverridingOpts,
		isUpgradeable,
		proxyOptions,
		// deterministic,
	);

	const contractAddress = deployedContract.target as Address;
	
    const implAddress = await DeployHelpers.printDeploymentResult(
		deployer,
		deploymentName || artifactName,
		contractAddress,
		isUpgradeable,
	);

	if (writeDeploymentResult) {
		await DeployHelpers.writeDeploymentResult(
			deploymentName ? `${artifactName}${deploymentName}` : artifactName,
			implAddress,
			initializationArgs,
			isUpgradeable ? contractAddress : null,
		);
	}

	return deployedContract;
}

async function getContractDetails(
	contractName: string,
	constructorArgs: FunctionArgs,
) {
	const { artifactName, deploymentName } =
		ContractHelpers.abi.getContractName(contractName);
	const { factory, feeOverridingOpts } = await DeployHelpers.estimateDeploy(
		artifactName,
		constructorArgs,
	);

	return { artifactName, deploymentName, factory, feeOverridingOpts };
}

function getProxyOptions(
	isUpgradeable: boolean,
	implConstructorArgs: FunctionArgs,
	implForceDeploy: boolean,
	feeOverridingOpts: FeeOverridingOptions,
	deterministicOptions?: DeterministicOptions,
): {
	proxyOptions: StandaloneOptions;
	deterministic?: DeterministicOptions;
} {
	const commonOptions: StandaloneOptions = {
		constructorArgs:
			implConstructorArgs.length > 0 ? implConstructorArgs : undefined,
		redeployImplementation: implForceDeploy ? "always" : "onchange",
		txOverrides: feeOverridingOpts,
	};

	const deterministic: DeterministicOptions =
		DeployHelpers.getDeterministicOptions(deterministicOptions);

	if (isUpgradeable) {
		return {
			proxyOptions: { ...DefaultProxyOptions, ...commonOptions },
			deterministic,
		};
	} else {
		return {
			proxyOptions: {},
			deterministic,
		};
	}
}

async function deployContract(
	factory: ContractFactory,
	initializationArgs: FunctionArgs,
	implConstructorArgs: FunctionArgs,
	feeOverridingOpts: FeeOverridingOptions,
	isUpgradeable: boolean,
	options?: StandaloneOptions,
    /// TODO: add deterministicOptions
	// deterministicOptions?: DeterministicOptions,
): Promise<Contract> {
	if (isUpgradeable && options) {
		/// TODO: process deterministic deployment
		return (await (
			await hre.upgrades.deployProxy(factory, initializationArgs, options)
		).waitForDeployment()) as Contract;
	} else {
		/// TODO: process deterministic deployment
		return (await (
			await factory.deploy(...implConstructorArgs, feeOverridingOpts)
		).waitForDeployment()) as Contract;
	}
}
