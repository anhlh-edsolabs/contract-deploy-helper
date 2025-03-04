import fs from "fs";
import path from "path";
import chalk from "chalk";

import { ethers, Wallet, ContractFactory } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { StandaloneOptions } from "@openzeppelin/hardhat-upgrades/dist/utils/options";
import { log } from "console";

import hre from "../core/core";

import {
	Constants,
	CoinBase,
	Provider,
	DeploymentStorage,
	DefaultDeterministicOptions,
	DefaultProxyOptions,
} from "../core/env";

import { DeterministicOptions, FeeOverridingOptions } from "../types/options";

import { Address, FunctionArgs } from "../types/abi";

import { StorageHelpers } from "./storageHelpers";


async function printDeploymentTime(
	deployer: Wallet | HardhatEthersSigner,
	isUpgrade = false,
): Promise<void> {
	log("====================================================");
	log("Start time: ", new Date(Date.now()));

	log(
		`${!isUpgrade ? "Deploying" : "Upgrading"} contract with the account: ${
			deployer.address
		}`,
	);

	log(
		"Account balance:",
		ethers.formatEther(await Provider.getBalance(deployer.address)),
	);
	log("====================================================\n\r");
}

async function printProxyUpgradeInfo(
	proxyAddress: Address,
	contractIdentifier: string,
): Promise<Address> {
	const impl = await StorageHelpers.getImplementationAddress(proxyAddress);
	log(
		`Upgrading ${chalk.bold.blue(
			contractIdentifier,
		)} proxy at ${chalk.bold.red(
			proxyAddress,
		)} with implementation at ${chalk.bold.yellow(impl)}`,
	);

	return impl;
}

async function getDeploymentResult(
	deployer: Wallet | HardhatEthersSigner,
	contractName: string,
	contractAddress: Address,
	isUpgrade?: boolean,
	isBeacon?: boolean,
): Promise<Address> {
	// wait for 3 seconds before fetching the implementation address
	await sleep(3000);

	let implementationAddress = contractAddress;
	if (isUpgrade) {
		implementationAddress = isBeacon
			? await StorageHelpers.getBeaconImplementationAddress(contractAddress)
			: await StorageHelpers.getImplementationAddress(contractAddress);
	}

	await logDeploymentResult(
		contractName,
		deployer.address as Address,
		contractAddress,
		implementationAddress,
		isUpgrade,
		isBeacon,
	);

	return implementationAddress;
}

async function logDeploymentResult(
	contractName: string,
	deployerAddress: Address,
	contractAddress: Address,
	implementationAddress: Address,
	isUpgrade?: boolean,
	isBeacon?: boolean,
): Promise<void> {
	log("====================================================");
	log("COMPLETED.");

	if (isUpgrade) {
		if (!isBeacon) {
			log(
				`- ${chalk.bold.blue(
					contractName,
				)} proxy address: ${chalk.bold.red(contractAddress)}`,
			);
		} else {
			log(
				`- ${chalk.bold.blue(
					contractName,
				)} beacon address: ${chalk.bold.red(contractAddress)}`,
			);
		}
		log("- Implementation: ", chalk.bold.yellow(implementationAddress));
	} else {
		log(
			`- ${chalk.bold.blue(contractName)} address: ${chalk.bold.yellow(
				contractAddress,
			)}`,
		);
	}
	log(
		" - Account balance after deployment: ",
		chalk.bold.yellowBright(
			ethers.formatEther(await Provider.getBalance(deployerAddress)),
		),
	);
	log("====================================================");
}

