import { deploy } from "./core/deploy";
import { upgrade } from "./core/upgrade";

import { Deployer, Provider } from "./core/env";

import { EncodingUtils } from "./libs/encodingUtils";

export const DeployHelper = {
	deploy,
	upgrade,
	Utils: EncodingUtils,
	Env: {
		Deployer,
		Provider,
	}
};
