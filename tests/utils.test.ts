import { ethers } from "ethers";
import { EncodingUtils } from "../src/libs/encodingUtils";
import { AbiIO } from "../src/types/abi";

describe("Utils", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("erc1967Slot", () => {
		it("should compute the correct implementation slot", () => {
			const result = EncodingUtils.erc1967Slot.Implementation();
			expect(result).toBe(
				"0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
			);
		});

		it("should compute the correct beacon slot", () => {
			const result = EncodingUtils.erc1967Slot.Beacon();
			expect(result).toBe(
				"0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50",
			);
		});

		it("should compute the correct admin slot", () => {
			const result = EncodingUtils.erc1967Slot.Admin();
			expect(result).toBe(
				"0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
			);
		});
	});

	describe("erc7201", () => {
		it("should compute the correct ERC7201 storage namespace hash", () => {
			const namespaceId = "namespaceId";
			const result = EncodingUtils.erc7201(namespaceId);
			expect(result).toBe(
				"0x2e3a922aba140d04fc09508dc403314f2c850f80b05481d295263d41370a6500",
			);
		});
	});

	describe("abi", () => {
		describe("iterateInputs", () => {
			it("should iterate over simple inputs", () => {
				const inputs: AbiIO[] = [
					{
						name: "input1",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "input2",
						type: "address",
						internalType: "address",
					},
				];
				const result = EncodingUtils.abi.iterateInputs(inputs);
				expect(result).toBe("uint256,address");
			});

			it("should iterate over tuple inputs", () => {
				const inputs: AbiIO[] = [
					{
						name: "tupleInput",
						type: "tuple",
						internalType: "tuple",
						components: [
							{
								name: "field1",
								type: "uint256",
								internalType: "uint256",
							},
							{
								name: "field2",
								type: "address",
								internalType: "address",
							},
						],
					},
				];
				const result = EncodingUtils.abi.iterateInputs(inputs);
				expect(result).toBe("tuple(uint256,address)");
			});

			it("should iterate over array of tuple inputs", () => {
				const inputs: AbiIO[] = [
					{
						name: "tupleArrayInput",
						type: "tuple[]",
						internalType: "tuple[]",
						components: [
							{
								name: "field1",
								type: "uint256",
								internalType: "uint256",
							},
							{
								name: "field2",
								type: "address",
								internalType: "address",
							},
						],
					},
				];
				const result = EncodingUtils.abi.iterateInputs(inputs);
				expect(result).toBe("tuple(uint256,address)[]");
			});

			it("should iterate over nested tuple inputs", () => {
				const inputs: AbiIO[] = [
					{
						name: "nestedTupleInput",
						type: "tuple",
						internalType: "tuple",
						components: [
							{
								name: "innerTuple",
								type: "tuple",
								internalType: "tuple",
								components: [
									{
										name: "field1",
										type: "uint256",
										internalType: "uint256",
									},
									{
										name: "field2",
										type: "address",
										internalType: "address",
									},
								],
							},
						],
					},
				];
				const result = EncodingUtils.abi.iterateInputs(inputs);
				expect(result).toBe("tuple(tuple(uint256,address))");
			});
		});

		describe("getContractName", () => {
			it("should return artifact name and empty deployment name", () => {
				const result = EncodingUtils.abi.getContractName("MyContract");
				expect(result).toEqual({
					artifactName: "MyContract",
					deploymentName: "",
				});
			});

			it("should return artifact name and deployment name", () => {
				const result = EncodingUtils.abi.getContractName(
					"MyContract$MyDeployment",
				);
				expect(result).toEqual({
					artifactName: "MyContract",
					deploymentName: "MyDeployment",
				});
			});

			it("should trim whitespace", () => {
				const result = EncodingUtils.abi.getContractName(
					"  MyContract  $  MyDeployment  ",
				);
				expect(result).toEqual({
					artifactName: "MyContract",
					deploymentName: "MyDeployment",
				});
			});
		});
	});

	describe("stringToBytes", () => {
		it("should convert a string to bytes and zero-pad", () => {
			const result = EncodingUtils.stringToBytes("test", 5);
			expect(result).toEqual("0x7465737400");
		});

		it("should convert a string to bytes and truncate", () => {
			const result = EncodingUtils.stringToBytes("test", 3);
			expect(result).toEqual("0x746573");
		});
	});

	describe("hexToString", () => {
		it("should convert a hex string to UTF-8 and remove null characters", () => {
			const result = EncodingUtils.hexToString("0x7465737400737472696e6700");
			expect(result).toBe("teststring");
		});
	});
});
