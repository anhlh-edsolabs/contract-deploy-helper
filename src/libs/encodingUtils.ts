import { ethers } from "ethers";

// Cache regex patterns and create lookup for hex characters
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HEX_CHARS = new Set("0123456789abcdefABCDEF");

// Add BigInt serializer to handle JSON serialization
BigInt.prototype.toJSON = function () {
	return "0x" + this.toString(16).padStart(64, "0");
};

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

export const EncodingUtils = {
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
