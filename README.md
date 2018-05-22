# STK-smart-contracts
Smart contracts for the STK token payment channel. This repo contains the logic to implement a Payment Channel using ERC20 Tokens. The files contained here are still in development and will be updated in the interests of functionality and security. This is *not* to be considered the final version. Code related comments can be sent to info@getstack.ca . We appreciate your feedback!

## Initialize

Install project dependencies

`npm install`   

## Local Development with Ganache CLI/TestRPC

Truffle v4.1.8 (core: 4.1.8)

Solidity v0.4.23 (solc-js) 

Ganache CLI v6.0.3 (ganache-core: 2.0.2)

`npm install -g ganache-cli`

## Running Tests

Run tests using

`truffle test`

## Deploy to local testnet

This will also generate a deployedAddress.json for other application to read from

`ganache-cli`

`truffle compile`

`truffle migrate`

or run the following for new deployment

`truffle migrate --reset`

## Deploy to live testnet (Rinkeby)

Before deploying to Rinkeby, please register on Infura

In your bash_profile Add INFURA_URL and MNEMONIC

`vim ~/.bash_profile`
`export MNEMONIC="<passphrase>"`
`export INFURA_URL=https://rinkeby.infura.io/<api-key>`

`truffle migrate --network rinkeby`
