var STKToken = artifacts.require("./STKToken.sol");
var STKChannel = artifacts.require("./STKChannel.sol");
var SafeMathLib = artifacts.require("./SafeMathLib.sol");
var STKChannelLibrary = artifacts.require('./STKChannelLibrary.sol');

var fs = require('fs');
var addressFile = './deployedAddress.json';
var file = require(addressFile);

module.exports = function(deployer, network, accounts)
{

  const initialSupply = 500000000 * Math.pow(10, 18)

  if(network === "development") {
    deployer.deploy(SafeMathLib).then(function()
    {
      return deployer.link(SafeMathLib,STKChannelLibrary).then(function()
        {
          return deployer.deploy(STKChannelLibrary).then(function()
            {
            return deployer.deploy(STKToken,1000000000,'STK Token',18,'STK').then(function()
                {
                return deployer.link(STKChannelLibrary,STKChannel).then(function()
                    {
                      return deployer.deploy(STKChannel, web3.eth.accounts[0], web3.eth.accounts[2], STKToken.address,10, {from: accounts[1]}).then(function(){
                        file.STKTokenAddress = STKToken.address;
                        file.STKChannelAddress = STKChannel.address;
                        fs.writeFile(addressFile, JSON.stringify(file), function (err) {
                          if (err) return console.log(err);
                          console.log('writing to ' + addressFile);
                        });
                      })
                   });
                });
             });
          });
      });
  } else {
      deployer.deploy(SafeMathLib).then(function()
      {
        return deployer.link(SafeMathLib,STKChannelLibrary).then(function()
          {
            return deployer.deploy(STKChannelLibrary).then(function()
              {
              return deployer.deploy(STKToken,initialSupply,'STK Token',18,'STK');
               });
            });
        });
    }
  }
