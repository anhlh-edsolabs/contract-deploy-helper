import { FunctionArgs } from "./abi";

export { Address } from "./abi";

export interface FeeOverridingOptions {
	gasLimit?: number;
	maxPriorityFeePerGas?: number;
	maxFeePerGas?: number;
	baseFeePerGas?: number;
	type?: number;
}

export interface DeterministicOptions {
	useDeterministicDeployment: boolean;
	useCreate2Deploy?: boolean;
	salt?: string;
}

type GenericDeploymentOptions = {
	contractName: string;
	implConstructorArgs?: FunctionArgs;
	implForceDeploy?: boolean;
	writeDeploymentResult?: boolean;
	gasLimit?: number;
	deterministicOptions?: DeterministicOptions;
};

export interface DeployOptions extends GenericDeploymentOptions {
	initializationArgs?: FunctionArgs;
	isUpgradeable?: boolean;
}

export interface UpgradeOptions
	extends Omit<GenericDeploymentOptions, "contractName"> {
	contractNameV1: string;
	contractNameV2?: string;
	reinitializer?: { fn: string; args?: FunctionArgs } | string;
	skipStorageCheck?: boolean;
}

export type DeployBeaconOptions = GenericDeploymentOptions & {};
