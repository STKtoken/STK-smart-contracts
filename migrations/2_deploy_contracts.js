var STKToken = artifacts.require("./STKToken.sol");
var STKChannel = artifacts.require("./STKChannel.sol");
var SafeMathLib = artifacts.require("./SafeMathLib.sol");
var STKChannelLibrary = artifacts.require('./STKChannelLibrary.sol');

var fs = require('fs');
var addressFile = './deployedAddress.json';
var file = require(addressFile);

module.exports = function(deployer, network, accounts)
{

  if(network === "development") {
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
                      return deployer.deploy(STKChannel, web3.eth.accounts[1],STKToken.address,10).then(function(){
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
              return deployer.deploy(STKToken,1000000000,'STK Token',10,'STK').then(function()
                  {
                  return deployer.link(STKChannelLibrary,STKChannel).then(function()
                      {
                        return deployer.deploy(STKChannel, '0xD0C384fBb631fbaeF8FbD04b819232Bfc2A8601B',STKToken.address,10);
                     });
                  });
               });
            });
        });
    }
  }
