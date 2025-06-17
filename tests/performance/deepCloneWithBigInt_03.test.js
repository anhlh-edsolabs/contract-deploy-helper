// Import both implementations
// const { deepCloneWithBigInt: newDeepClone } = require('../../scripts/utils/bigint');
const { deepCloneWithBigInt: oldDeepClone } = require("./scripts/bigint");
const { deepCloneWithBigInt: newDeepClone } = require("../../dist/libs/encodingUtils");
const ethers = require("ethers");

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
            array: Array(width).fill(null).map(() => generateRandomBigInt())
        };
    }

    const obj = {};
    for (let i = 0; i < width; i++) {
        obj[`key${i}`] = createTestObject(depth - 1, width);
    }
    obj.addresses = Array(width).fill(null).map(() => generateRandomAddress());
    obj.bigInts = Array(width).fill(null).map(() => generateRandomBigInt());
    return obj;
}

// Helper function to create an object with circular references
function createCircularObject(depth, width) {
    const obj = createTestObject(depth, width);
    
    // Add circular references
    obj.self = obj;
    obj.nested = {
        parent: obj,
        data: createTestObject(2, 3)
    };
    
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
        result
    };
}

// Helper function to calculate object stats
function calculateObjectStats(obj, visited = new WeakSet()) {
    let size = 0;
    let bigIntCount = 0;
    let addressCount = 0;

    function traverse(value) {
        if (value === null || typeof value !== 'object') {
            if (typeof value === 'bigint') {
                bigIntCount++;
                size += 8; // Approximate size of BigInt
            } else if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
                addressCount++;
                size += 42; // Size of Ethereum address
            } else if (typeof value === 'string') {
                size += value.length;
            } else {
                size += 8; // Approximate size of primitive values
            }
            return;
        }

        if (visited.has(value)) {
            return; // Skip circular references
        }

        visited.add(value);

        if (Array.isArray(value)) {
            size += 8; // Array overhead
            value.forEach(item => traverse(item));
        } else {
            size += 8; // Object overhead
            for (const key in value) {
                size += key.length; // Key size
                traverse(value[key]);
            }
        }
    }

    traverse(obj);
    return {
        size: size / 1024, // Convert to KB
        bigIntCount,
        addressCount
    };
}

// Helper function to check if two objects are deeply equal
function deepEqual(obj1, obj2, seen = new WeakMap()) {
    // Handle primitive types and null
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null) return obj1 === obj2;
    
    // Handle different types
    if (typeof obj1 !== typeof obj2) {
        // Handle case where one is BigInt and other is hex string
        if ((typeof obj1 === 'bigint' && typeof obj2 === 'string' && obj2.startsWith('0x')) ||
            (typeof obj2 === 'bigint' && typeof obj1 === 'string' && obj1.startsWith('0x'))) {
            const bigIntVal = typeof obj1 === 'bigint' ? obj1 : obj2;
            const hexStr = typeof obj1 === 'string' ? obj1 : obj2;
            return bigIntVal.toString(16) === hexStr.slice(2);
        }
        return false;
    }
    
    // Handle non-object types
    if (typeof obj1 !== "object") return obj1 === obj2;
    
    // Handle circular references
    if (seen.has(obj1) && seen.has(obj2)) {
        // For circular references, we just need to check if they're both circular
        return true;
    }
    
    // Handle Date objects
    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }
    
    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        
        // Mark objects as seen
        seen.set(obj1, obj1);
        seen.set(obj2, obj2);
        
        // Compare array elements
        for (let i = 0; i < obj1.length; i++) {
            if (!deepEqual(obj1[i], obj2[i], seen)) return false;
        }
        
        return true;
    }
    
    // Handle objects
    if (Array.isArray(obj1) || Array.isArray(obj2)) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    // Mark objects as seen
    seen.set(obj1, obj1);
    seen.set(obj2, obj2);
    
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key], seen)) return false;
    }
    
    return true;
}

// Test cases with different object sizes and complexities
const testCases = [
    { depth: 1, width: 10, name: "Small object" },
    { depth: 3, width: 5, name: "Medium nested object" },
    { depth: 5, width: 3, name: "Deep nested object" },
    { depth: 2, width: 20, name: "Wide object" },
    { depth: 4, width: 10, name: "Large complex object" }
];

// Circular reference test cases
const circularTestCases = [
    { depth: 1, width: 5, name: "Small circular object" },
    { depth: 3, width: 3, name: "Medium circular object" },
    { depth: 5, width: 2, name: "Deep circular object" }
];

console.log("Running deepCloneWithBigInt_03.test.js");
console.log("----------------------------------------");

// Run performance tests
console.log("Performance Test Results - Regular Objects:\n");
console.log("Test Case | Implementation | Execution Time (ms) | Memory Usage (MB) | Size (KB) | BigInts | Addresses");
console.log("-".repeat(100));

