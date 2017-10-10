var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");
var HumanStandardToken = artifacts.require("./HumanStandardToken.sol");
var STKChannel = artifacts.require("./STKChannel.sol");
var SafeMathLib = artifacts.require("./SafeMathLib.sol");
module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(HumanStandardToken,1000000000,'STK Token',10,'STK');
  deployer.deploy(SafeMathLib);
  deployer.link(SafeMathLib,STKChannel);
  deployer.deploy(STKChannel);
};
