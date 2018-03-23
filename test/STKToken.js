var STKToken = artifacts.require("./STKToken.sol");
const assertRevert = require('./helpers/assertRevert');
const expectThrow = require('./helpers/expectThrow');

contract('STKToken', accounts => {
  userAccount = accounts[0];
  recipientAccount = accounts[1];

  beforeEach(async()=> {
      instance = await STKToken.deployed();
  });

  describe('Initial supply', ()=> {
    it("Should have 1 billion tokens in first account", async()=> {
        const balance = await instance.balanceOf(userAccount);
        assert.equal(balance.valueOf(), 1000000000000000000, '1 billion was not in the first account');
    });
  });

  describe('Vanity check', ()=> {
    it('Should have symbol as STK',async()=> {
        const symbol = await instance.symbol.call();
        assert.equal(symbol,'STK','Symbol is not STK');
    });
  });

  describe('Transfers without approvals', ()=> {
    it('Should transfer 50 tokens from accounts[0] to accounts[1]', async()=> {
        await instance.transfer(recipientAccount, 50, {from: userAccount});
        const recipientBalance = await instance.balanceOf(recipientAccount);
        assert.strictEqual(recipientBalance.toNumber(), 50, 'Oops the recipient account does not have the right amount');
    });

    it('should handle a transfer of zero', async () => {
      assert(await instance.transfer(recipientAccount, 0, { from: userAccount }), 'transfer of zero has failed');
    });

    it('Should fail when 1000000001 tokens are transfered from accounts[0] to accounts[1]', async()=> {
        await instance.transfer(recipientAccount, 1000000000000000001, { from: userAccount })
        const recipientBalance = await instance.balanceOf(recipientAccount);
        assert.strictEqual(recipientBalance.toNumber(), 50, 'the transaction did not fail like it was supposed to');
    });
  });

  describe('Transfers with approvals', ()=> {
      it('msg.sender should approve 50 to accounts[1]', async () => {
        await instance.approve(recipientAccount, 50, { from: userAccount });
        const recipientBalance = await instance.allowance(userAccount, recipientAccount);
        assert.strictEqual(recipientBalance.toNumber(), 50);
      });
  });

});
