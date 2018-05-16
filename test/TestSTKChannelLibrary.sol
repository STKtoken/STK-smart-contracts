pragma solidity ^0.4.15;
import "../contracts/STKChannel.sol";
import { STKChannelLibrary } from "../contracts/STKChannelLibrary.sol";
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

contract TestSTKChannelLibrary {
    function killLibrary() internal pure {
      STKChannelLibrary lib = STKChannelLibrary(DeployedAddresses.STKChannelLibrary());
      /* bool killingLib = lib.kill(); */
      /* require(killingLib == false, "Should be false"); */
    }

}
