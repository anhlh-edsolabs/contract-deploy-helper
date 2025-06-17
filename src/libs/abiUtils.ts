import { AbiIO } from "../types/abi";

/**
 * Iterates over the inputs array and returns a comma-separated string of input types.
 * If an input type is a tuple or an array of tuples, it recursively iterates over the components and appends the result.
 * @param {Array} inputs - The array of input objects.
 * @returns {string} - A comma-separated string of input types.
 */
export function iterateInputs(inputs: AbiIO[]): string {
	return inputs
		.map((input) => {
			if (input.type === "tuple" || input.type === "tuple[]") {
				const childResult = iterateInputs(input.components || []);
				return `tuple(${childResult})${
					input.type === "tuple[]" ? "[]" : ""
				}`;
			}
			return input.type;
		})
		.join(",");
}

/**
 * Retrieves the artifact name and deployment name from a compound contract name.
 *
 * @param {string} contractNameCompound - The compound contract name in the format `contractName$deploymentName`.
 * @returns {Object} - An object containing the artifact name and deployment name.
 */
export function getContractName(contractNameCompound: string): {
	artifactName: string;
	deploymentName: string;
} {
	const [artifactName, deploymentName = ""] = contractNameCompound
		.split("$")
		.map((part) => part.trim());
	return { artifactName, deploymentName };
}

export const AbiUtils = {
	iterateInputs,
	getContractName,
};