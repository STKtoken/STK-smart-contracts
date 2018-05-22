var STKChannel = artifacts.require('./STKChannel.sol');
var STKToken  = artifacts.require('./STKToken.sol');
const assertRevert = require('./helpers/assertRevert');
var indexes = require('./helpers/ChannelDataIndexes');
contract("STKChannel",(accounts,done)=>
{
  it("STK Channel is deployed ", function()
  {
      return STKChannel.deployed().then(done).catch(done);
  });

  it("Should have STK channel user account as the first account",async() =>
  {
      const channel = await STKChannel.deployed();
      const data  = await channel.channelData_.call();
      const address = data[indexes.USER_ADDRESS];

      assert.equal(address.toString(),accounts[0],'accounts are not equal');
  })

  it('Should have second account as Recipient account',async() =>
  {
      const channel = await STKChannel.deployed();
      const data  = await channel.channelData_.call();
      const address  = data[indexes.RECIPIENT_ADDRESS];

      assert.equal(address.toString(),accounts[1],'accounts are not equal');
  })

  it('Should have Channel expiry time as 10',async() =>
  {
      const channel = await STKChannel.deployed();
      const data  = await channel.channelData_.call();
      const timeout = data[indexes.TIMEOUT];

      assert.equal(timeout.valueOf(),10,'values are not equal');
  });

  it('Should Deposit 50 tokens to the stkchannel',async() =>
  {
      const token = await STKToken.deployed();
      const channel = await STKChannel.deployed();
      await token.approve(channel.address,50);
      const allowance = await token.allowance(accounts[0],channel.address);
      await token.transfer(channel.address, 50);
      const balance = await token.balanceOf(channel.address);

      assert.equal(balance.valueOf(),50,'the deposited values are not equal');
  });

  it('Should close the channel without a signature',async () =>
  {
      const channel = await STKChannel.deployed();
      await channel.closeWithoutSignature();
      const data = await channel.channelData_.call();
      const block = data[indexes.CLOSED_BLOCK];

      assert.isAbove(block.valueOf(),0,'closed block is not greater than zero');
  });

});
