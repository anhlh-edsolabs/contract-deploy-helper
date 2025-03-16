import { Address, FunctionArgs } from "./abi";

export interface DeploymentItem {
	ChainID: number;
	Proxy: Address | null;
	Beacon: Address | null;
	Impl: Address;
	InitializationArgs: FunctionArgs;
	PreviousImplementations?: Address[];
	PreviousContractNames?: string[];
}

export interface ContractDeployment {
	[ContractName: string]: DeploymentItem;
}

export interface DeploymentDataType {
	[Environment: string]: ContractDeployment;
}
