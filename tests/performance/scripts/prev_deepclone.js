// Previous implementation for comparison
function previousDeepCloneWithBigInt(obj, seen = new WeakMap()) {
    // Handle primitive types and null
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string' && obj.startsWith('0x')) {
            // Check if it's an Ethereum address (0x + 40 hex chars)
            if (obj.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(obj)) {
                return obj;
            }
            // Try to convert other hex values to BigInt
            try {
                return BigInt(obj);
            } catch {
                return obj;
            }
        }
        return obj;
    }

    // Handle circular references
    if (seen.has(obj)) {
        return seen.get(obj);
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return new Date(obj);
    }

    // Handle BigInt
    if (typeof obj === 'bigint') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        const clone = [];
        seen.set(obj, clone);
        obj.forEach((item, index) => {
            clone[index] = previousDeepCloneWithBigInt(item, seen);
        });
        return clone;
    }

    // Handle regular objects
    const clone = {};
    seen.set(obj, clone);
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clone[key] = previousDeepCloneWithBigInt(obj[key], seen);
        }
    }
    
    return clone;
}

module.exports = {
    previousDeepCloneWithBigInt
};