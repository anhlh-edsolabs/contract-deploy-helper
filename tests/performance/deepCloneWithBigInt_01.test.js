const assert = require("assert");
const { EncodingUtils } = require("../../dist/libs/encodingUtils");

// Helper function to check if two objects are deeply equal
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
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
    if (typeof obj1 !== "object" || obj1 === null) return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => {
        if (!keys2.includes(key)) return false;
        return deepEqual(obj1[key], obj2[key]);
    });
}

// Helper function to verify that BigInt values are preserved
function verifyBigIntPreservation(original, cloned) {
    if (typeof original === "bigint") {
        assert.strictEqual(typeof cloned, "bigint");
        assert.strictEqual(cloned.toString(), original.toString());
        return true;
    }
    
    if (Array.isArray(original)) {
        original.forEach((item, index) => {
            verifyBigIntPreservation(item, cloned[index]);
        });
        return true;
    }
    
    if (typeof original === "object" && original !== null) {
        Object.keys(original).forEach(key => {
            verifyBigIntPreservation(original[key], cloned[key]);
        });
        return true;
    }
    
    return true;
}

// Test function
function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
    }
}

console.log("Running deepCloneWithBigInt_01.test.js");
console.log("----------------------------------------");

// Basic functionality tests
test("should clone primitive values correctly", () => {
    const testCases = [
        null,
        undefined,
        42,
        "hello",
        true,
        false,
        Symbol("test")
    ];
    
    testCases.forEach(value => {
        const cloned = EncodingUtils.deepCloneWithBigInt(value);
        assert.deepStrictEqual(cloned, value);
    });
});

test("should clone arrays correctly", () => {
    const original = [1, "two", { three: 3 }, [4, 5, 6]];
    const cloned = EncodingUtils.deepCloneWithBigInt(original);
    
    assert.notStrictEqual(cloned, original);
    assert.deepStrictEqual(cloned, original);
    assert.notStrictEqual(cloned[2], original[2]);
    assert.notStrictEqual(cloned[3], original[3]);
});

test("should clone objects correctly", () => {
    const original = {
        a: 1,
        b: "two",
        c: { d: 3, e: [4, 5] },
        f: null
    };
    const cloned = EncodingUtils.deepCloneWithBigInt(original);
    
    assert.notStrictEqual(cloned, original);
    assert.deepStrictEqual(cloned, original);
    assert.notStrictEqual(cloned.c, original.c);
    assert.notStrictEqual(cloned.c.e, original.c.e);
});

// Hex value handling tests
test("should preserve Ethereum addresses", () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    const cloned = EncodingUtils.deepCloneWithBigInt(address);
    
    assert.strictEqual(cloned, address);
    assert.strictEqual(typeof cloned, "string");
});

test("should convert 32-byte hex values to String", () => {
    const hash32 = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const cloned = EncodingUtils.deepCloneWithBigInt(hash32);
    
    assert.strictEqual(typeof cloned, "string");
    assert.strictEqual(cloned, hash32);
});

test("should convert 64-byte hex values to String", () => {
    const hash64 = "0x12345678901234567890123456789012345678901234567890123456789012341234567890123456789012345678901234567890123456789012345678901234";
    const cloned = EncodingUtils.deepCloneWithBigInt(hash64);
    
    assert.strictEqual(typeof cloned, "string");
    assert.strictEqual(cloned, hash64);
});

test("should handle other valid hex values", () => {
    const hexValues = [
        "0x1234",
        "0xabcd",
        "0xffffffffffffffff"
    ];
    
    hexValues.forEach(hex => {
        const cloned = EncodingUtils.deepCloneWithBigInt(hex);
        assert.strictEqual(typeof cloned, "bigint");
        assert.strictEqual(cloned.toString(16), hex.slice(2));
    });
});

test("should preserve invalid hex values as strings", () => {
    const invalidHex = "0xnothex";
    const cloned = EncodingUtils.deepCloneWithBigInt(invalidHex);
    
    assert.strictEqual(cloned, invalidHex);
    assert.strictEqual(typeof cloned, "string");
});

