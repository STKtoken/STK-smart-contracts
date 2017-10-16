var HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
var STKChannel = artifacts.require("./STKChannel.sol");
var SafeMathLib = artifacts.require("./SafeMathLib.sol");
module.exports = function(deployer) {
  deployer.deploy(SafeMathLib);
  var token = deployer.deploy(HumanStandardToken,1000000000,'STK Token',10,'STK').then(function()
    {
     deployer.link(SafeMathLib,STKChannel);
     return deployer.deploy(STKChannel,web3.eth.accounts[1],HumanStandardToken.address,50);
   });
};
