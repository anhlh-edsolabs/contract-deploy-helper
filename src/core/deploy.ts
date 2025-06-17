import hh from "./core";
import { StandaloneOptions } from "@openzeppelin/hardhat-upgrades/dist/utils/options";
import { Contract, ContractFactory } from "ethers";

import { Deployer } from "./env";
import { DeploymentUtils } from "../libs/deploymentUtils";
import { Address, FunctionArgs } from "../types/abi";
import { DeployOptions, FeeOverridingOptions } from "../types/options";
import { AbiUtils } from "../libs/abiUtils";

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
	// const [deployer] = await hre.ethers.getSigners();
	const deployer = await Deployer();
	await DeploymentUtils.printDeploymentTime(deployer);

	const { artifactName, deploymentName, factory, feeOverridingOpts } =
		await getContractDetails(contractName, implConstructorArgs);

	if (gasLimit > 0) {
		feeOverridingOpts.gasLimit = gasLimit;
	}

	const { proxyOptions } = DeploymentUtils.getProxyOptions(
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

	const implAddress = await DeploymentUtils.getDeploymentResult(
		deployer,
		deploymentName || artifactName,
		contractAddress,
		isUpgradeable,
	);

	if (writeDeploymentResult) {
		await DeploymentUtils.writeDeploymentResult(
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
		AbiUtils.getContractName(contractName);
	const { factory, feeOverridingOpts } = await DeploymentUtils.estimateDeploy(
		artifactName,
		constructorArgs,
	);

	return { artifactName, deploymentName, factory, feeOverridingOpts };
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
		const proxyDeployment = await hh.upgrades.deployProxy(factory, initializationArgs, options);
		const proxy = await proxyDeployment.waitForDeployment();
		return proxy as Contract;
	} else {
		/// TODO: process deterministic deployment
		return (await (
			await factory.deploy(...implConstructorArgs, feeOverridingOpts)
		).waitForDeployment()) as Contract;
	}
}
