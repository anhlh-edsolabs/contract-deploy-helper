const { EncodingUtils } = require("../../dist/libs/encodingUtils");

// Test data
const testData = {
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    hex32Byte: "0x0000000000000000000000000000000000000000000000000000000000000123",
    hex64Byte: "0x0000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000456",
    otherHex: "0x1234",
    nested: {
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        hex32Byte: "0x0000000000000000000000000000000000000000000000000000000000000123",
        hex64Byte: "0x0000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000456",
        otherHex: "0x1234"
    },
    array: [
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "0x0000000000000000000000000000000000000000000000000000000000000123",
        "0x0000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000456",
        "0x1234"
    ]
};

console.log("Running deepCloneWithBigInt_04.test.js");
console.log("----------------------------------------");

// Clone the test data
const clonedData = EncodingUtils.deepCloneWithBigInt(testData);

// Verify the results
console.log("Verifying hex value handling...\n");

console.log("Original Data:");
console.log(`  Address: ${typeof testData.address} (${testData.address})`);
console.log(`  32-Byte Hex: ${typeof testData.hex32Byte} (${testData.hex32Byte})`);
console.log(`  64-Byte Hex: ${typeof testData.hex64Byte} (${testData.hex64Byte})`);
console.log(`  Other Hex: ${typeof testData.otherHex} (${testData.otherHex})`);
console.log(`  Nested Address: ${typeof testData.nested.address} (${testData.nested.address})`);
console.log(`  Nested 32-Byte Hex: ${typeof testData.nested.hex32Byte} (${testData.nested.hex32Byte})`);
console.log(`  Nested 64-Byte Hex: ${typeof testData.nested.hex64Byte} (${testData.nested.hex64Byte})`);
console.log(`  Nested Other Hex: ${typeof testData.nested.otherHex} (${testData.nested.otherHex})`);
console.log(`  Array[0]: ${typeof testData.array[0]} (${testData.array[0]})`);
console.log(`  Array[1]: ${typeof testData.array[1]} (${testData.array[1]})`);
console.log(`  Array[2]: ${typeof testData.array[2]} (${testData.array[2]})`);
console.log(`  Array[3]: ${typeof testData.array[3]} (${testData.array[3]})`);

console.log("\nCloned Data:");
console.log(`  Address: ${typeof clonedData.address} (${clonedData.address})`);
console.log(`  32-Byte Hex: ${typeof clonedData.hex32Byte} (${clonedData.hex32Byte})`);
console.log(`  64-Byte Hex: ${typeof clonedData.hex64Byte} (${clonedData.hex64Byte})`);
console.log(`  Other Hex: ${typeof clonedData.otherHex} (${clonedData.otherHex})`);
console.log(`  Nested Address: ${typeof clonedData.nested.address} (${clonedData.nested.address})`);
console.log(`  Nested 32-Byte Hex: ${typeof clonedData.nested.hex32Byte} (${clonedData.nested.hex32Byte})`);
console.log(`  Nested 64-Byte Hex: ${typeof clonedData.nested.hex64Byte} (${clonedData.nested.hex64Byte})`);
console.log(`  Nested Other Hex: ${typeof clonedData.nested.otherHex} (${clonedData.nested.otherHex})`);
console.log(`  Array[0]: ${typeof clonedData.array[0]} (${clonedData.array[0]})`);
console.log(`  Array[1]: ${typeof clonedData.array[1]} (${clonedData.array[1]})`);
console.log(`  Array[2]: ${typeof clonedData.array[2]} (${clonedData.array[2]})`);
console.log(`  Array[3]: ${typeof clonedData.array[3]} (${clonedData.array[3]})`);

// Verify that the cloned data is a deep copy
console.log("\nVerifying deep copy...");
console.log(`  Original and cloned are different objects: ${testData !== clonedData}`);
console.log(`  Nested objects are different: ${testData.nested !== clonedData.nested}`);
console.log(`  Arrays are different: ${testData.array !== clonedData.array}`);

// Verify that the values are preserved
console.log("\nVerifying value preservation...");
console.log(`  Address values match: ${testData.address === clonedData.address}`);
console.log(`  32-Byte Hex values match: ${testData.hex32Byte === clonedData.hex32Byte || BigInt(testData.hex32Byte) === clonedData.hex32Byte}`);
console.log(`  64-Byte Hex values match: ${testData.hex64Byte === clonedData.hex64Byte}`);
console.log(`  Other Hex values match: ${testData.otherHex === clonedData.otherHex || BigInt(testData.otherHex) === clonedData.otherHex}`); 