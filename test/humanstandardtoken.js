var HumanStandardToken = artifacts.require("./HumanStandardToken.sol");

contract('STKToken', function(accounts){
  it("We should have 1 billion tokens in first account", function()
  {    return HumanStandardToken.deployed().then(function(instance)
    {
      return instance.balanceOf(accounts[0]);
    }).then(function(balance){
        assert.equal(balance.valueOf(), 1000000000, '1 billion was not in the first account');
    });
  });
  it('The Token symbol should be STK',function()
  {
    return HumanStandardToken.deployed().then(function(instance)
    {
      return instance.symbol.call();

    }).then(function(symbol)
    {
      assert.equal(symbol,'STK','Symbol is not STK ');
    });
});
});
