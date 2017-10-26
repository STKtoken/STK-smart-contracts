var STKToken = artifacts.require("./STKToken.sol");
var STKChannel = artifacts.require("./STKChannel.sol");
var SafeMathLib = artifacts.require("./SafeMathLib.sol");
var STKChannelLibrary = artifacts.require('./STKChannelLibrary.sol');
module.exports = function(deployer) {
  deployer.deploy(SafeMathLib);
  deployer.link(SafeMathLib,STKChannelLibrary);
  deployer.deploy(STKChannelLibrary);
  var token = deployer.deploy(STKToken,1000000000,'STK Token',10,'STK').then(function()
    {
     deployer.link(STKChannelLibrary,STKChannel);
     return deployer.deploy(STKChannel,web3.eth.accounts[1],STKToken.address,10);
   });
};
