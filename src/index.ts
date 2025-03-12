import { deploy } from "./core/deploy";
import { upgrade } from "./core/upgrade";

import { Deployer, Provider } from "./core/env";

import { Utils } from "./libs/utils";

export const DeployHelper = {
	deploy,
	upgrade,
	Utils,
	Env: {
		Deployer,
		Provider,
	}
};
