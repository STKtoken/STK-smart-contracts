pragma solidity ^0.4.11;

import "./Token.sol";
import "./SafeMathLib.sol";
contract STKChannel
{
  Token token;
  // The address of the user
  address userAddress;
  // The address of STK
  address receipientAddress;
  //address of the deployed STK token address, this could be hardcoded once STK ERC20 Token.
  uint timeout;
  // total amount LogDeposited into channel.
  uint balance;
  // Amount owed to STK
  uint amountOwed;

  uint openedBlock;
  uint closedBlock;
  uint closedNonce;

  address closingAddress;

  //Events
  event LogChannelOpened(address from, address to, uint blockNumber);
  event LogChannelClosed(uint blockNumber, address closer, uint amount);
  event LogDeposited(address depositingAddress, uint amount);
  event LogChannelSettled(uint blockNumber, uint finalBalance);
  event LogChannelContested(uint amount, address caller);

  modifier channelAlreadyClosed()
  {
    require(closedBlock > 0);
    _;
  }
  modifier timeoutNotOver()
  {
    require(closedBlock + timeout >= block.number);
    _;
  }
  modifier timeoutOver()
  {
    require(closedBlock + timeout < block.number);
    _;
  }
  modifier channelIsOpen()
  {
    require(closedBlock == 0 );
    require(openedBlock > 0);
    _;
  }
  function STKChannel(
    address to,
    address addressOfToken,
    uint expiryTime )
    public
  {  // should we require that both addresses be EOA?
      // can't open a channel with yourself
      require(to != msg.sender);
      userAddress = msg.sender;
      receipientAddress = to ;
      timeout = expiryTime;
      token  = Token(addressOfToken);
      openedBlock = block.number;
      LogChannelOpened(userAddress,receipientAddress,openedBlock);
  }

// Deposit into the state channel
  function deposit(uint256 amount)
  public channelIsOpen()
  returns (bool,uint256)
  {
    // only user can deposit into account
    require(msg.sender == userAddress);
    require(amount>0);

    require(token.balanceOf(msg.sender) >= amount);
    require(token.allowance(msg.sender,this)>=amount);
    var success = token.transferFrom(msg.sender, this, amount);
    if(success == true )
    {

      balance = SafeMathLib.plus(balance,amount) ;
      LogDeposited(msg.sender,amount);
      return (true,balance);
    }
    return (false, 0 );
  }
// Close the channel
  function close(uint nonce,
    uint amount,
    bytes32 sig,
    uint8 v,
    bytes32 r,
    bytes32 s)
  public
  {
      require( msg.sender == receipientAddress || msg.sender == userAddress);
      require(closedBlock == 0 );

      address signerAddress = ecrecover(sig,v,r,s);
      // This assumes at least one signed message has been sent
      require((signerAddress == userAddress  && receipientAddress == msg.sender )  || (signerAddress == receipientAddress && userAddress==msg.sender));

      bytes32 proof  = sha3(this,nonce,amount);
      //can't owe more than the total amount in the channel
      require( sig == proof );
      require(amount <= balance);

      amountOwed = amount;
      closedNonce = nonce;
      closedBlock = block.number;
      closingAddress = msg.sender;

      LogChannelClosed(block.number,msg.sender,amount);
  }

  function updateClosedChannel(uint nonce , uint amount ,bytes32 msgHash , uint8 v , bytes32 r, bytes32 s )
  channelAlreadyClosed()
  public
  {
    require(msg.sender == receipientAddress || msg.sender == userAddress);
    // closer cannot update the state of the channel after closing
    require(msg.sender != closingAddress);
    address signerAddress = ecrecover(msgHash, v,r,s);
    require(signerAddress == closingAddress);
    bytes32 proof  = sha3(this,nonce,amount);
    require(msgHash==proof);
    // require that the nonce of this transaction be higher than the previous closing nonce
    require(nonce > closedNonce);
    closedNonce = nonce;
    //update the amount
    amountOwed = amount;
    LogChannelContested(amount,msg.sender);
  }
  function settle()
  channelAlreadyClosed()
  timeoutOver()
  public
  {
    require(balance >= amountOwed);
    uint returnToUserAmount = SafeMathLib.minus(balance,amountOwed);
    if(amountOwed > 0 )
    {
      require(token.transfer(receipientAddress,amountOwed));
    }
    if(returnToUserAmount > 0 )
    {
      require(token.transfer(userAddress,returnToUserAmount));
    }
    LogChannelSettled(block.number, amountOwed);
    //destroy the payment channel
    selfdestruct(0x00000000000000000000);
  }
}
