import { ethers } from "ethers";
import { AbiIO } from "../types/abi";

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

/**
 * Formula: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
 * Output value: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
 *
 * @returns The computed implementation slot for ERC1967
 */
function erc1967ImplSlot(): string {
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
function erc1967BeaconSlot(): string {
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
function erc1967AdminSlot(): string {
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
function erc7201(namespaceId: string): string {
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

/**
 * Iterates over the inputs array and returns a comma-separated string of input types.
 * If an input type is a tuple or an array of tuples, it recursively iterates over the components and appends the result.
 * @param {Array} inputs - The array of input objects.
 * @returns {string} - A comma-separated string of input types.
 */
function iterateInputs(inputs: AbiIO[]): string {
	return inputs
		.map((input) => {
			if (input.type === "tuple" || input.type === "tuple[]") {
				const childResult = iterateInputs(input.components || []);
				return `tuple(${childResult})${
					input.type === "tuple[]" ? "[]" : ""
				}`;
			}
			return input.type;
		})
		.join(",");
}

/**
 * Retrieves the artifact name and deployment name from a compound contract name.
 *
 * @param {string} contractNameCompound - The compound contract name in the format `contractName$deploymentName`.
 * @returns {Object} - An object containing the artifact name and deployment name.
 */
function getContractName(contractNameCompound: string): {
	artifactName: string;
	deploymentName: string;
} {
	const [artifactName, deploymentName = ""] = contractNameCompound
		.split("$")
		.map((part) => part.trim());
	return { artifactName, deploymentName };
}

/**
 * Converts a string to a byte array of a specified length.
 *
 * @param input - The input string to be converted to bytes.
 * @param length - The desired length of the resulting byte array.
 * @returns A hex string representing the byte array of the specified length.
 *
 * If the byte array representation of the input string is shorter than the specified length,
 * it will be zero-padded to match the length. If it is longer, it will be truncated to the specified length.
 */
function stringToBytes(input: string, length: number): string {
	const bytesValue = ethers.getBytes(
		ethers.solidityPacked(["string"], [input]),
	);

	return bytesValue.length < length
		? ethers.zeroPadBytes(bytesValue, length)
		: ethers.dataSlice(bytesValue, 0, length);
}

/**
 * Converts a hexadecimal string to a UTF-8 string, removing any null characters.
 *
 * @param hexString - The hexadecimal string to convert.
 * @returns The converted UTF-8 string without null characters.
 */
function hexToString(hexString: string): string {
	// eslint-disable-next-line no-control-regex
	return ethers.toUtf8String(hexString).replace(/(\x00)/g, "");
}

export const Utils = {
	erc7201,
	erc1967Slot: {
		Implementation: erc1967ImplSlot,
		Beacon: erc1967BeaconSlot,
		Admin: erc1967AdminSlot,
	},
	abi: {
		getContractName,
		iterateInputs,
	},
	stringToBytes,
	hexToString,
};
