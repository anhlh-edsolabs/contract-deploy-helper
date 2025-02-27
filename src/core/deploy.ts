import "@openzeppelin/hardhat-upgrades";
import hre from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StandaloneOptions } from "@openzeppelin/hardhat-upgrades/dist/utils/options";
import { DefaultProxyOptions, DefaultBeaconOptions } from "./env";
import { DeployHelpers } from "../libs/deployHelpers";
import {
	DeployOptions,
	DeployBeaconOptions,
	FeeOverridingOptions,
	DeterministicOptions,
} from "../types/options";
import { Contract, ContractFactory } from "ethers";
import { ContractHelpers } from "../libs/contractHelpers";
import { FunctionArgs } from "../types/abi";

export async function deploy(
	hre: HardhatRuntimeEnvironment,
	{
		contractName,
		initializationArgs = [],
		isUpgradeable = false,
		implConstructorArgs = [],
		implForceDeploy = false,
		writeDeploymentResult = true,
		gasLimit = 0,
		deterministicOptions = undefined,
	}: DeployOptions,
): Promise<Contract> {
	const [deployer] = await hre.ethers.getSigners();

	await DeployHelpers.printDeploymentTime(deployer);

	const { artifactName, deploymentName } =
		ContractHelpers.abi.getContractName(contractName);
	const { factory, feeOverridingOpts } = await DeployHelpers.estimateDeploy(
		artifactName,
		implConstructorArgs,
	);

	if (gasLimit > 0) {
		feeOverridingOpts.gasLimit = gasLimit;
	}

	const proxyOptions: StandaloneOptions = getDeploymentOptions(
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
	);

	const contractAddress = await deployedContract.getAddress();
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

export async function deployBeacon(
	hre: HardhatRuntimeEnvironment,
	{
		contractName,
		implConstructorArgs = [],
		implForceDeploy = false,
	}: DeployBeaconOptions,
): Promise<Contract> {
	const [deployer] = await hre.ethers.getSigners();

	await DeployHelpers.printDeploymentTime(deployer);

	const { artifactName, deploymentName } =
		ContractHelpers.abi.getContractName(contractName);
	const { factory, feeOverridingOpts } = await DeployHelpers.estimateDeploy(
		artifactName,
		implConstructorArgs,
	);

	const beaconOptions: StandaloneOptions = getDeploymentOptions(
		false, // isUpgradeable
		implConstructorArgs,
		implForceDeploy,
		feeOverridingOpts,
	);

	// Deploy beacon contract
	const deployedBeacon = await deployContract(
		factory,
		[],
		implConstructorArgs,
		feeOverridingOpts,
		true,
		beaconOptions,
		true,
	);

	const beaconAddress = await deployedBeacon.getAddress();
	const implAddress = await DeployHelpers.printDeploymentResult(
		deployer,
		deploymentName || artifactName,
		beaconAddress,
		true,
		true,
	);

	await DeployHelpers.writeDeploymentResult(
		deploymentName ? `${artifactName}${deploymentName}` : artifactName,
		implAddress,
		implConstructorArgs,
		null,
		beaconAddress,
	);

	return deployedBeacon;
}

function getDeploymentOptions(
	isUpgradeable: boolean,
	implConstructorArgs: FunctionArgs,
	implForceDeploy: boolean,
	feeOverridingOpts: FeeOverridingOptions,
	deterministicOptions?: DeterministicOptions,
): StandaloneOptions {
	const commonOptions: StandaloneOptions = {
		constructorArgs:
			implConstructorArgs.length > 0 ? implConstructorArgs : undefined,
		redeployImplementation: implForceDeploy ? "always" : "onchange",
		txOverrides: feeOverridingOpts,
	};

	if (isUpgradeable) {
		return {
			...DefaultProxyOptions,
			...commonOptions,
			...DeployHelpers.getDeterministicOptions(deterministicOptions),
		};
	} else {
		return {
			...DefaultBeaconOptions,
			...commonOptions,
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
	isBeacon?: boolean,
): Promise<Contract> {
	let deployment;
	if (isUpgradeable && options) {
		deployment = await hre.upgrades.deployProxy(
			factory,
			initializationArgs,
			options,
		);
	} else if (isBeacon && options) {
		deployment = await hre.upgrades.deployBeacon(factory, options);
	} else {
		deployment = await factory.deploy(
			...implConstructorArgs,
			feeOverridingOpts,
		);
	}

	return (await deployment.waitForDeployment()) as Contract;
}
