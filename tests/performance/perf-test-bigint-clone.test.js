const ethers = require("ethers");
const { EncodingUtils } = require("../../dist/libs/encodingUtils");

// Helper function to generate a random Ethereum address
function generateRandomAddress() {
	return ethers.Wallet.createRandom().address;
}

// Helper function to generate a random BigInt value
function generateRandomBigInt() {
	// Generate a random integer between 1 and 100 and convert to wei
	return ethers.parseEther(Math.floor(Math.random() * 100 + 1).toString());
}

// Helper function to create a test object with specified depth and width
function createTestObject(depth, width) {
	if (depth === 0) {
		return {
			bigInt: generateRandomBigInt(),
			address: generateRandomAddress(),
			array: Array(width)
				.fill(null)
				.map(() => generateRandomBigInt()),
		};
	}

	const obj = {};
	for (let i = 0; i < width; i++) {
		obj[`key${i}`] = createTestObject(depth - 1, width);
	}
	obj.addresses = Array(width)
		.fill(null)
		.map(() => generateRandomAddress());
	obj.bigInts = Array(width)
		.fill(null)
		.map(() => generateRandomBigInt());
	return obj;
}

// Helper function to measure execution time and memory usage
function measurePerformance(fn, ...args) {
	// Force garbage collection if available (requires --expose-gc flag)
	if (global.gc) {
		global.gc();
	}

	const startMemory = process.memoryUsage();
	const startTime = process.hrtime.bigint();

	const result = fn(...args);

	const endTime = process.hrtime.bigint();
	const endMemory = process.memoryUsage();

	const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
	const heapUsed = endMemory.heapUsed - startMemory.heapUsed;

	return {
		executionTime,
		heapUsed: heapUsed / 1024 / 1024, // Convert to MB
		result,
	};
}

// Helper function to calculate object stats
function calculateObjectStats(obj) {
	const serialized = JSON.stringify(obj);
	const size = Buffer.byteLength(serialized) / 1024; // Size in KB

	let bigIntCount = 0;
	let addressCount = 0;

	JSON.stringify(obj, (_, value) => {
		if (typeof value === "string") {
			if (value.startsWith("0x") && value.length === 42) addressCount++;
			else if (value.startsWith("0x")) bigIntCount++;
		}
		return value;
	});

	return { size, bigIntCount, addressCount };
}

// Test cases with different object sizes and complexities
const testCases = [
	{ depth: 1, width: 10, name: "Small object" },
	{ depth: 3, width: 5, name: "Medium nested object" },
	{ depth: 5, width: 3, name: "Deep nested object" },
	{ depth: 2, width: 20, name: "Wide object" },
	{ depth: 4, width: 10, name: "Large complex object" },
];

console.log("Running perf-test-bigint-clone.test.js");
console.log("----------------------------------------");

// Run performance tests
console.log("Performance Test Results:\n");
console.log(
	"Test Case | Execution Time (ms) | Memory Usage (MB) | Size (KB) | BigInts | Addresses",
);
console.log("-".repeat(90));

for (const testCase of testCases) {
	const testObj = createTestObject(testCase.depth, testCase.width);
	const stats = calculateObjectStats(testObj);

	// Warm up the function to avoid JIT compilation overhead
	EncodingUtils.deepCloneWithBigInt(testObj);

	// Measure actual performance (average of 3 runs)
	let totalTime = 0;
	let totalMemory = 0;
	const runs = 3;

	for (let i = 0; i < runs; i++) {
		const { executionTime, heapUsed } = measurePerformance(
			EncodingUtils.deepCloneWithBigInt,
			testObj,
		);
		totalTime += executionTime;
		totalMemory += heapUsed;
	}

	console.log(
		`${testCase.name.padEnd(20)} | ` +
			`${(totalTime / runs).toFixed(3).padStart(10)} ms     | ` +
			`${(totalMemory / runs).toFixed(2).padStart(8)} MB    | ` +
			`${stats.size.toFixed(2).padStart(8)} KB | ` +
			`${stats.bigIntCount.toString().padStart(7)}  | ` +
			`${stats.addressCount.toString().padStart(9)}`,
	);
}

// Test memory stability with repeated calls
console.log("\nMemory Stability Test (1000 iterations):");
const baseObj = createTestObject(2, 5);
const initialMemory = process.memoryUsage().heapUsed;

for (let i = 0; i < 1000; i++) {
	EncodingUtils.deepCloneWithBigInt(baseObj);

	if (i % 200 === 0) {
		const currentMemory = process.memoryUsage().heapUsed;
		const memoryDiff = (currentMemory - initialMemory) / 1024 / 1024;
		console.log(`Iteration ${i}: Memory diff: ${memoryDiff.toFixed(2)} MB`);
	}
}

// Test with large arrays
console.log("\nLarge Array Test:");
const largeArray = Array(10000)
	.fill(null)
	.map(() => ({
		value: generateRandomBigInt(),
		address: generateRandomAddress(),
	}));

const arrayStats = calculateObjectStats(largeArray);
const arrayResult = measurePerformance(EncodingUtils.deepCloneWithBigInt, largeArray);

console.log(`10000 items array:
- Execution time: ${arrayResult.executionTime.toFixed(3)} ms
- Memory usage: ${arrayResult.heapUsed.toFixed(2)} MB
- Object size: ${arrayStats.size.toFixed(2)} KB
- BigInt count: ${arrayStats.bigIntCount}
- Address count: ${arrayStats.addressCount}`);

// Compare with JSON.parse/stringify (without BigInt handling)
console.log("\nComparison with JSON.parse/stringify (simple object):");
const simpleObj = createTestObject(2, 5);
const simpleStats = calculateObjectStats(simpleObj);

const normalClone = measurePerformance(
	(obj) => JSON.parse(JSON.stringify(obj)),
	simpleObj,
);
const bigIntClone = measurePerformance(EncodingUtils.deepCloneWithBigInt, simpleObj);

console.log(`JSON.parse/stringify:
- Execution time: ${normalClone.executionTime.toFixed(3)} ms
- Memory usage: ${normalClone.heapUsed.toFixed(2)} MB
- Object size: ${simpleStats.size.toFixed(2)} KB`);

console.log(`\ndeepCloneWithBigInt:
- Execution time: ${bigIntClone.executionTime.toFixed(3)} ms
- Memory usage: ${bigIntClone.heapUsed.toFixed(2)} MB
- Object size: ${simpleStats.size.toFixed(2)} KB`);
