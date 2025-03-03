import hre from "./core";

import {
	StandaloneOptions,
	UpgradeProxyOptions,
} from "@openzeppelin/hardhat-upgrades/dist/utils/options";
import { Contract, ContractFactory } from "ethers";
import { ContractHelpers } from "../libs/contractHelpers";
import { DeployHelpers } from "../libs/deployHelpers";
import { Address, FunctionArgs } from "../types/abi";
import { UpgradeOptions } from "../types/options";
import { Constants, DeploymentStorage } from "./env";

const envData = DeploymentStorage.Env[Constants.ENV_KEY];

export async function upgrade({
	contractNameV1,
	contractNameV2 = contractNameV1,
	implConstructorArgs = [],
	reinitializer = "",
	implForceDeploy = false,
	skipStorageCheck = false,
	writeDeploymentResult = true,
	gasLimit = 0,
	deterministicOptions = undefined,
}: UpgradeOptions): Promise<Contract> {
	const [deployer] = await hre.ethers.getSigners();
	await DeployHelpers.printDeploymentTime(deployer);

	const proxyAddress = envData[contractNameV1].Proxy as Address;

	if (!proxyAddress) {
		throw new Error(`Proxy address for ${contractNameV1} is null`);
	}

	const { artifactName: artifactNameV1, deploymentName: deploymentNameV1 } =
		ContractHelpers.abi.getContractName(contractNameV1);
	const { artifactName: artifactNameV2, deploymentName: deploymentNameV2 } =
		ContractHelpers.abi.getContractName(contractNameV2);

	const contractIdentifierV1 = deploymentNameV1 || artifactNameV1;
	const contractIdentifierV2 = deploymentNameV2 || artifactNameV2;

	const previousImpl = await DeployHelpers.printProxyUpgradeInfo(
		proxyAddress,
		contractIdentifierV1,
	);

	const { factory: factoryV2, feeOverridingOpts } =
		await DeployHelpers.estimateDeploy(
			contractIdentifierV1,
			implConstructorArgs,
		);

	if (gasLimit > 0) {
		feeOverridingOpts.gasLimit = gasLimit;
	}

	const { proxyOptions } = DeployHelpers.getProxyOptions(
		true, // isUpgradeable
		implConstructorArgs,
		implForceDeploy,
		feeOverridingOpts,
		deterministicOptions,
	);

	const deployedContractV2 = await upgradeProxy(
		proxyAddress,
		factoryV2,
		reinitializer,
		skipStorageCheck,
		proxyOptions,
	);

	const implAddress = await DeployHelpers.getDeploymentResult(
		deployer,
		contractIdentifierV1,
		proxyAddress,
		true,
	);

	if (writeDeploymentResult) {
		await DeployHelpers.writeDeploymentResult(
			contractIdentifierV2,
			implAddress,
			[],
			proxyAddress,
			null,
			previousImpl,
			contractNameV1,
			true,
		);
	}

	return deployedContractV2;
}

async function upgradeProxy(
	proxyAddress: Address,
	factory: ContractFactory,
	reinitializer: { fn: string; args?: FunctionArgs } | string,
	skipStorageCheck: boolean,
	options: StandaloneOptions,
	/// TODO: Implement deterministic deployment
	// deterministicOptions: DeterministicOptions,
): Promise<Contract> {
	const upgradeProxyOptions: UpgradeProxyOptions = {
		...options,
		call:
			reinitializer != "" &&
			(typeof reinitializer === "string" ||
				(typeof reinitializer === "object" &&
					Object.keys(reinitializer).length > 0))
				? reinitializer
				: undefined,
		unsafeSkipStorageCheck: skipStorageCheck,
	};

	return (await (
		await hre.upgrades.upgradeProxy(
			proxyAddress,
			factory,
			upgradeProxyOptions,
		)
	).waitForDeployment()) as Contract;
}
