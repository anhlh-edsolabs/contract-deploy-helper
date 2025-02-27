import "@nomicfoundation/hardhat-ethers";
import hre from "hardhat";
import fs from "fs";
import chalk from "chalk";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, Wallet, ContractFactory } from "ethers";
import { log } from "console";

import {
	Constants,
	CoinBase,
	Provider,
	DeploymentStorage,
	DefaultDeterministicOptions,
} from "../core/env";

import { ContractHelpers } from "./contractHelpers";
import { DeterministicOptions, FeeOverridingOptions } from "../types/options";

import UpgradeableBeaconABI from "../core/abis/UpgradeableBeacon_ABI.json";
import { FunctionArgs } from "../types/abi";

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

async function printDeploymentResult(
	deployer: Wallet | HardhatEthersSigner,
	contractName: string,
	contractAddress: string,
	isUpgrade = false,
	isBeacon = false,
): Promise<string> {
	// wait for 3 seconds before fetching the implementation address
	await sleep(3000);

	let impl = contractAddress;

	log("====================================================");
	log("COMPLETED.");
	if (isUpgrade) {
		if (!isBeacon) {
			impl = await getImplementationAddress(contractAddress);
			log(
				`- ${chalk.bold.blue(
					contractName,
				)} proxy address: ${chalk.bold.red(contractAddress)}`,
			);
		} else {
			const beaconContract = new ethers.Contract(
				contractAddress,
				UpgradeableBeaconABI,
				deployer,
			);
			impl = await beaconContract.implementation();
			log(
				`- ${chalk.bold.blue(
					contractName,
				)} beacon address: ${chalk.bold.red(contractAddress)}`,
			);
		}
		log("- Implementation:", chalk.bold.yellow(impl));
	} else {
		log(
			`- ${chalk.bold.blue(contractName)} address: ${chalk.bold.yellow(
				impl,
			)}`,
		);
	}
	log(
		"- Account balance after deployment: ",
		chalk.bold.yellowBright(
			ethers.formatEther(await Provider.getBalance(deployer.address)),
		),
	);
	log("====================================================");

	return impl;
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

	// DeploymentStorage.Env[Constants.ENV_KEY] =
	// 	DeploymentStorage.Env[Constants.ENV_KEY] !== undefined
	// 		? DeploymentStorage.Env[Constants.ENV_KEY]
	// 		: {};
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
		await fs.promises.writeFile(
			DeploymentStorage.File,
			JSON.stringify(DeploymentStorage.Env, null, "\t"),
		);
		log(
			`Deployment data has been written to ${DeploymentStorage.File}.\n\r`,
		);
	} catch (err) {
		log(`Error when writing to ${DeploymentStorage.File}.\n\r`, err);
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

function getDeterministicOptions(
	deterministicOpt: DeterministicOptions = {} as DeterministicOptions,
): DeterministicOptions {
	if (!deterministicOpt) return { useDeterministicDeployment: false };

	const {
		useDeterministicDeployment = false,
		useCreate2Deploy,
		salt,
	} = deterministicOpt;

	const options = {
		useDeterministicDeployment,
		useCreate2Deploy: useCreate2Deploy ?? false,
		salt,
	};

	if (useDeterministicDeployment && useCreate2Deploy) {
		options.salt = salt ?? DefaultDeterministicOptions.salt;
	}

	return options as DeterministicOptions;
}

async function getImplementationAddress(proxyAddress: string): Promise<string> {
	const impl = await Provider.getStorage(
		proxyAddress,
		ContractHelpers.erc1967Slot.Implementation(),
	);
	return ethers.AbiCoder.defaultAbiCoder().decode(["address"], impl)[0];
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const DeployHelpers = {
	printDeploymentTime,
	printDeploymentResult,
	writeDeploymentResult,
	estimateDeploy,
	getImplementationAddress,
	getDeterministicOptions,
};
