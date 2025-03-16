import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
	solidity: "0.8.28",
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			accounts: {
				mnemonic:
					"test test test test test test test test test test test junk",
				count: 10,
			},
		},
	},
	paths: {
    sources: "./tests/contracts",
		artifacts: "./tests/artifacts",
		tests: "./tests",
	},
};

export default config;
