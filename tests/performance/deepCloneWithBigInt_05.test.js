const { deepCloneWithBigInt: oldDeepClone } = require("./scripts/bigint");
const { deepCloneWithBigInt: newDeepClone } = require("../../dist/libs/encodingUtils");


// Helper function to measure performance
function measurePerformance(fn, ...args) {
    if (global.gc) {
        global.gc();
    }
    const startMemory = process.memoryUsage();
    const startTime = process.hrtime.bigint();
    
    const result = fn(...args);
    
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    const memoryUsage = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024; // Convert to MB
    
    return {
        result,
        executionTime,
        memoryUsage
    };
}

// Test data generator
function generateTestData(size) {
    const data = {
        addresses: Array(size).fill("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
        hex32Bytes: Array(size).fill("0x0000000000000000000000000000000000000000000000000000000000000123"),
        hex64Bytes: Array(size).fill("0x0000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000456"),
        otherHex: Array(size).fill("0x1234"),
        numbers: Array(size).fill(123456789),
        nested: {
            level1: {
                level2: {
                    level3: {
                        value: "deep nested"
                    }
                }
            }
        }
    };
    return data;
}

// Test cases with different sizes
const testSizes = [10, 100, 1000];

console.log("Running deepCloneWithBigInt_05.test.js");
console.log("----------------------------------------");

console.log("Running performance tests comparing current and previous implementations...\n");

for (const size of testSizes) {
    console.log(`Test Size: ${size} items`);
    console.log("----------------------------------------");
    
    const testData = generateTestData(size);
    
    // Test previous implementation
    const previousResult = measurePerformance(oldDeepClone, testData);
    console.log(`Previous Implementation:`);
    console.log(`  Execution Time: ${previousResult.executionTime.toFixed(2)} ms`);
    console.log(`  Memory Usage: ${previousResult.memoryUsage.toFixed(2)} MB`);
    
    // Test current implementation
    const currentResult = measurePerformance(newDeepClone, testData);
    console.log(`\nCurrent Implementation:`);
    console.log(`  Execution Time: ${currentResult.executionTime.toFixed(2)} ms`);
    console.log(`  Memory Usage: ${currentResult.memoryUsage.toFixed(2)} MB`);
    
    // Calculate performance difference
    const timeDiff = ((currentResult.executionTime - previousResult.executionTime) / previousResult.executionTime * 100).toFixed(2);
    const memoryDiff = ((currentResult.memoryUsage - previousResult.memoryUsage) / previousResult.memoryUsage * 100).toFixed(2);
    
    console.log(`\nPerformance Comparison:`);
    console.log(`  Time Difference: ${timeDiff}%`);
    console.log(`  Memory Difference: ${memoryDiff}%`);
    
    console.log("\n" + "=".repeat(50) + "\n");
}

// Verify correct handling of hex values
console.log("Verifying hex value handling...\n");

const testObject = {
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    hex32Byte: "0x0000000000000000000000000000000000000000000000000000000000000123",
    hex64Byte: "0x0000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000456",
    otherHex: "0x1234"
};

console.log("Current Implementation:");
const currentResult = newDeepClone(testObject);
console.log(`  Address: ${typeof currentResult.address} (${currentResult.address})`);
console.log(`  32-Byte Hex: ${typeof currentResult.hex32Byte} (${currentResult.hex32Byte})`);
console.log(`  64-Byte Hex: ${typeof currentResult.hex64Byte} (${currentResult.hex64Byte})`);
console.log(`  Other Hex: ${typeof currentResult.otherHex} (${currentResult.otherHex})`);

console.log("\nPrevious Implementation:");
const previousResult = oldDeepClone(testObject);
console.log(`  Address: ${typeof previousResult.address} (${previousResult.address})`);
console.log(`  32-Byte Hex: ${typeof previousResult.hex32Byte} (${previousResult.hex32Byte})`);
console.log(`  64-Byte Hex: ${typeof previousResult.hex64Byte} (${previousResult.hex64Byte})`);
console.log(`  Other Hex: ${typeof previousResult.otherHex} (${previousResult.otherHex})`); 