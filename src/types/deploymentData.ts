import { FunctionArgs } from "./abi";

export interface DeploymentItem {
	ChainID: number;
	Proxy: string | null;
	Beacon: string | null;
	Impl: string;
	InitializationArgs: FunctionArgs;
	PreviousImplementations?: string[];
	PreviousContractNames?: string[];
}

export interface ContractDeployment {
	[ContractName: string]: DeploymentItem;
}

export interface DeploymentDataType {
	[Environment: string]: ContractDeployment;
}
