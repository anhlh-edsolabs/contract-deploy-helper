const ethers = require("ethers");
const { expect } = require("chai");
const { EncodingUtils } = require("../../dist/libs/encodingUtils");

// Test object with both BigInt values and Ethereum addresses
const testObj = {
  name: "Test Object",
  bigIntValue: ethers.parseEther("1.5"),
  address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  nested: {
    anotherBigInt: ethers.parseEther("0.5"),
    anotherAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    array: [
      ethers.parseEther("0.1"),
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      ethers.parseEther("0.2")
    ]
  }
};

console.log("Running test-bigint-clone.test.js");
console.log("----------------------------------------");

console.log("Original object:");
console.log(JSON.stringify(testObj, null, 2));

// Clone the object
const clonedObj = EncodingUtils.deepCloneWithBigInt(testObj);

console.log("\nCloned object:");
console.log(JSON.stringify(clonedObj, null, 2));

describe("BigInt clone", () => {
  it("Should clone the object", () => {
    expect(clonedObj).to.deep.equal(testObj);
  });
  it("Should preserve the type of the bigIntValue", () => {
    expect(typeof clonedObj.bigIntValue).to.equal("bigint");
  });
  it("Original bigIntValue and cloned bigIntValue should be equal", () => {
    expect(testObj.bigIntValue).to.equal(clonedObj.bigIntValue);
  });
  it("Should preserve the type of the address", () => {
    expect(typeof clonedObj.address).to.equal("string");
  });
  it("Original address and cloned address should be equal", () => {
    expect(testObj.address).to.equal(clonedObj.address);
  });
  it("Should preserve the type of the nested.anotherBigInt", () => {
    expect(typeof clonedObj.nested.anotherBigInt).to.equal("bigint");
  });
  it("Original nested.anotherBigInt and cloned nested.anotherBigInt should be equal", () => {
    expect(testObj.nested.anotherBigInt).to.equal(clonedObj.nested.anotherBigInt);
  });
  it("Should preserve the type of the nested.anotherAddress", () => {
    expect(typeof clonedObj.nested.anotherAddress).to.equal("string");
  });
  it("Original nested.anotherAddress and cloned nested.anotherAddress should be equal", () => {
    expect(testObj.nested.anotherAddress).to.equal(clonedObj.nested.anotherAddress);
  });
  it("Should preserve the type of the nested.array[0]", () => {
    expect(typeof clonedObj.nested.array[0]).to.equal("bigint");
  });
  it("Original nested.array[0] and cloned nested.array[0] should be equal", () => {
    expect(testObj.nested.array[0]).to.equal(clonedObj.nested.array[0]);
  });
  it("Should preserve the type of the nested.array[1]", () => {
    expect(typeof clonedObj.nested.array[1]).to.equal("string");
  });
  it("Original nested.array[1] and cloned nested.array[1] should be equal", () => {
    expect(testObj.nested.array[1]).to.equal(clonedObj.nested.array[1]);
  });
  it("Should preserve the type of the nested.array[2]", () => {
    expect(typeof clonedObj.nested.array[2]).to.equal("bigint");
  });
  it("Original nested.array[2] and cloned nested.array[2] should be equal", () => {
    expect(testObj.nested.array[2]).to.equal(clonedObj.nested.array[2]);
  });
});

// Verify that BigInt values are preserved
console.log("\nVerification:");
console.log("Original bigIntValue type:", typeof testObj.bigIntValue);
console.log("Cloned bigIntValue type:", typeof clonedObj.bigIntValue);
console.log("Original bigIntValue value:", testObj.bigIntValue.toString());
console.log("Cloned bigIntValue value:", clonedObj.bigIntValue.toString());
console.log("Values are equal:", testObj.bigIntValue === clonedObj.bigIntValue);

// Verify that addresses are preserved as strings
console.log("\nAddress verification:");
console.log("Original address type:", typeof testObj.address);
console.log("Cloned address type:", typeof clonedObj.address);
console.log("Original address value:", testObj.address);
console.log("Cloned address value:", clonedObj.address);
console.log("Addresses are equal:", testObj.address === clonedObj.address);

// Verify nested objects
console.log("\nNested object verification:");
console.log("Original nested.anotherBigInt type:", typeof testObj.nested.anotherBigInt);
console.log("Cloned nested.anotherBigInt type:", typeof clonedObj.nested.anotherBigInt);
console.log("Original nested.anotherAddress type:", typeof testObj.nested.anotherAddress);
console.log("Cloned nested.anotherAddress type:", typeof clonedObj.nested.anotherAddress);

// Verify array elements
console.log("\nArray verification:");
console.log("Original array[0] type:", typeof testObj.nested.array[0]);
console.log("Cloned array[0] type:", typeof clonedObj.nested.array[0]);
console.log("Original array[1] type:", typeof testObj.nested.array[1]);
console.log("Cloned array[1] type:", typeof clonedObj.nested.array[1]); 