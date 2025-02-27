import { config } from "dotenv";
import { ethers } from "ethers";
import hre from "hardhat";

import fs from "fs";
import path from "path";

import {
    DeployBeaconProxyOptions,
    DeployProxyOptions
} from "@openzeppelin/hardhat-upgrades/dist/utils/options";

import { DeploymentDataType } from "../types/deploymentData";
import { DeterministicOptions } from "../types/options";

config();

const ENV_KEY = process.env.DEPLOYMENT_ENV as string;
const RPC_URL = process.env[`RPC_PROVIDER_${ENV_KEY}`] as string;
const DEPLOYER_ADDR = process.env[`DEPLOYER_${ENV_KEY}`] as string;
const DEPLOYER_PK = process.env[`DEPLOYER_PK_${ENV_KEY}`] as string;
const CHAIN_ID = hre.network.config.chainId as number;

const POLLING_ENABLED = Boolean(process.env.POLLING_ENABLED);
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL || "10000");

const DEPLOYMENT_DATA_DIR =
	process.env.DEPLOYMENT_DATA_DIR || ("deployment" as string);
const DEPLOYMENT_DATA_FILE =
	process.env.DEPLOYMENT_DATA_FILE || (".deployment_data.json" as string);
const DEPLOYMENT_PATH = path.join(
	process.cwd(),
	DEPLOYMENT_DATA_DIR,
	DEPLOYMENT_DATA_FILE,
);
const DEPLOYMENT_FILE = path.resolve(DEPLOYMENT_PATH);

const DeploymentData: DeploymentDataType =
	fs.existsSync(DEPLOYMENT_PATH) && fs.existsSync(DEPLOYMENT_FILE)
		? JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"))
		: {};

export const Provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
	polling: POLLING_ENABLED,
	pollingInterval: POLLING_INTERVAL,
});

export const Deployer = new ethers.Wallet(DEPLOYER_PK, Provider);

export const CoinBase = async (): Promise<string> => {
	const chainID = parseInt((await Provider.getNetwork()).chainId.toString());
	let coinbase: string;
	switch (chainID) {
		case 1:
		case 4:
		case 11155111:
			coinbase = "ETH";
			break;
		case 56:
		case 97:
			coinbase = "BNB";
			break;
		case 137:
		case 80002:
			coinbase = "POL";
			break;
		default:
			coinbase = "ETH";
	}

	return coinbase;
};

export const DefaultProxyOptions: DeployProxyOptions = {
	kind: "uups",
	timeout: 0,
	pollingInterval: POLLING_INTERVAL,
};

export const DefaultBeaconOptions: DeployBeaconProxyOptions = {
	kind: "beacon",
	timeout: 0,
	pollingInterval: POLLING_INTERVAL,
};

export const DefaultDeterministicOptions: DeterministicOptions = {
    useDeterministicDeployment: true,
	salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

export const Constants = {
	ENV_KEY,
	RPC_URL,
	CHAIN_ID,
	DEPLOYER_ADDR,
};

export const DeploymentStorage = { Env: DeploymentData, File: DEPLOYMENT_FILE };
