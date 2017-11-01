import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/STKToken.sol";

contract TestSTKToken
{
  function testInitialBalance()
  {
      uint expectedBalance = 1000000000 ;
      STKToken token = STKToken(DeployedAddresses.STKToken());
      Assert.equal(token.totalSupply(),expectedBalance,'Should have a supply of  1 billion');
  }

}
