var STKChannel = artifacts.require('./STKChannel.sol');
var HumanStandardToken = artifacts.require('./HumanStandardToken.sol');


contract("STKChannel", function(accounts,done){
  // Deploy a stack channel before running tests
  HumanStandardToken.deployed().then( function(instance)
  {
    //To , token Address , expiry time
    STKChannel.new(accounts[1], instance.address, 50);
  });

  it("STK Channel is deployed ", function()
  {
    return STKChannel.deployed().then(done).catch(done);
  });

  it("STK Channel user acccount is first account", function()
  {
      return STKChannel.deployed().then(function(instance)
    {
       return instance.userAddress_.call().then(function(address){
         assert.equal(address.toString(),accounts[0],'accounts are not equal');
       });
    });
  });

  it('STK Channel second account is Recipient account',function()
  {
    return STKChannel.deployed().then(function(instance)
  {
     return instance.receipientAddress_.call().then(function(address){
       assert.equal(address.toString(),accounts[1],'accounts are not equal');

     });
  });
  });

  it('STK Channel expiry time is 50',function()
{
    return STKChannel.deployed().then(function(instance)
  {
     return instance.timeout_.call().then(function(timeout_){
       assert.equal(timeout_.valueOf(),50,'values are not equal');
     });
  });
});

});
