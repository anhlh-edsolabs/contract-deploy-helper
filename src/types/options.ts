import { FunctionArgs } from "./abi";

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
};

export type DeployOptions = GenericDeploymentOptions & {
	initializationArgs?: FunctionArgs;
	isUpgradeable?: boolean;
	writeDeploymentResult?: boolean;
	gasLimit?: number;
	deterministicOptions?: DeterministicOptions;
};

export type DeployBeaconOptions = GenericDeploymentOptions & {};
