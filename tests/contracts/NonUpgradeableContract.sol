// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract NonUpgradeableContract {
    address private immutable deployer;

    string public name;
    uint8 public version;

    constructor(
        string memory name_,
        uint8 version_,
        address deployer_
    )
    {
        name = name_;
        version = version_;
        deployer = deployer_;
    }
}
