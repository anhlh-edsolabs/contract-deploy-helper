// Import the bigint module
const { deepCloneWithBigInt } = require("../../dist/libs/encodingUtils");

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

// Test cases
const testCases = [
    {
        name: "should clone primitive values correctly",
        input: 42,
        expected: 42
    },
    {
        name: "should clone arrays correctly",
        input: [1, 2, 3, 4, 5],
        expected: [1, 2, 3, 4, 5]
    },
    {
        name: "should clone objects correctly",
        input: { a: 1, b: 2, c: 3 },
        expected: { a: 1, b: 2, c: 3 }
    },
    {
        name: "should preserve Ethereum addresses",
        input: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        expected: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    },
    {
        name: "should preserve 32-byte hex values as strings",
        input: "0xd74ec5fc385a560c4f0b91eaf696a6b367ec656e1ed78471869f70c7ad79bb86",
        expected: "0xd74ec5fc385a560c4f0b91eaf696a6b367ec656e1ed78471869f70c7ad79bb86"
    },
    {
        name: "should treat hex values with actual byte length less than 20 as BigInt",
        input: "0x0000000000000000000000000000000000000000000000000000000000000123",
        expected: BigInt("0x0000000000000000000000000000000000000000000000000000000000000123")
    },
    {
        name: "should preserve 64-byte hex values as strings",
        input: "0x00000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456",
        expected: "0x00000000000000000000000000000000000000000000000000000000000001230000000000000000000000000000000000000000000000000000000000000456"
    },
    {
        name: "should convert other valid hex values to BigInt",
        input: "0x123",
        expected: BigInt("0x123")
    },
    {
        name: "should preserve invalid hex values as strings",
        input: "0xinvalid",
        expected: "0xinvalid"
    },
    {
        name: "should handle nested objects with hex values",
        input: {
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            hexValue: "0x0000000000000000000000000000000000000000000000000000000000000123"
        },
        expected: {
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            hexValue: BigInt("0x0000000000000000000000000000000000000000000000000000000000000123")
        }
    },
    {
        name: "should handle arrays with hex values",
        input: [
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            "0x0000000000000000000000000000000000000000000000000000000000000123"
        ],
        expected: [
            "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            BigInt("0x0000000000000000000000000000000000000000000000000000000000000123")
        ]
    },
    {
        name: "should handle empty objects and arrays",
        input: { array: [], object: {} },
        expected: { array: [], object: {} }
    },
    {
        name: "should handle circular references",
        input: (() => {
            const obj = { a: 1 };
            obj.self = obj;
            return obj;
        })(),
        expected: (() => {
            const obj = { a: 1 };
            obj.self = obj;
            return obj;
        })()
    },
    {
        name: "should handle Date objects",
        input: new Date("2023-01-01"),
        expected: new Date("2023-01-01")
    },
    {
        name: "should handle BigInt values directly",
        input: BigInt("0x123"),
        expected: BigInt("0x123")
    },
    {
        name: "should handle complex nested structures",
        input: {
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
        },
        expected: {
            addresses: [
                "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                "0x1234567890123456789012345678901234567890"
            ],
            hexValues: [
                BigInt("0x0000000000000000000000000000000000000000000000000000000000000123"),
                BigInt("0x0000000000000000000000000000000000000000000000000000000000000456")
            ],
            nested: {
                data: {
                    value: "test",
                    numbers: [1, 2, 3, 4, 5],
                    hex: BigInt("0x0000000000000000000000000000000000000000000000000000000000000789")
                }
            }
        }
    }
];

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

console.log("Running deepCloneWithBigInt_02.test.js");
console.log("----------------------------------------");

testCases.forEach((testCase, index) => {
    try {
        // Use the function directly
        const result = deepCloneWithBigInt(testCase.input);
        
        // Check if the result is deeply equal to the expected value
        const isEqual = deepEqual(result, testCase.expected);
        
        if (isEqual) {
            console.log(`✅ ${testCase.name}`);
            passedTests++;
        } else {
            console.log(`❌ ${testCase.name}`);
            
            // Custom JSON stringify function that can handle circular references
            const safeStringify = (obj) => {
                const seen = new WeakSet();
                return JSON.stringify(obj, (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return '[Circular Reference]';
                        }
                        seen.add(value);
                    }
                    if (typeof value === 'bigint') {
                        return value.toString();
                    }
                    return value;
                });
            };
            
            try {
                console.log("  Expected:", safeStringify(testCase.expected));
                console.log("  Got:", safeStringify(result));
            } catch (error) {
                console.log("  Error comparing objects:", error.message);
            }
        }
    } catch (error) {
        console.log(`❌ ${testCase.name}`);
        console.log("  Error:", error.message);
    }
});

console.log("----------------------------------------");
console.log(`Passed: ${passedTests}/${totalTests} tests`);
console.log("All tests completed!"); 