// Nested structures with hex values tests
test("should handle nested objects with hex values", () => {
    const original = {
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        hash: "0x1234567890123456789012345678901234567890123456789012345678901234",
        nested: {
            addr: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            value: "0xabcd"
        }
    };
    
    const cloned = EncodingUtils.deepCloneWithBigInt(original);
    
    assert.strictEqual(cloned.address, original.address);
    assert.strictEqual(typeof cloned.hash, "string");
    assert.strictEqual(cloned.nested.addr, original.nested.addr);
    assert.strictEqual(typeof cloned.nested.value, "bigint");
});

test("should handle arrays with hex values", () => {
    const original = {
        addresses: [
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        ],
        hashes: [
            "0x1234567890123456789012345678901234567890123456789012345678901234",
            "0x1234567890123456789012345678901234567890123456789012345678901234"
        ]
    };
    
    const cloned = EncodingUtils.deepCloneWithBigInt(original);
    
    assert.strictEqual(cloned.addresses[0], original.addresses[0]);
    assert.strictEqual(cloned.addresses[1], original.addresses[1]);
    assert.strictEqual(typeof cloned.hashes[0], "string");
    assert.strictEqual(typeof cloned.hashes[1], "string");
});

// Edge cases tests
test("should handle empty objects and arrays", () => {
    const emptyObj = {};
    const emptyArr = [];
    
    const clonedObj = EncodingUtils.deepCloneWithBigInt(emptyObj);
    const clonedArr = EncodingUtils.deepCloneWithBigInt(emptyArr);
    
    assert.deepStrictEqual(clonedObj, emptyObj);
    assert.deepStrictEqual(clonedArr, emptyArr);
});

test("should handle circular references", () => {
    const circular = { a: 1 };
    circular.self = circular;
    
    // This should not throw an error
    const cloned = EncodingUtils.deepCloneWithBigInt(circular);
    assert.strictEqual(cloned.self, cloned);
});

test("should handle Date objects", () => {
    const date = new Date();
    const cloned = EncodingUtils.deepCloneWithBigInt(date);
    
    assert.ok(cloned instanceof Date);
    assert.strictEqual(cloned.getTime(), date.getTime());
});

test("should handle BigInt values directly", () => {
    const bigIntValue = BigInt("12345678901234567890");
    const cloned = EncodingUtils.deepCloneWithBigInt(bigIntValue);
    
    assert.strictEqual(typeof cloned, "bigint");
    assert.strictEqual(cloned.toString(), bigIntValue.toString());
});

test("should handle complex nested structures", () => {
    const complex = {
        addresses: [
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        ],
        hashes: [
            "0x1234567890123456789012345678901234567890123456789012345678901234",
            "0x1234567890123456789012345678901234567890123456789012345678901234"
        ],
        numbers: [1, 2, 3, 4, 5],
        nested: {
            value: "0x1234567890",
            array: [
                {
                    addr: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    hash: "0x1234567890123456789012345678901234567890123456789012345678901234"
                }
            ]
        }
    };
    
    const cloned = EncodingUtils.deepCloneWithBigInt(complex);
    
    // Verify the structure is preserved
    assert.ok(deepEqual(cloned, complex));
    
    // Verify BigInt values are preserved
    assert.ok(verifyBigIntPreservation(complex, cloned));
    
    // Verify specific values
    assert.strictEqual(cloned.addresses[0], complex.addresses[0]);
    assert.strictEqual(typeof cloned.hashes[0], "string");
    assert.deepStrictEqual(cloned.numbers, complex.numbers);
    assert.strictEqual(typeof cloned.nested.value, "bigint");
    assert.strictEqual(cloned.nested.array[0].addr, complex.nested.array[0].addr);
    assert.strictEqual(typeof cloned.nested.array[0].hash, "string");
});

console.log("\nAll tests completed!"); 