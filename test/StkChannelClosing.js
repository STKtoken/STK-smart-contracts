const STKChannel = artifacts.require('./STKChannel.sol')
const STKToken  = artifacts.require('./STKToken.sol')
const ethUtil = require('ethereumjs-util')
const assertRevert = require('./helpers/assertRevert');
const indexes = require('./helpers/channelDataIndexes');
const closingHelper = require('./helpers/channelClosingHelper')

contract("STKChannelClosing", accounts =>
{
  const userAddress = accounts[0]
  const stackAddress = accounts[1]
  const nonChannelPart = Buffer.from('c88b703fb08cbea894b6aeff5a544fb92e78a18e19814cd85da83b71f772aa6c', 'hex')
  const signersPk = Buffer.from('0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1', 'hex')

  it('Should deposit 50 tokens to the stkchannel',async()=> {
      const token = await STKToken .deployed();
      const channel = await STKChannel.deployed();
      await token.approve(channel.address,50);
      const allowance = await token.allowance(accounts[0],channel.address);
      await token.transfer(channel.address, 50);
      const balance = await token.balanceOf(channel.address);

      assert.equal(balance.valueOf(),50,'the deposited values are not equal');
  });

  it('Should fail when user tries to  close the channel with a valid signature but amount is above the deposited amount',async()=>
   {
      const nonce = 1;
      const amount = 10000;
      const channel = await STKChannel.deployed();
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);
      try
      {
          await channel.close(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s)
          assert.fail('The amount should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertRevert(error);
      }
  })

  it('Should fail when user tries to close the channel with a self signed signature',async()=>
  {
      const nonce = 1;
      const amount = 2;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);
      const channel = await STKChannel.deployed();
      try
      {
          await channel.close(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s)
          assert.fail('The signature should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertRevert(error);
      }
  })

  it('Should fail when non-channel participant tries to close the channel with a valid signature',async()=>
  {
      const nonce = 1;
      const amount = 2;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,nonChannelPart);
      const channel = await STKChannel.deployed();
      try
      {
          await channel.close(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s,{from:accounts[3]});
          assert.fail('The sender should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertRevert(error);
      }
  })

  it('Should fail when user tries to close channel with a signature signed by someone else (invalid signature)',async()=>
  {
      const nonce = 1;
      const amount = 2;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,nonChannelPart);
      const channel = await STKChannel.deployed();
      try
      {
          await channel.close(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s)
          assert.fail('The signature should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertRevert(error);
      }
  })

  it('Should allow user to close the channel with a valid signature',async()=>
  {
      const nonce = 1;
      const amount = 0;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);

      const channel = await STKChannel.deployed();
      const cost = await  channel.close.estimateGas(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s, {from:stackAddress});
      console.log('estimated gas cost of closing the channel: ' + cost );

      await channel.close(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s, {from:stackAddress});
      const data  = await channel.channelData_.call();
      const block = data[indexes.CLOSED_BLOCK];
      const address = data[indexes.CLOSING_ADDRESS];

      assert.isAbove(block.valueOf(),0,'The closed block should not be zero or below')
      assert.equal(address, stackAddress,'the closing address should be set if the channel has been closed')
  })

  it('Should fail when Channel recipient contests the closing of the channel but the amount is above the deposited amount',async()=>
  {
      const nonce = 2 ;
      const amount =10000 ;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed();
      try
      {
          await channel.updateClosedChannel(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s,{from:web3.eth.accounts[1]});
          assert.fail('This should have thrown due to incorrect amount ');
      }
      catch(error)
      {
          assertRevert(error);
      }
  })

  it('Should allow channel recipient to contest the closing of the channel ',async()=>
  {
      const nonce = 2 ;
      const amount = 2 ;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);
      const channel = await STKChannel.deployed();

      const cost  = await channel.updateClosedChannel.estimateGas(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s,{from:web3.eth.accounts[1]});
      console.log('estimated gas cost of contesting the channel after closing: ' + cost );

      await channel.updateClosedChannel(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s,{from:stackAddress});

      const data  = await channel.channelData_.call();
      const newAmount = data[indexes.AMOUNT_OWED];
      assert.equal(amount,newAmount,'Amount should be updated');
      const newNonce = data[indexes.CLOSED_NONCE];
      assert.equal(nonce,newNonce,'Nonce should be updated');
  })

  it('Should not be able to close the channel after it has already been closed',async()=>
  {
      const channel = await STKChannel.deployed();
      try
      {
          await channel.closeWithoutSignature();
          assert.fail('Closing should have thrown an error');
     }
     catch(error)
     {
         assertRevert(error);
     }
  })

  it('Should not be able to update the channel once closed as closing address',async() =>
  {
      const nonce = 3;
      const amount = 3;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);

      const channel = await STKChannel.deployed();
      try
      {
          await channel.updateClosedChannel(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s,{from:web3.eth.accounts[0]});
          assert.fail('Updating channel should have thrown');
      }
      catch(error)
      {
          assertRevert(error);
      }
  })

  it('Should not be able to update channel with lower nonce value ',async()=>
  {
      const nonce = 1 ;
      const amount =3 ;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);
      const channel = await STKChannel.deployed();
      try
      {
          await channel.updateClosedChannel(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s,{from:web3.eth.accounts[1]});
          assert.fail('The channel should not have updated');
      }
      catch(error)
      {
          assertRevert(error);
      }
  })

  it('Should be able to update the state of the channel with a higher nonce as non-closing address',async()=>
  {
      const nonce = 4;
      const amount = 4;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);
      const channel = await STKChannel.deployed();

      await channel.updateClosedChannel(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s,{from:web3.eth.accounts[1]});
      const data  = await channel.channelData_.call();
      const newAmount = data[indexes.AMOUNT_OWED];

      assert.equal(amount,newAmount,'Amount should be updated');
      const newNonce = data[indexes.CLOSED_NONCE];
      assert.equal(nonce,newNonce,'Nonce should be updated');
  })

  it('Should fail when we try to settle the address before the time period is expired',async()=>
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
          assertRevert(error);
      }
  })

  it('Should transfer funds to user once channel has settled',async()=>
  {
      const channel = await STKChannel.deployed();
      const token =  await STKToken .deployed();
      const data  = await channel.channelData_.call();
      const blocksToWait = data[indexes.TIMEOUT];
      const returnToken = true;
      console.log('waiting for '+ blocksToWait.valueOf() + ' blocks');

      for(i = 0;i<blocksToWait;i++)
      {
          var transaction = {from:web3.eth.accounts[0],to:web3.eth.accounts[1],gasPrice:1000000000,value:100};
          web3.eth.sendTransaction(transaction);
      }
      const depositedTokens = await token.balanceOf(channel.address);
      const oldStackBalance = await token.balanceOf(stackAddress);
      const oldUserBalance = await token.balanceOf(userAddress);
      const amountToBeTransferred = data[indexes.AMOUNT_OWED];
      const cost = await channel.settle.estimateGas(returnToken);
      console.log('estimated gas cost of settling the channel: ' + cost );
      await channel.settle(returnToken);
      const newUserBalance = await token.balanceOf(userAddress);
      const newStackBalance = await token.balanceOf(stackAddress);

      assert.equal(parseInt(newStackBalance.valueOf()), parseInt(oldStackBalance.valueOf()) + parseInt(amountToBeTransferred.valueOf()), 'The stack account value should be credited');

      assert.equal(parseInt(newUserBalance.valueOf()),parseInt(oldUserBalance.valueOf()) + parseInt(depositedTokens.valueOf()) - parseInt(amountToBeTransferred.valueOf()),'The User address should get back the unused tokens');
    })

    it('Should be able to reset the state of the channel after settling',async()=>
    {
        const channel = await STKChannel.deployed();
        const data  = await channel.channelData_.call();
        const closingAddress = data[indexes.CLOSING_ADDRESS];
        const amountOwed = data[indexes.AMOUNT_OWED];
        const openedBlock = data[indexes.OPENED_BLOCK];
        const closedBlock = data[indexes.CLOSED_BLOCK];
        const closedNounce = data[indexes.CLOSED_NONCE];

        const currentBlockNumber = web3.eth.blockNumber;

        assert.equal(closingAddress.toString(),'0x0000000000000000000000000000000000000000','closing address are not equal');
        assert.equal(amountOwed.valueOf(),0,'The amount owned should be zero')
        assert.equal(openedBlock.valueOf(),currentBlockNumber,'opened block are not equal');
        assert.equal(closedBlock.valueOf(),0,'The closed block should be zero')
        assert.equal(closedNounce.valueOf(),0,'The closed nounce should be zero')

    })

    it('Should be able to have token remain in the channel after settling',async()=>
    {
      const token = await STKToken .deployed();
      const channel = await STKChannel.deployed();
      await token.approve(channel.address,100);
      const allowance = await token.allowance(accounts[0],channel.address);
      await token.transfer(channel.address, 100);
      const balance = await token.balanceOf(channel.address);

      const nonce = 5;
      const amount = 5;
      const cryptoParams = closingHelper.getClosingParameters(nonce,amount,STKChannel.address,signersPk);
      const cost = await  channel.close.estimateGas(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s, {from:stackAddress});
      await channel.close(nonce,amount,cryptoParams.v,cryptoParams.r,cryptoParams.s, {from:stackAddress});
      const data  = await channel.channelData_.call();

      const blocksToWait = data[indexes.TIMEOUT];
      const returnToken = false;
      console.log('waiting for '+ blocksToWait.valueOf() + ' blocks');

      for(i = 0;i<blocksToWait;i++)
      {
          var transaction = {from:web3.eth.accounts[0],to:web3.eth.accounts[1],gasPrice:1000000000,value:100};
          web3.eth.sendTransaction(transaction);
      }

      const depositedTokens = await token.balanceOf(channel.address);
      const oldUserBalance = await token.balanceOf(userAddress);
      const oldStackBalance = await token.balanceOf(stackAddress);
      const oldChannelBalance = await token.balanceOf(channel.address);
      const amountToBeTransferred = data[indexes.AMOUNT_OWED];
      await channel.settle(returnToken);
      const newUserBalance = await token.balanceOf(userAddress);
      const newStackBalance = await token.balanceOf(stackAddress);
      const newChannelBalance = await token.balanceOf(channel.address);

      assert.equal(parseInt(newStackBalance.valueOf()),parseInt(oldStackBalance.valueOf()) + parseInt(amountToBeTransferred.valueOf()), 'The stack account value should be credited');

      assert.equal(parseInt(newChannelBalance.valueOf()),parseInt(oldChannelBalance.valueOf()) - parseInt(amountToBeTransferred.valueOf()), 'Unspent token should remain in the channel account');

      assert.equal(parseInt(newUserBalance.valueOf()),parseInt(oldUserBalance.valueOf()), 'The User address account value should remain the same');
    })
})
