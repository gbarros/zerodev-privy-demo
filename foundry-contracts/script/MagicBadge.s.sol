// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MagicBadge} from "../src/MagicBadge.sol";

/**
 * @title DeployMagicBadge
 * @dev Deploys the MagicBadge NFT contract to a specified network.
 * It reads the deployer's private key from the `PRIVATE_KEY` environment variable.
 */
contract DeployMagicBadge is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployerAddress = vm.addr(deployerPrivateKey);
        MagicBadge magicBadge = new MagicBadge(deployerAddress);

        vm.stopBroadcast();

        console.log("MagicBadge contract deployed at:", address(magicBadge));
        console.log("Owner:", magicBadge.owner());
    }
}
