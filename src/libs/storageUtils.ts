import { ethers } from "ethers";
import UpgradeableBeaconABI from "../core/abis/UpgradeableBeacon_ABI.json";
import { Address } from "../types/abi";

import { Provider } from "../core/env";

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

export async function getImplementationAddress(
	proxyAddress: Address,
): Promise<Address> {
	const impl = await readStorageSlot(
		proxyAddress,
		StorageUtils.erc1967.Implementation(),
	);

	if (isEmptySlot(impl)) {
		throw new Error("Implementation address is empty");
	}

	return ethers.AbiCoder.defaultAbiCoder().decode(["address"], impl)[0];
}

export async function getBeaconAddress(beaconProxyAddress: Address): Promise<Address> {
	const beacon = await readStorageSlot(
		beaconProxyAddress,
		StorageUtils.erc1967.Beacon(),
	);

	if (isEmptySlot(beacon)) {
		throw new Error("Beacon address is empty");
	}

	return ethers.AbiCoder.defaultAbiCoder().decode(["address"], beacon)[0];
}

export async function getBeaconImplementationAddress(
	beaconAddress: Address,
): Promise<Address> {
	const beaconContract = new ethers.Contract(
		beaconAddress,
		UpgradeableBeaconABI,
		Provider,
	);
	return await beaconContract.implementation();
}

export async function readStorageSlot(
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

export function isEmptySlot(storage: string): boolean {
	const slotData = ethers.AbiCoder.defaultAbiCoder().decode(
		["uint256"],
		storage,
	);
	return BigInt(slotData[0]) === 0n;
}

export function extractRuntimeBytecode(deploymentBytecode: string): string {
	// Convert hex string to Buffer, removing '0x' prefix
	const bytecodeBuffer = Buffer.from(deploymentBytecode.slice(2), "hex");

	// Find the RETURN opcode (0xf3)
	let returnIndex = -1;
	for (let i = 0; i < bytecodeBuffer.length; i++) {
		if (bytecodeBuffer[i] === 0xf3) {
			returnIndex = i;
			break;
		}
	}

	if (returnIndex === -1) {
		throw new Error(
			"RETURN opcode (0xf3) not found in deployment bytecode",
		);
	}

	// Skip the 'fe' byte after 'f3' if present
	let runtimeStart = returnIndex + 1; // After f3
	if (
		runtimeStart < bytecodeBuffer.length &&
		bytecodeBuffer[runtimeStart] === 0xfe
	) {
		runtimeStart += 1; // Skip fe
	}

	// Extract runtime bytecode from runtimeStart to the end
	// const runtimeBytecodeBuffer = bytecodeBuffer.slice(runtimeStart);
	const runtimeBytecodeBuffer = Uint8Array.prototype.slice.call(
		bytecodeBuffer,
		runtimeStart,
	);
	const runtimeBytecode =
		"0x" + (runtimeBytecodeBuffer as Buffer).toString("hex");

	return runtimeBytecode;
}

/**
 * Formula: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
 * Output value: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
 *
 * @returns The computed implementation slot for ERC1967
 */
export function erc1967ImplSlot(): string {
	return _erc1967Slot("eip1967.proxy.implementation");
}

/**
 * The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.
 * This is the keccak-256 hash of "eip1967.proxy.beacon" subtracted by 1.
 * Formula: bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
 *
 * Output value: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50'
 *
 * @returns The computed beacon slot for ERC1967
 */
export function erc1967BeaconSlot(): string {
	return _erc1967Slot("eip1967.proxy.beacon");
}

/**
 * The storage slot of the UpgradeableBeacon contract which defines the admin for this proxy.
 * This is the keccak-256 hash of "eip1967.proxy.beacon" subtracted by 1.
 * Formula: bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
 *
 * Output value: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
 *
 * @returns The computed admin slot for ERC1967
 */
export function erc1967AdminSlot(): string {
	return _erc1967Slot("eip1967.proxy.admin");
}

function _erc1967Slot(key: string): string {
	return ethers.toBeHex(BigInt(ethers.keccak256(Buffer.from(key))) - 1n);
}

/**
 * Compute the ERC7201 storage namespace hash
 * Formula: keccak256(abi.encode(uint256(keccak256("namespaceId")) - 1)) & ~bytes32(uint256(0xff))
 * @param {string} namespaceId
 * @returns {string} ERC7201 storage namespace hash as a bytes32 hex string
 */
export function erc7201(namespaceId: string): string {
	return ethers.toBeHex(
		BigInt(
			ethers.keccak256(
				abiCoder.encode(
					["uint256"],
					[BigInt(ethers.keccak256(Buffer.from(namespaceId))) - 1n],
				),
			),
		) &
			(~BigInt("0xff") & ethers.MaxUint256),
	);
}

export const StorageUtils = {
	getImplementationAddress,
	getBeaconAddress,
	getBeaconImplementationAddress,
	extractRuntimeBytecode,
	erc1967: {
		Implementation: erc1967ImplSlot,
		Beacon: erc1967BeaconSlot,
		Admin: erc1967AdminSlot,
	},
	erc7201,
};