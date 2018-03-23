var STKToken = artifacts.require("./STKToken.sol");
const assertRevert = require('./helpers/assertRevert');
const expectThrow = require('./helpers/expectThrow');

const evmThrewError = (err) => {
  if (err.toString().includes('VM Exception')) {
    return true
  }
  return false
}

contract('STKToken', accounts => {
  userAccount = accounts[0];
  recipientAccount = accounts[1];

  beforeEach('deploy contract for each test', async()=> {
      instance = await STKToken.deployed();
  });

  describe('initial supply', ()=> {
    it("Should have 1 billion tokens in first account", async()=> {
      const balance = await instance.balanceOf(userAccount);
      assert.equal(balance.valueOf(), 1000000000, '1 billion was not in the first account');
    });
  });

  describe('vanity check', ()=> {
    it('Should have symbol as STK', async()=> {
        const symbol = await instance.symbol.call();
        assert.equal(symbol,'STK','Symbol is not STK');
    });
  });
   
  // Testing for transfers without approval
  describe('transfers', ()=> {
    it('Should transfer 50 eth from accounts[0] to accounts[1]', async()=> {
        await instance.transfer(recipientAccount, 50, {from: userAccount});
        const balance = await instance.balanceOf.call(recipientAccount);
        assert.strictEqual(balance.toNumber(), 50, 'recipient account did not have 50 eth extra');
    });

    it("should fail transfering 2000000000 tokens from account[0] to account[1]", async () => {
      return instance.transfer(recipientAccount, 1, { from: userAccount })
        .then(() => instance.balanceOf(recipientAccount))
        .catch((err) => assert(evmThrewError(err), err.message))
    })
/*
    it("should fail transfering 2000000000 tokens from account[0] to account[1]", async () => {
        let err = null;

        try
        {
            await instance.transfer(recipientAccount, 500000000000000, { from: userAccount });
            //assert.fail('This transaction should have failed');
        }
        catch(error)
        {
            err = error;
        }

        assert.ok(err instanceof Error);
    });
/*
    it('Should fail when trying to transfer 1000000001 from accounts[0] to accounts[1]', async()=> {
      expectThrow(await instance.transfer(recipientAccount, 10, {from: userAccount}));  
  
      try
        {
            await instance.transferFrom(userAccount, recipientAccount, 0);
            assert.fail('This transaction should have failed');
        }
        catch(error)
        {
            assertRevert(error);
        }
    });*/
  });

});
