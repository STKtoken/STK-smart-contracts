import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/STKChannel.sol";

contract TestSTKChannel
{
  event Debug(bytes32 s);
  function testSha3Hash()
  {
      uint nonce = 1;
      uint amount = 0 ;
      bytes32 msgHash  = keccak256(1234,nonce,amount);
      Debug(msgHash);
  }
}
