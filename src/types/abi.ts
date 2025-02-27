/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AbiIO {
    internalType: string;
    name: string;
    type: string;
    components?: AbiIO[];
}

export type AbiItem = {
    inputs: AbiIO[];
	outputs?: AbiIO[];
	name?: string;
	type: "constructor" | "function" | "event" | "fallback" | "receive";
	stateMutability?: "payable" | "nonpayable" | "pure" | "view";
	anonymous?: boolean;
}

export type Abi = AbiItem[];

export type FunctionArgs = (
	| string
	| number
	| boolean
	| any[]
)[];