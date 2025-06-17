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
export function stringToBytes(input: string, length: number): string {
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
export function hexToString(hexString: string): string {
	// eslint-disable-next-line no-control-regex
	return ethers.toUtf8String(hexString).replace(/(\x00)/g, "");
}

/**
 * Checks if a string is a valid hex string.
 *
 * @param str - The string to check.
 * @param start - The index to start checking from.
 * @returns True if the string is a valid hex string, false otherwise.
 */
export function isValidHex(str: string, start = 2): boolean {
	for (let i = start; i < str.length; i++) {
		if (!HEX_CHARS.has(str[i])) return false;
	}
	return true;
}

/**
 * Deep clones an object, handling BigInt values and circular references.
 *
 * @param obj - The object to clone.
 * @param seen - A WeakMap to track visited objects and prevent infinite recursion.
 * @returns A deep clone of the input object.
 */
export function deepCloneWithBigInt(obj: any, seen = new WeakMap()) {
	// Handle primitive types and null
	if (obj === null || typeof obj !== "object") {
		if (typeof obj === "string" && obj.startsWith("0x")) {
			const len = obj.length;

			// Fast path for addresses (0x + 40 hex chars) - CRITICAL
			if (len === 42 && ADDRESS_REGEX.test(obj)) {
				return obj;
			}

			// Process any hex value longer than 20 bytes (> 42 chars) with zero stripping
			if ((len - 2) % 2 === 0 && len > 42 && isValidHex(obj)) {
				// Count leading zeros without string allocation
				let leadingZeros = 0;
				for (let i = 2; i < len && obj[i] === "0"; i++) {
					leadingZeros++;
				}

				// If effective length < 40 chars, convert to BigInt
				if (len - 2 - leadingZeros < 40) {
					return BigInt(obj);
				}

				// Keep as string for addresses (20 bytes), hashes (32 bytes), and larger values
				return obj;
			}

			// Process smaller values (< 42 chars) with zero stripping
			if ((len - 2) % 2 === 0 && len < 42 && isValidHex(obj)) {
				// Count leading zeros without string allocation
				let leadingZeros = 0;
				for (let i = 2; i < len && obj[i] === "0"; i++) {
					leadingZeros++;
				}

				// If effective length < 40 chars, convert to BigInt
				if (len - 2 - leadingZeros < 40) {
					return BigInt(obj);
				}
			}

			return obj;
		}
		return obj;
	}

	// Handle Date objects
	if (obj instanceof Date) {
		return new Date(obj);
	}

	// Handle BigInt
	if (typeof obj === "bigint") {
		return obj;
	}

	// Check for circular references
	if (seen.has(obj)) {
		return seen.get(obj);
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		const clone: any[] = [];
		seen.set(obj, clone);

		for (let i = 0; i < obj.length; i++) {
			clone[i] = deepCloneWithBigInt(obj[i], seen);
		}

		return clone;
	}

	// Handle objects
	const clone: { [key: string]: any } = {};
	seen.set(obj, clone);

	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			clone[key] = deepCloneWithBigInt(obj[key], seen);
		}
	}

	return clone;
}

export const EncodingUtils = {
	stringToBytes,
	hexToString,
	isValidHex,
	deepCloneWithBigInt,
};
