import { ethers } from "ethers";
import UpgradeableBeaconABI from "../core/abis/UpgradeableBeacon_ABI.json";
import { Address } from "../types/abi";
import { Utils } from "./utils";

import { Provider } from "../core/env";

async function getImplementationAddress(
	proxyAddress: Address,
): Promise<Address> {
	const impl = await readStorageSlot(
		proxyAddress,
		Utils.erc1967Slot.Implementation(),
	);

	if (isEmptySlot(impl)) {
		throw new Error("Implementation address is empty");
	}

	return ethers.AbiCoder.defaultAbiCoder().decode(["address"], impl)[0];
}

async function getBeaconAddress(beaconProxyAddress: Address): Promise<Address> {
	const beacon = await readStorageSlot(
		beaconProxyAddress,
		Utils.erc1967Slot.Beacon(),
	);

	if (isEmptySlot(beacon)) {
		throw new Error("Beacon address is empty");
	}

	return ethers.AbiCoder.defaultAbiCoder().decode(["address"], beacon)[0];
}

async function getBeaconImplementationAddress(
	beaconAddress: Address,
): Promise<Address> {
	const beaconContract = new ethers.Contract(
		beaconAddress,
		UpgradeableBeaconABI,
		Provider,
	);
	return await beaconContract.implementation();
}

async function readStorageSlot(
	address: Address,
	slot: string,
): Promise<string> {
	let storage =
		"0x0000000000000000000000000000000000000000000000000000000000000000";

	storage = await Provider.send("eth_getStorageAt", [
		address,
		slot,
		"latest",
	]);

	return storage;
}

function isEmptySlot(storage: string): boolean {
	const slotData = ethers.AbiCoder.defaultAbiCoder().decode(
		["uint256"],
		storage,
	);
	return BigInt(slotData[0]) === 0n;
}

export const StorageHelpers = {
	getImplementationAddress,
	getBeaconAddress,
	getBeaconImplementationAddress,
};
