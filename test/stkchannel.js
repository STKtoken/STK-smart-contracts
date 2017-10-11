var STKChannel = artifacts.require('./STKChannel.sol');
var HumanStandardToken = artifacts.require('./HumanStandardToken.sol');


contract("STKChannel", function(accounts,done){

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
		 return instance.timeout_.call().then(function(timeout_){
			 assert.equal(timeout_.valueOf(),50,'values are not equal');
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
							assert.equal(allowance.valueOf(),50, 'The deposited amount of tokens is 50 ');

						});
					});
				});
			});
	});

});
