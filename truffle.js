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
        return new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_URL)
      },
      network_id: 3,
      gas: 4000000
    }
  }
};
