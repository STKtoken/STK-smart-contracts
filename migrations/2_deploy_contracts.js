var STKToken = artifacts.require("./STKToken.sol");
var STKChannel = artifacts.require("./STKChannel.sol");
var SafeMathLib = artifacts.require("./SafeMathLib.sol");
module.exports = function(deployer) {
  deployer.deploy(SafeMathLib);
  var token = deployer.deploy(STKToken,1000000000,'STK Token',10,'STK').then(function()
    {
     deployer.link(SafeMathLib,STKChannel);
     return deployer.deploy(STKChannel,web3.eth.accounts[1],STKToken.address,10);
   });
};
