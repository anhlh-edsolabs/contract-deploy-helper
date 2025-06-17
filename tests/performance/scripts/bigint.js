// Add BigInt serializer to handle JSON serialization
BigInt.prototype.toJSON = function () {
	return "0x" + this.toString(16);
};

// Cache regex patterns and create lookup for hex characters
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HEX_CHARS = new Set("0123456789abcdefABCDEF");

// Function to check if a string is valid hex
function isValidHex(str, start = 2) {
	for (let i = start; i < str.length; i++) {
		if (!HEX_CHARS.has(str[i])) return false;
	}
	return true;
}

// Efficient deep clone implementation
function deepCloneWithBigInt(obj, seen = new WeakMap()) {
	// Handle primitive types and null
	if (obj === null || typeof obj !== "object") {
		if (typeof obj === "string" && obj.startsWith("0x")) {
			const len = obj.length;

			// Fast path for addresses (0x + 40 hex chars)
			if (len === 42 && ADDRESS_REGEX.test(obj)) {
				return obj;
			}

			// Handle other hex values
			if ((len - 2) % 2 === 0 && isValidHex(obj)) {
				// Special handling for common lengths
				if (len === 66 || len === 130) {
					// 32 bytes or 64 bytes
					return obj; // Retain both 32-byte and 64-byte hex values as strings
				}

				// Handle other valid hex values
				try {
					return BigInt(obj);
				} catch {
					return obj;
				}
			}
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

	// Create the clone object/array before recursing to handle circular references
	const clone = Array.isArray(obj) ? [] : {};
	seen.set(obj, clone);

	// Handle arrays and objects
	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			clone[i] = deepCloneWithBigInt(obj[i], seen);
		}
	} else {
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				clone[key] = deepCloneWithBigInt(obj[key], seen);
			}
		}
	}

	return clone;
}

// // Default configuration object
// const DEFAULT_CONFIG = {
// 	config: {
// 		preserveAddresses: true,
// 		convertHexToBigInt: true,
// 		handleCircularReferences: true
// 	}
// };

// Export the functions and config
module.exports = {
	deepCloneWithBigInt,
	// DEFAULT_CONFIG
};
