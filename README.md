# STK-smart-contracts
Smart contracts for the STK token payment channel. This repo contains the logic to implement a Payment Channel using ERC20 Tokens. The files contained here are still in development and will be updated in the interests of functionality and security. This is *not* to be considered the final version. Code related comments can be sent to info@getstack.ca . We appreciate your feedback!

## Initialize

Install project dependencies

`npm install`   

## Local Development with Ganache CLI/TestRPC

Ganache CLI v6.0.3 (ganache-core: 2.0.2)

`npm install -g ganache-cli`

## Running Tests

Run tests using

`truffle test`

## Deploy to local testnet

`ganache-cli`

`truffle compile`

`truffle migrate`

## Deploy to live testnet (ropsten)

Before deploying to Ropsten, please register on Infura and replace the API key in truffle.js and replace the mnemonic phrase in mnemonic.js

`truffle migrate --network ropsten`
