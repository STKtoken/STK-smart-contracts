var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = require('./mnemonic.js')

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_URL, 1)
      },
      network_id: 3,
      gas: 2500000,
      gasPrice: 25000000000
    },
    live: {
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC_PROD, process.env.INFURA_URL_PROD, 1)
      },
      network_id: 1,
      gas: 2500000,
      gasPrice: 25000000000
    }
  }
};
