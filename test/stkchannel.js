
var STKChannel = artifacts.require('./STKChannel.sol');
var HumanStandardToken = artifacts.require('./HumanStandardToken.sol');
var sha3 = require('solidity-sha3').default;
contract("STKChannel", function(accounts,done)
{

	it("STK Channel is deployed ", function()
	{
		return STKChannel.deployed().then(done).catch(done);
	});

	it("STK Channel user acccount is the first account", function()
	{
			return STKChannel.deployed().then(function(instance)
		{
			 return instance.userAddress_.call().then(function(address){
				 assert.equal(address.toString(),accounts[0],'accounts are not equal');
			 });
		});
	});

	it('Second account is Recipient account',function()
	{
		return STKChannel.deployed().then(function(instance)
		{
			return instance.receipientAddress_.call().then(function(address)
			{
			 assert.equal(address.toString(),accounts[1],'accounts are not equal');
			});
		});
	});

	it('STK Channel expiry time is 50',function()
	{
		return STKChannel.deployed().then(function(instance)
		{
			return instance.timeout_.call().then(function(timeout_)
			{
				assert.equal(timeout_.valueOf(),50,'values are not equal');
			});
		});
	});

	it('Deposit 50 tokens to the stkchannel',function()
	{
		return HumanStandardToken.deployed().then(function(token)
		{
			return STKChannel.deployed().then(function(channel)
			{
				return token.approve(channel.address,50).then(function()
				{
					return token.allowance(accounts[0],channel.address).then(function(allowance)
					{
						return channel.deposit(50).then(function()
							{
								return channel.tokenBalance_.call().then(function(balance)
								{
									assert.equal(balance.valueOf(),50,'the deposited values are not equal');
								});
							});
						});
					});
				});
			});
		});

		it('Close the channel without a  signature',function()
		{
			return STKChannel.deployed().then(function(channel)
			{
				return channel.close(0,0,0).then(function()
				{
					return channel.closedBlock_.call().then(function(block)
					{
						assert.isAbove(block.valueOf(),0,'closed block is not greater than zero');
					});
				});
			});
		});

		it('Basic sh3 test',function()
		{
				var nonce = 1;
				var amount = 50;
				var address = STKChannel.address;
				var sig = sha3(address,nonce,amount);
				return STKChannel.deployed().then(function(channel)
				{
				 	assert.equal(sig,sha3(channel.address,nonce,amount),'the sigs are not equal');
				});
		});



});
