import hre from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { deploy } from "../src/core/deploy";
import { DeployOptions } from "../src/types/options";
import { Provider } from "../src/core/env";
import { StorageUtils } from "../src/libs/storageUtils";

describe("Deploy", function () {
	let deployer: HardhatEthersSigner;
	const nonUpgradeableContractName = "NonUpgradeableContract";
	const contractConstructorArgs = ["Non upgradeable contract", 1];
	const upgradeableContractName = "UpgradeableContract";

	before(async () => {
		[deployer] = await hre.ethers.getSigners();
	});

	it("Should deploy a non-upgradeable contract", async () => {
		const deployOptions: DeployOptions = {
			contractName: nonUpgradeableContractName,
			implConstructorArgs: [...contractConstructorArgs, deployer.address],
			isUpgradeable: false,
			writeDeploymentResult: false,
		};

		const contract = await deploy(deployOptions);

		expect(contract).to.not.be.undefined;

		expect(hre.ethers.isAddress(contract.target)).to.be.true;

		const onchainCode = await Provider.getCode(contract.target);
		const contractFactory = await hre.ethers.getContractFactory(
			nonUpgradeableContractName,
		);
		const contractRuntimeBytecode = StorageUtils.extractRuntimeBytecode(
			contractFactory.bytecode,
		);

		expect(onchainCode).to.not.be.empty;
		expect(onchainCode).to.be.eq(contractRuntimeBytecode);
	});

	it("Should deploy an upgradeable contract", async () => {
		const deployOptions: DeployOptions = {
			contractName: upgradeableContractName,
			initializationArgs: contractConstructorArgs,
			implConstructorArgs: [deployer.address],
			isUpgradeable: true,
			writeDeploymentResult: false,
		};

		const contract = await deploy(deployOptions);

		expect(contract).to.not.be.undefined;
		expect(hre.ethers.isAddress(contract.target)).to.be.true;

		// check if implementation slot is not empty
		const implementation = await StorageUtils.getImplementationAddress(
			contract.target,
		);
		expect(implementation).to.not.be.empty;
		expect(hre.ethers.isAddress(implementation)).to.be.true;
	});
});
