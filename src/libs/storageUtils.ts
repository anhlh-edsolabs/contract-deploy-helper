import { ethers } from "ethers";
import UpgradeableBeaconABI from "../core/abis/UpgradeableBeacon_ABI.json";
import { Address } from "../types/abi";
import { EncodingUtils } from "./encodingUtils";

import { Provider } from "../core/env";

async function getImplementationAddress(
	proxyAddress: Address,
): Promise<Address> {
	const impl = await readStorageSlot(
		proxyAddress,
		EncodingUtils.erc1967Slot.Implementation(),
	);

	if (isEmptySlot(impl)) {
		throw new Error("Implementation address is empty");
	}

	return ethers.AbiCoder.defaultAbiCoder().decode(["address"], impl)[0];
}

async function getBeaconAddress(beaconProxyAddress: Address): Promise<Address> {
	const beacon = await readStorageSlot(
		beaconProxyAddress,
		EncodingUtils.erc1967Slot.Beacon(),
	);

	if (isEmptySlot(beacon)) {
		throw new Error("Beacon address is empty");
	}

	return ethers.AbiCoder.defaultAbiCoder().decode(["address"], beacon)[0];
}

async function getBeaconImplementationAddress(
	beaconAddress: Address,
): Promise<Address> {
	const beaconContract = new ethers.Contract(
		beaconAddress,
		UpgradeableBeaconABI,
		Provider,
	);
	return await beaconContract.implementation();
}

async function readStorageSlot(
	address: Address,
	slot: string,
): Promise<string> {
	let storage =
		"0x0000000000000000000000000000000000000000000000000000000000000000";

	storage = await Provider.send("eth_getStorageAt", [
		address,
		slot,
		"latest",
	]);

	return storage;
}

function isEmptySlot(storage: string): boolean {
	const slotData = ethers.AbiCoder.defaultAbiCoder().decode(
		["uint256"],
		storage,
	);
	return BigInt(slotData[0]) === 0n;
}

// function extractRuntimeBytecode(deploymentBytecode: string): string {
// 	// Remove '0x' prefix
// 	const bytecode = deploymentBytecode.slice(2);

// 	// Find the RETURN opcode (0xf3)
// 	let returnIndex = -1;
// 	for (let i = 0; i < bytecode.length - 2; i += 2) {
// 		if (bytecode.slice(i, i + 2).toLowerCase() === "f3") {
// 			returnIndex = i;
// 			break;
// 		}
// 	}

// 	if (returnIndex === -1) {
// 		throw new Error(
// 			"RETURN opcode (0xf3) not found in deployment bytecode",
// 		);
// 	}

// 	// Skip the 'fe' byte after 'f3' if present
// 	let runtimeStart = returnIndex + 2; // After f3
// 	if (bytecode.slice(runtimeStart, runtimeStart + 2).toLowerCase() === "fe") {
// 		runtimeStart += 2; // Skip fe
// 	}

// 	// Extract runtime bytecode from runtimeStart to the end
// 	const runtimeBytecode = "0x" + bytecode.slice(runtimeStart);

// 	return runtimeBytecode;
// }

function extractRuntimeBytecode(deploymentBytecode:string): string {
    // Convert hex string to Buffer, removing '0x' prefix
    const bytecodeBuffer = Buffer.from(deploymentBytecode.slice(2), 'hex');

    // Find the RETURN opcode (0xf3)
    let returnIndex = -1;
    for (let i = 0; i < bytecodeBuffer.length; i++) {
        if (bytecodeBuffer[i] === 0xf3) {
            returnIndex = i;
            break;
        }
    }

    if (returnIndex === -1) {
        throw new Error('RETURN opcode (0xf3) not found in deployment bytecode');
    }

    // Skip the 'fe' byte after 'f3' if present
    let runtimeStart = returnIndex + 1; // After f3
    if (runtimeStart < bytecodeBuffer.length && bytecodeBuffer[runtimeStart] === 0xfe) {
        runtimeStart += 1; // Skip fe
    }

    // Extract runtime bytecode from runtimeStart to the end
    // const runtimeBytecodeBuffer = bytecodeBuffer.slice(runtimeStart);
	const runtimeBytecodeBuffer = Uint8Array.prototype.slice.call(bytecodeBuffer, runtimeStart);
    const runtimeBytecode = '0x' + (runtimeBytecodeBuffer as Buffer).toString('hex');

    return runtimeBytecode;
}

export const StorageUtils = {
	getImplementationAddress,
	getBeaconAddress,
	getBeaconImplementationAddress,
	extractRuntimeBytecode,
};