for (const testCase of testCases) {
    const testObj = createTestObject(testCase.depth, testCase.width);
    const stats = calculateObjectStats(testObj);

    // Warm up the functions to avoid JIT compilation overhead
    newDeepClone(testObj);
    oldDeepClone(testObj);

    // Measure performance for new implementation (average of 3 runs)
    let totalTimeNew = 0;
    let totalMemoryNew = 0;
    let resultNew;
    
    for (let i = 0; i < 3; i++) {
        const perf = measurePerformance(newDeepClone, testObj);
        totalTimeNew += perf.executionTime;
        totalMemoryNew += perf.heapUsed;
        resultNew = perf.result;
    }
    
    const avgTimeNew = totalTimeNew / 3;
    const avgMemoryNew = totalMemoryNew / 3;
    
    // Measure performance for old implementation (average of 3 runs)
    let totalTimeOld = 0;
    let totalMemoryOld = 0;
    let resultOld;
    
    for (let i = 0; i < 3; i++) {
        const perf = measurePerformance(oldDeepClone, testObj);
        totalTimeOld += perf.executionTime;
        totalMemoryOld += perf.heapUsed;
        resultOld = perf.result;
    }
    
    const avgTimeOld = totalTimeOld / 3;
    const avgMemoryOld = totalMemoryOld / 3;
    
    // Verify that both implementations produce the same result
    const isEqual = deepEqual(resultNew, resultOld);
    
    console.log(`${testCase.name} | New | ${avgTimeNew.toFixed(2)} | ${avgMemoryNew.toFixed(2)} | ${stats.size.toFixed(2)} | ${stats.bigIntCount} | ${stats.addressCount}`);
    console.log(`${testCase.name} | Old | ${avgTimeOld.toFixed(2)} | ${avgMemoryOld.toFixed(2)} | ${stats.size.toFixed(2)} | ${stats.bigIntCount} | ${stats.addressCount}`);
    console.log(`${testCase.name} | Diff | ${((avgTimeNew - avgTimeOld) / avgTimeOld * 100).toFixed(2)}% | ${((avgMemoryNew - avgMemoryOld) / avgMemoryOld * 100).toFixed(2)}% | - | - | -`);
    console.log("-".repeat(100));
}

// Run performance tests for circular references
console.log("\nPerformance Test Results - Circular References:\n");
console.log("Test Case | Implementation | Execution Time (ms) | Memory Usage (MB) | Size (KB) | BigInts | Addresses");
console.log("-".repeat(100));

for (const testCase of circularTestCases) {
    const testObj = createCircularObject(testCase.depth, testCase.width);
    const stats = calculateObjectStats(testObj);

    // Warm up the functions to avoid JIT compilation overhead
    newDeepClone(testObj);
    oldDeepClone(testObj);

    // Measure performance for new implementation (average of 3 runs)
    let totalTimeNew = 0;
    let totalMemoryNew = 0;
    let resultNew;
    
    for (let i = 0; i < 3; i++) {
        const perf = measurePerformance(newDeepClone, testObj);
        totalTimeNew += perf.executionTime;
        totalMemoryNew += perf.heapUsed;
        resultNew = perf.result;
    }
    
    const avgTimeNew = totalTimeNew / 3;
    const avgMemoryNew = totalMemoryNew / 3;
    
    // Measure performance for old implementation (average of 3 runs)
    let totalTimeOld = 0;
    let totalMemoryOld = 0;
    let resultOld;
    
    for (let i = 0; i < 3; i++) {
        const perf = measurePerformance(oldDeepClone, testObj);
        totalTimeOld += perf.executionTime;
        totalMemoryOld += perf.heapUsed;
        resultOld = perf.result;
    }
    
    const avgTimeOld = totalTimeOld / 3;
    const avgMemoryOld = totalMemoryOld / 3;
    
    // Verify that both implementations produce the same result
    const isEqual = deepEqual(resultNew, resultOld);
    
    console.log(`${testCase.name} | New | ${avgTimeNew.toFixed(2)} | ${avgMemoryNew.toFixed(2)} | ${stats.size.toFixed(2)} | ${stats.bigIntCount} | ${stats.addressCount}`);
    console.log(`${testCase.name} | Old | ${avgTimeOld.toFixed(2)} | ${avgMemoryOld.toFixed(2)} | ${stats.size.toFixed(2)} | ${stats.bigIntCount} | ${stats.addressCount}`);
    console.log(`${testCase.name} | Diff | ${((avgTimeNew - avgTimeOld) / avgTimeOld * 100).toFixed(2)}% | ${((avgMemoryNew - avgMemoryOld) / avgMemoryOld * 100).toFixed(2)}% | - | - | -`);
    console.log("-".repeat(100));
} 