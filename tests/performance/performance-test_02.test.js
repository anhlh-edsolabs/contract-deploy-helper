const { deepCloneWithBigInt: newDeepClone } = require('../../dist/libs/encodingUtils');
const { previousDeepCloneWithBigInt: oldDeepClone } = require('./scripts/prev_deepclone');
// const { deepCloneWithBigInt: oldDeepClone } = require('./scripts/bigint');

// Helper function to measure execution time
function measureExecutionTime(fn, iterations = 1000) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6; // Convert to milliseconds
    return duration;
}

// Test data
const testData = {
    primitive: 42,
    string: "Hello World",
    array: [1, 2, 3, 4, 5],
    object: { a: 1, b: 2, c: 3 },
    ethereumAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    hex32Byte: "0x0000000000000000000000000000000000000000000000000000000000000123",
    hex64Byte: "0x0000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000456",
    bigInt: BigInt("0x123"),
    date: new Date(),
    nested: {
        a: {
            b: {
                c: "deep nested"
            }
        }
    },
    complex: {
        addresses: [
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            "0x1234567890123456789012345678901234567890"
        ],
        hexValues: [
            "0x0000000000000000000000000000000000000000000000000000000000000123",
            "0x0000000000000000000000000000000000000000000000000000000000000456"
        ],
        nested: {
            data: {
                value: "test",
                numbers: [1, 2, 3, 4, 5],
                hex: "0x0000000000000000000000000000000000000000000000000000000000000789"
            }
        }
    }
};

// Create a circular reference
const circularObj = { a: 1 };
circularObj.self = circularObj;

function runComparison(name, data) {
    console.log(`\nTest: ${name}`);
    console.log("-".repeat(50));

    // Test current implementation
    const currentTime = measureExecutionTime(() => newDeepClone(data));
    console.log("Current Implementation:");
    console.log(`Total time: ${currentTime.toFixed(2)} ms for 1000 iterations`);
    console.log(`Average time: ${(currentTime / 1000).toFixed(4)} ms per iteration`);

    // Test previous implementation
    const previousTime = measureExecutionTime(() => oldDeepClone(data));
    console.log("\nPrevious Implementation:");
    console.log(`Total time: ${previousTime.toFixed(2)} ms for 1000 iterations`);
    console.log(`Average time: ${(previousTime / 1000).toFixed(4)} ms per iteration`);

    // Calculate improvement
    const improvement = ((previousTime - currentTime) / previousTime) * 100;
    console.log(`\nImprovement: ${improvement.toFixed(2)}%`);
}

console.log("Running performance-test_02.test.js");
console.log("----------------------------------------");

console.log("Performance Comparison");
console.log("=====================");

// Run comparisons for different test cases
runComparison("Simple object", { a: 1, b: 2, c: 3 });
runComparison("Array with hex values", [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "0x0000000000000000000000000000000000000000000000000000000000000123",
    "0x0000000000000000000000000000000000000000000000000000000000000456"
]);
runComparison("Complex nested structure", testData.complex);
runComparison("Circular reference", circularObj);
runComparison("Full test data", testData);

// Verify correctness
console.log("\nCorrectness Verification");
console.log("=====================");

const currentClone = newDeepClone(testData);
const previousClone = oldDeepClone(testData);

function compareResults(name, current, previous) {
    console.log(`\n${name}:`);
    console.log(`Current implementation: ${current}`);
    console.log(`Previous implementation: ${previous}`);
    console.log(`Match: ${current === previous ? "✅" : "❌"}`);
}

compareResults(
    "Ethereum address handling",
    typeof currentClone.ethereumAddress,
    typeof previousClone.ethereumAddress
);

compareResults(
    "32-byte hex handling",
    typeof currentClone.hex32Byte,
    typeof previousClone.hex32Byte
);

compareResults(
    "64-byte hex handling",
    typeof currentClone.hex64Byte,
    typeof previousClone.hex64Byte
);

console.log("\nPerformance comparison completed!"); 