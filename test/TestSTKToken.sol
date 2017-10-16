import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/HumanStandardToken.sol";

contract TestSTKToken
{
  function testInitialBalance()
  {
  uint expectedBalance = 1000000000 ;
  HumanStandardToken token = HumanStandardToken(DeployedAddresses.HumanStandardToken());
  Assert.equal(token.totalSupply(),expectedBalance,'The initial supply should be 1 billion');
  }

}
