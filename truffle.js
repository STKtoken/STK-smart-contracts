var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = require('./mnemonic.js')

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic.mnemonic, "https://ropsten.infura.io/[INFURA-API-KEY] ")
      },
      network_id: 3,
      gas: 4000000
    }
  }
};
