// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract UpgradeableContract is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable deployer;

    string public name;
    uint8 public version;

    function initialize(
        string memory name_,
        uint8 version_
    ) public initializer {
        name = name_;
        version = version_;

        __Ownable_init(_msgSender());
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address deployer_) {
        _disableInitializers();

        deployer = deployer_;
    }

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}
}
