const STKChannel = artifacts.require('./STKChannel.sol')
const HumanStandardToken = artifacts.require('./HumanStandardToken.sol')
const sha3 = require('solidity-sha3').default


contract("STKChannelClosing", accounts => {
  const userAddress = accounts[0]
  const stackAddress = accounts[1]

  it('user closes the channel with a valid signature', async () => {
      const nonce = 1
      const amount = 50
      const transaction = { from: userAddress }
      const address = STKChannel.address
      const hash = sha3(address,nonce,amount)
      const signature = web3.eth.sign(web3.eth.accounts[1],hash)
      console.log("before deployed signature is" + signature);
      const channel = await STKChannel.deployed()
      console.log("before closed");
      await channel.close(nonce,amount,signature)
      const block = await channel.closedBlock_.call()
      console.log("after closed");
      assert.isAbove(block.valueOf(),0,'The closed block should not be zero or below')

      const addr = await channel.closingAddress_.call()
      assert.equal(addr,userAddress,'the closing address and userAddress should match')
  })
})
