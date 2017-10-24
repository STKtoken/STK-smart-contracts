var STKChannel = artifacts.require('./STKChannel.sol');
var STKToken  = artifacts.require('./STKToken.sol');
var sha3 = require('solidity-sha3').default;
contract("STKChannel",(accounts,done)=>
{
  it("STK Channel is deployed ", function()
  {
  return STKChannel.deployed().then(done).catch(done);
  });

  it("STK Channel user acccount is the first account", async() => {
  const instance = await STKChannel.deployed();
  const address = await instance.userAddress_.call();
  assert.equal(address.toString(),accounts[0],'accounts are not equal');
  })

  it('Second account is Recipient account', async() => {
  const instance = await STKChannel.deployed();
  const address  = await instance.recepientAddress_ .call();
  assert.equal(address.toString(),accounts[1],'accounts are not equal');
  })

  it('STK Channel expiry time is 10',async() => {
  const instance = await STKChannel.deployed();
  const timeout = await instance.timeout_.call();
  assert.equal(timeout.valueOf(),10,'values are not equal');
  });

  it('Deposit 50 tokens to the stkchannel',async() => {
  const token = await STKToken .deployed();
  const channel = await STKChannel.deployed();
  await token.approve(channel.address,50);
  const allowance = await token.allowance(accounts[0],channel.address);
  await channel.deposit(50);
  const balance = await channel.tokenBalance_.call();
  assert.equal(balance.valueOf(),50,'the deposited values are not equal');
  });

  it('Close the channel without a signature',async () => {
  const channel = await STKChannel.deployed();
  await channel.close(0,0,0);
  const block = await channel.closedBlock_.call();
  assert.isAbove(block.valueOf(),0,'closed block is not greater than zero');
  });

  it('Basic sha3 test',async() => {
  const nonce = 1;
  const amount = 0;
  const address = STKChannel.address;
  const sig = sha3(address,nonce,amount);
  const channel = await STKChannel.deployed();
  assert.equal(sig,sha3(channel.address,nonce,amount),'the sigs are not equal');
  });
});
