const { EncodingUtils } = require("../../dist/libs/encodingUtils");

// Sample data with various hex values and nested structures
const testData = {
	address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	hash32: "0x1234567890123456789012345678901234567890123456789012345678901234",
	hash64: "0x12345678901234567890123456789012345678901234567890123456789012341234567890123456789012345678901234567890123456789012345678901234",
	smallHex: "0x1234",
	nested: {
		addresses: [
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		],
		hashes: [
			"0x1234567890123456789012345678901234567890123456789012345678901234",
			"0x1234567890123456789012345678901234567890123456789012345678901234",
		],
		numbers: [1, 2, 3, 4, 5],
		deepNested: {
			value: "0x1234567890123456789012345678901234567890123456789012345678901234",
			array: [
				{
					addr: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
					hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
				},
			],
		},
	},
};

// Create a larger dataset for more realistic testing
const largeTestData = {
	...testData,
	largeArray: Array(100)
		.fill()
		.map((_, i) => ({
			id: i,
			address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
			hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
			value: BigInt(i * 1000000),
		})),
};

// Number of iterations for the test
const ITERATIONS = 1000;

// Function to measure execution time
function measureExecutionTime(fn, iterations) {
	const start = process.hrtime.bigint();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const end = process.hrtime.bigint();
	return Number(end - start) / 1e6; // Convert to milliseconds
}

console.log("Running performance-test_01.test.js");
console.log("----------------------------------------");

// Run performance tests
console.log(`Number of iterations: ${ITERATIONS}`);
console.log("----------------------------------------");

// Test the current implementation with small data
const currentSmallTime = measureExecutionTime(() => {
	EncodingUtils.deepCloneWithBigInt(testData);
}, ITERATIONS);

console.log(
	`Current implementation (small data): ${currentSmallTime.toFixed(2)}ms`,
);

// Test the current implementation with large data
const currentLargeTime = measureExecutionTime(() => {
	EncodingUtils.deepCloneWithBigInt(largeTestData);
}, ITERATIONS / 10); // Fewer iterations for large data

console.log(
	`Current implementation (large data): ${currentLargeTime.toFixed(2)}ms`,
);

// Create a copy of the utils file with the old implementation
const oldUtils = { ...EncodingUtils };
oldUtils.deepCloneWithBigInt = function (obj) {
	const jsonString = JSON.stringify(obj);
	const clonedObj = JSON.parse(jsonString);

	function convertValue(value) {
		if (value === null || typeof value !== "object") {
			if (typeof value === "string" && value.startsWith("0x")) {
				if (value.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(value)) {
					return value;
				}
				try {
					return BigInt(value);
				} catch {
					return value;
				}
			}
			return value;
		}
		return convertBigIntStrings(value);
	}

	function convertBigIntStrings(obj) {
		if (Array.isArray(obj)) {
			return obj.map(convertValue);
		}

		const result = {};
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				result[key] = convertValue(obj[key]);
			}
		}
		return result;
	}

	return convertBigIntStrings(clonedObj);
};

// Test the old implementation with small data
const oldSmallTime = measureExecutionTime(() => {
	oldUtils.deepCloneWithBigInt(testData);
}, ITERATIONS);

console.log(`Old implementation (small data): ${oldSmallTime.toFixed(2)}ms`);

// Test the old implementation with large data
const oldLargeTime = measureExecutionTime(() => {
	oldUtils.deepCloneWithBigInt(largeTestData);
}, ITERATIONS / 10); // Fewer iterations for large data

console.log(`Old implementation (large data): ${oldLargeTime.toFixed(2)}ms`);

console.log("----------------------------------------");
console.log(
	`Performance difference (small data): ${(
		((currentSmallTime - oldSmallTime) / oldSmallTime) *
		100
	).toFixed(2)}%`,
);
console.log(
	`Performance difference (large data): ${(
		((currentLargeTime - oldLargeTime) / oldLargeTime) *
		100
	).toFixed(2)}%`,
);

// Verify correctness
console.log("\nVerifying correctness...");
const currentResult = EncodingUtils.deepCloneWithBigInt(testData);
const oldResult = oldUtils.deepCloneWithBigInt(testData);

// Deep equality check
function deepEqual(obj1, obj2) {
	if (obj1 === obj2) return true;
	if (typeof obj1 !== typeof obj2) return false;
	if (typeof obj1 !== "object" || obj1 === null) return obj1 === obj2;

	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) return false;

	return keys1.every((key) => {
		if (!keys2.includes(key)) return false;
		return deepEqual(obj1[key], obj2[key]);
	});
}

console.log("Results are identical:", deepEqual(currentResult, oldResult));
