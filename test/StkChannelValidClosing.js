var STKChannel = artifacts.require('./STKChannel.sol');
var HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
var sha3 = require('solidity-sha3').default;


contract("STKChannelClosing", function(accounts,done)
{
  var userAddress = accounts[0];
  var stackAddress = accounts[1];

  it('user closes the channel with a valid signature',function()
  {
      var nonce = 1;
      var amount = 50;
      var transaction = {from :userAddress};
      var address = STKChannel.address;
      var hash = sha3(address,nonce,amount);
      var signature = web3.eth.sign(web3.eth.accounts[1],hash);
      return STKChannel.deployed().then(function(channel)
      {
        return channel.close(nonce,amount,signature).then(function()
        {
          return channel.closedBlock_.call().then(function(block)
          {
            assert.isAbove(block.valueOf(),0,'The closed block should not be zero or below');
            return channel.closingAddress_.call(function(address)
            {
              assert.equal(address,userAddress,'the closing address and userAddress should match');
            });
          });
        });
      });
  })
});