async function writeDeploymentResult(
	contractName: string,
	implementationAddress: string,
	initializationArgs: FunctionArgs = [],
	proxyAddress: string | null = null,
	beaconAddress: string | null = null,
	previousImplAddress: string | null = null,
	previousContractName: string = contractName,
	isProxyUpgrade: boolean = false,
): Promise<void> {
	const envKey = Constants.ENV_KEY;
	const envData = DeploymentStorage.Env[envKey] || {};

	if (isProxyUpgrade) {
		if (contractName != previousContractName) {
			// deep cloning the object for previous contract
			envData[contractName] = JSON.parse(
				JSON.stringify(envData[previousContractName]),
			);

			// delete the object for previous contract
			delete envData[previousContractName];

			const previousContractNames =
				envData[contractName].PreviousContractNames || [];
			previousContractNames.push(previousContractName);

			envData[contractName].PreviousContractNames = previousContractNames;
		}

		const previousImplAddresses =
			envData[contractName].PreviousImplementations || [];

		if (previousImplAddress) {
			previousImplAddresses.push(previousImplAddress);
		}

		envData[contractName] = {
			...envData[contractName],
			Proxy: proxyAddress,
			Beacon: beaconAddress,
			Impl: implementationAddress,
			PreviousImplementations: previousImplAddresses,
		};
	} else {
		envData[contractName] = {
			ChainID: Constants.CHAIN_ID,
			Proxy: proxyAddress,
			Beacon: beaconAddress,
			Impl: implementationAddress,
			InitializationArgs: initializationArgs,
		};
	}

	DeploymentStorage.Env[envKey] = envData;

	try {
		// Check if the file exists and create it if it doesn't.
		await fs.promises.access(DeploymentStorage.File, fs.constants.F_OK);
	} catch {
		// Create the directory if it doesn't exist
		await fs.promises.mkdir(path.dirname(DeploymentStorage.File), {
			recursive: true,
		});
		// Create the file if it doesn't exist
		await fs.promises.writeFile(DeploymentStorage.File, "{}");
		log(
			`Deployment data file ${DeploymentStorage.File} has been created.\n\r`,
		);
	} finally {
		await fs.promises.writeFile(
			DeploymentStorage.File,
			JSON.stringify(DeploymentStorage.Env, null, "\t"),
		);

		log(
			`Deployment data has been written to ${DeploymentStorage.File}.\n\r`,
		);
	}
}

async function estimateDeploy(
	contractName: string,
	constructorArgs: FunctionArgs = [],
	constructorArgsFile: string = "",
): Promise<{
	factory: ContractFactory;
	feeOverridingOpts: FeeOverridingOptions;
}> {
	const factory = await hre.ethers.getContractFactory(contractName);
	let feeData;

	try {
		feeData = await Provider.getFeeData();
	} catch (err: unknown) {
		log(chalk.bold.red("Error getting fee data:", (err as Error).message));

		// fallback to default fee data
		feeData = {
			gasPrice: ethers.parseUnits("1", "gwei"),
			maxFeePerGas: ethers.parseUnits("20", "gwei"),
			maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
		};
	}

	const args =
		constructorArgsFile !== ""
			? Object.values(
					JSON.parse(fs.readFileSync(constructorArgsFile, "utf8")),
			  )
			: constructorArgs;

	const deployTx = await factory.getDeployTransaction(...args);

	const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);

	const networkGasPrice = feeData.gasPrice ?? ethers.parseUnits("20", "gwei");
	const maxFeePerGas =
		feeData.maxFeePerGas ?? (networkGasPrice * 110n) / 100n; // set the MaxFeePerGas to 10% higher than gas price
	const maxPriorityFeePerGas =
		feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei");

	const estimatedCost = ethers.formatEther(estimatedGas * networkGasPrice);

	// log(`Estimated gas: ${estimatedGas.toBigInt().toLocaleString("en-GB")}`);
	log(
		`Estimated gas: ${chalk.bold.yellow(
			estimatedGas.toLocaleString("vi-VN"),
		)}`,
	);
	log(
		`Gas price: ${chalk.bold.red(
			ethers.formatUnits(networkGasPrice, "gwei"),
		)} gwei`,
	);
	log(
		`Max fee per gas: ${chalk.bold.red(
			ethers.formatUnits(maxFeePerGas, "gwei"),
		)} gwei`,
	);
	log(
		`Estimated cost for ${chalk.bold.blueBright(
			contractName,
		)} contract deployment: ${chalk.bold.red(
			estimatedCost,
		)} ${chalk.bold.red(await CoinBase())}`,
	);

	const feeOverridingOpts: FeeOverridingOptions =
		Constants.CHAIN_ID == 97
			? { gasLimit: Number(estimatedGas) }
			: {
					maxPriorityFeePerGas: Number(maxPriorityFeePerGas),
					maxFeePerGas: Number(maxFeePerGas),
					baseFeePerGas: Number(networkGasPrice),
					type: 2,
			  };

	return { factory, feeOverridingOpts };
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

function getDeterministicOptions(
	deterministicOpt: DeterministicOptions = {} as DeterministicOptions,
): DeterministicOptions {
	if (!deterministicOpt || !deterministicOpt.useDeterministicDeployment) {
		return { useDeterministicDeployment: false };
	}

	const {
		useCreate2Deploy = false,
		salt = DefaultDeterministicOptions.salt,
	} = deterministicOpt;

	return {
		useDeterministicDeployment: true,
		useCreate2Deploy,
		salt,
	};
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const DeployHelpers = {
	printDeploymentTime,
	printProxyUpgradeInfo,
	writeDeploymentResult,
	estimateDeploy,
	getDeploymentResult,
	getProxyOptions,
	getDeterministicOptions,
};
