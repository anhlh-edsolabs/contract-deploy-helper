import { deploy } from "./core/deploy";
import { upgrade } from "./core/upgrade";

import { Deployer, Provider } from "./core/env";

export { EncodingUtils } from "./libs/encodingUtils";
export { AbiUtils } from "./libs/abiUtils";
export { StorageUtils } from "./libs/storageUtils";

// // Add BigInt serializer to handle JSON serialization
// BigInt.prototype.toJSON = function () {
// 	return "0x" + this.toString(16);
// };

export const DeployHelper = {
	deploy,
	upgrade,
	Env: {
		Deployer,
		Provider,
	},
};
