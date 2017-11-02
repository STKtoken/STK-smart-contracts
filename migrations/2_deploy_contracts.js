var STKToken = artifacts.require("./STKToken.sol");
var STKChannel = artifacts.require("./STKChannel.sol");
var SafeMathLib = artifacts.require("./SafeMathLib.sol");
var STKChannelLibrary = artifacts.require('./STKChannelLibrary.sol');
module.exports = function(deployer)
{
  deployer.deploy(SafeMathLib).then(function()
  {
    return deployer.link(SafeMathLib,STKChannelLibrary).then(function()
      {
        return deployer.deploy(STKChannelLibrary).then(function()
          {
          return deployer.deploy(STKToken,1000000000,'STK Token',10,'STK').then(function()
              {
              return deployer.link(STKChannelLibrary,STKChannel).then(function()
                  {
                    return deployer.deploy(STKChannel,web3.eth.accounts[1],STKToken.address,10);
                 });
              });
           });
        });
      });
  }
