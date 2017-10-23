const STKChannel = artifacts.require('./STKChannel.sol')
const HumanStandardToken = artifacts.require('./HumanStandardToken.sol')
const sha3 = require('solidity-sha3').default
var ethUtil = require('ethereumjs-util')
const assertJump = require('./helpers/assertJump');

contract("STKChannelClosing", accounts => {
  const userAddress = accounts[0]
  const stackAddress = accounts[1]

  it('user closes the channel with a valid signature', async () => {
      const nonce = 1;
      const amount = 0;
      const address = STKChannel.address;
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[1],hash);
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

  it('Channel recepient contests the closing of the channel ', async ()=>{
    const nonce = 2 ;
    const amount =2 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[0],hash);
    console.log('contesting channel');
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
    const newAmount = await channel.amountOwed_.call();
    assert.equal(amount,newAmount,'Amount should be updated');
    const newNonce = await channel.closedNonce_.call();
    assert.equal(nonce,newNonce,'Nonce should be updated');
  })

  it('Should not be able to close the channel after it has already been closed',async()=>
  {
    const channel = await STKChannel.deployed()

    try{
      await channel.close(0,0,0);
      assert.fail('Closing should have thrown an error');
    }
    catch(error)
    {
      assertJump(error);
    }
  })

  it('Closing Address should not be able to update the channel once closed ', async() =>{
    const nonce = 3 ;
    const amount =3 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[1],hash);
    console.log('contesting channel');
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    try {
    await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[0]});
    assert.fail('Updating channel should have thrown');
    }
    catch(error)
    {
      assertJump(error);
    }
  })

  it('Should not be able to update channel with lower nonce value ', async ()=>{
    const nonce = 1 ;
    const amount =3 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[0],hash);
    console.log('contesting channel');
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    try
    {
      await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
      assert.fail('The channel should not have updated');
    }
    catch(error)
    {
      assertJump(error);
    }
  })

  it('The non-closing address should be able to update the state of the channel with a higher nonce', async()=>
  {
    const nonce = 3 ;
    const amount =3 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[0],hash);
    console.log('contesting channel');
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
    const newAmount = await channel.amountOwed_.call();
    assert.equal(amount,newAmount,'Amount should be updated');
    const newNonce = await channel.closedNonce_.call();
    assert.equal(nonce,newNonce,'Nonce should be updated');
  })

  it('try to settle the address before the time period is expired',async()=>
  {
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed();
      try
      {
        await channel.settle();
        assert.fail('This should have thrown');
      }
      catch(error)
      {
        assertJump(error);
      }

  })
})
