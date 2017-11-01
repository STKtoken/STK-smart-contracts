const STKChannel = artifacts.require('./STKChannel.sol')
const STKToken  = artifacts.require('./STKToken.sol')
const sha3 = require('solidity-sha3').default
var ethUtil = require('ethereumjs-util')
const assertJump = require('./helpers/assertJump');
var indexes = require('./helpers/ChannelDataIndexes');
var signatureHelper = require('./helpers/signatureHelper.js');

contract("STKChannelClosing", accounts => {
  const userAddress = accounts[0]
  const stackAddress = accounts[1]

  it('Deposit 50 tokens to the stkchannel',async()=> {
      const token = await STKToken .deployed();
      const channel = await STKChannel.deployed();
      await token.approve(channel.address,50);
      const allowance = await token.allowance(accounts[0],channel.address);
      const cost  = await  channel.deposit.estimateGas(50);
      console.log('estimated gas cost of depositing into the channel -- this neglects cost of approving tokens for transfer: ' + cost );
      await channel.deposit(50);
      const data = await channel.channelData_.call();
      const balance = data[indexes.TOKEN_BALANCE];
      assert.equal(balance.valueOf(),50,'the deposited values are not equal');
  });

  it('user tries to  close the channel with a valid signature but amount is above the deposited amount',async()=> {
      const nonce = 1;
      const amount = 10000;
      const address = STKChannel.address;
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[1],hash);
      const signatureData = ethUtil.fromRpcSig(signature);
      const channel = await STKChannel.deployed()
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      try
      {

      await channel.close(nonce,amount,v,r,s)
      assert.fail('The amount should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertJump(error);
      }
  })

  it('User tries to  close the channel with a self signed signature',async()=> {
      const nonce = 1;
      const amount = 2;
      const address = STKChannel.address;
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[0],hash);
      const params = signatureHelper.getParameters(signature);
      const v = params.v;
      const r = params.r;
      const s = params.s;
      const channel = await STKChannel.deployed()
      try
      {
      await channel.close(nonce,amount,v,r,s)
      assert.fail('The signature should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertJump(error);
      }
  })

  it('Non-channel participant tries to close the channel with a valid signature',async()=> {
      const nonce = 1;
      const amount = 2;
      const address = STKChannel.address;
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[1],hash);
      const channel = await STKChannel.deployed()
      const signatureData = ethUtil.fromRpcSig(signature);
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      try
      {
      await channel.close(nonce,amount,v,r,s,{from:accounts[3]});
      assert.fail('The sender should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertJump(error);
      }
  })

  it('user tries to close channel with a signature signed by someone else(invalid signature)',async()=> {
      const nonce = 1;
      const amount = 2;
      const address = STKChannel.address;
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[2],hash);
      const signatureData = ethUtil.fromRpcSig(signature);
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      const channel = await STKChannel.deployed()
      try
      {
      await channel.close(nonce,amount,v,r,s)
      assert.fail('The signature should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertJump(error);
      }
  })

  it('user closes the channel with a valid signature',async()=> {
      const nonce = 1;
      const amount = 0;
      const channel = await STKChannel.deployed()
      const hash = sha3(channel.address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[1],hash);
      const signatureData = ethUtil.fromRpcSig(signature)
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      const cost = await  channel.close.estimateGas(nonce,amount,v,r,s);
      console.log('estimated gas cost of closing the channel: ' + cost );
      await channel.close(nonce,amount,v,r,s)
      const data  = await channel.channelData_.call();
      const block = data[indexes.CLOSED_BLOCK];
      const address = data[indexes.CLOSING_ADDRESS];
      assert.isAbove(block.valueOf(),0,'The closed block should not be zero or below')
      assert.equal(address,userAddress,'the closing address and userAddress should match')
  })

  it('Channel recipient contests the closing of the channel but the amount is above the deposited amount',async()=>{
      const nonce = 2 ;
      const amount =10000 ;
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed()
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[0],hash);
      signatureData = ethUtil.fromRpcSig(signature)
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      try
      {
          await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
          assert.fail('This should have thrown due to incorrect amount ');
      }
    catch(error)
    {
         assertJump(error);
    }
  })

  it('Channel recipient contests the closing of the channel ',async()=>{
      const nonce = 2 ;
      const amount =2 ;
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed()
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[0],hash);
      const signatureData = ethUtil.fromRpcSig(signature)
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      const cost  = await  channel.updateClosedChannel.estimateGas(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
      console.log('estimated gas cost of contesting the channel after closing: ' + cost );
      await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
      const data  = await channel.channelData_.call();
      const newAmount = data[indexes.AMOUNT_OWED];
      assert.equal(amount,newAmount,'Amount should be updated');
      const newNonce = data[indexes.CLOSED_NONCE];
      assert.equal(nonce,newNonce,'Nonce should be updated');
  })

  it('Should not be able to close the channel after it has already been closed',async()=>
  {
      const channel = await STKChannel.deployed()

      try
      {
          await channel.closeWithoutSignature();
          assert.fail('Closing should have thrown an error');
     }
     catch(error)
     {
         assertJump(error);
     }
  })

  it('Closing Address should not be able to update the channel once closed ',async() =>{
      const nonce = 3 ;
      const amount =3 ;
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed()
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[1],hash);
      signatureData = ethUtil.fromRpcSig(signature)
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      try
      {
          await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[0]});
          assert.fail('Updating channel should have thrown');
      }
      catch(error)
      {
          assertJump(error);
      }
  })

  it('Should not be able to update channel with lower nonce value ',async()=>{
      const nonce = 1 ;
      const amount =3 ;
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed()
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[0],hash);
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

  it('The non-closing address should be able to update the state of the channel with a higher nonce',async()=>
  {
      const nonce = 3 ;
      const amount =3 ;
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed()
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[0],hash);
      signatureData = ethUtil.fromRpcSig(signature)
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
      const data  = await channel.channelData_.call();
      const newAmount = data[indexes.AMOUNT_OWED];
      assert.equal(amount,newAmount,'Amount should be updated');
      const newNonce = data[indexes.CLOSED_NONCE];
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

  it('Wait for block time and then try to settle ',async()=>
  {
     const channel = await STKChannel.deployed();
     const token =  await STKToken .deployed();
     const data  = await channel.channelData_.call();
     const blocksToWait = data[indexes.TIMEOUT];
     console.log('blocks to wait: '+ blocksToWait.valueOf());
     for(i = 0;i<blocksToWait;i++)
     {
         var transaction = {from:web3.eth.accounts[0],to:web3.eth.accounts[1],gasPrice:1000000000,value:100};
         web3.eth.sendTransaction(transaction);
    }
      const depositedTokens = data[indexes.TOKEN_BALANCE];
      const oldUserBalance = await token.balanceOf(userAddress);
      const oldStackBalance = await token.balanceOf(stackAddress);
      const amountToBeTransferred = data[indexes.AMOUNT_OWED];
      const cost = await  channel.settle.estimateGas();
      console.log('estimated gas cost of settling the channel: ' + cost );
      await channel.settle();
      const newUserBalance = await token.balanceOf(userAddress);
      const newStackBalance = await token.balanceOf(stackAddress);
      assert.equal(parseInt(newStackBalance.valueOf()), parseInt(oldStackBalance.valueOf() + amountToBeTransferred.valueOf()), 'The stack account value should be credited');
      assert.equal(parseInt(newUserBalance.valueOf()),parseInt(oldUserBalance.valueOf()) + parseInt(depositedTokens.valueOf()) - parseInt(amountToBeTransferred.valueOf()),'The User address should get back the unused tokens');
    })
})
