pragma solidity ^0.4.11;
/**
Payment Channel between two parties that allows multiple deposits.
Once closed, there is a contest period which allows state updates.
*/
import "./Token.sol";
import "./SafeMathLib.sol";


contract STKChannel
{
  using SafeMathLib for uint ;
  Token public token;
  address public  userAddress;
  address public receipientAddress;
  uint public  timeout;
  uint public tokenBalance;
  uint public  amountOwed;
  uint public openedBlock;
  uint public closedBlock;
  uint public closedNonce;
  address public  closingAddress;

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
    require(closedBlock == 0);
    require(openedBlock > 0);
    _;
  }

  modifier callerIsChannelParticipant()
  {
    require(msg.sender == receipientAddress || msg.sender == userAddress);
    _;
  }

  function STKChannel(
    address to,
    address addressOfToken,
    uint expiryTime)
    public
  {  //can't open a channel with yourself.
      require(to != msg.sender);
      userAddress = msg.sender;
      receipientAddress = to;
      timeout = expiryTime;
      token = Token(addressOfToken);
      openedBlock = block.number;
      LogChannelOpened(userAddress,receipientAddress,openedBlock);
  }

  /**
  Function to deposit an amount of tokens.
  Assumes that the amount has already been approved for transfer to this address, else it will fail
  */
  function deposit(uint256 amount)
    external
    channelIsOpen()
    returns (bool,uint256)
  {
    // only user can deposit into account
    require(msg.sender == userAddress);
    require(amount>0);
    require(token.balanceOf(msg.sender) >= amount);
    require(token.allowance(msg.sender,this)>=amount);
    var success = token.transferFrom(msg.sender,this,amount);
    if(success == true)
    {
      tokenBalance = tokenBalance.times(amount);
      LogDeposited(msg.sender,amount);
      return (true,tokenBalance);
    }
    return (false, 0);
  }

  /**
  Function to close the payment channel. If Signature is empty/malformed it WILL still close the channel.
  */
  function close(uint nonce,
    uint amount,
    bytes signature)
    external
    channelIsOpen()
    callerIsChannelParticipant()
  { // update with sig length check
      require(closedBlock == 0);
      require(amount <= tokenBalance);
      closedBlock = block.number;
      closingAddress = msg.sender;
      // This assumes at least one signed message has been sent
      if(signature.length == 65)
      {
      address signerAddress = recoverAddressFromSignature(nonce,amount,signature);
      require((signerAddress == userAddress && receipientAddress == msg.sender) || (signerAddress == receipientAddress && userAddress==msg.sender));
      require(signerAddress!=msg.sender);
        amountOwed = amount;
        closedNonce = nonce;
      }
      //can't owe more than the total amount in the channel
      LogChannelClosed(block.number,msg.sender,amount);
  }

  /**
  Function to contest the closing state of  the payment channel.
  Will be able to be called for a time period (in blocks) given by timeout after closing of the channel.
  */
  function updateClosedChannel(uint nonce,
    uint amount,
    uint8 v,
    bytes32 r,
    bytes32 s)
    external
    callerIsChannelParticipant()
    channelAlreadyClosed()
  { // closer cannot update the state of the channel after closing
    require(msg.sender != closingAddress);
    bytes32 msgHash = keccak256(this,nonce,amount);
    address signerAddress = ecrecover(msgHash,v,r,s);
    require(signerAddress == closingAddress);
    // require that the nonce of this transaction be higher than the previous closing nonce
    require(nonce > closedNonce);
    closedNonce = nonce;
    //update the amount
    amountOwed = amount;
    LogChannelContested(amount,msg.sender);
  }

  /**
  After the timeout of the channel after closing has passed, can be called by either participant to withdraw funds.
  */
  function settle()
    external
    channelAlreadyClosed()
    timeoutOver()
    callerIsChannelParticipant()
  {
    require(tokenBalance >= amountOwed);
    uint returnToUserAmount = tokenBalance.minus(amountOwed);
    if(amountOwed > 0)
    {
      require(token.transfer(receipientAddress,amountOwed));
    }
    if(returnToUserAmount > 0)
    {
      require(token.transfer(userAddress,returnToUserAmount));
    }
    LogChannelSettled(block.number, amountOwed);
    //destroy the payment channel, if anyone accidentally sent ether to this address it gets burned here.
    selfdestruct(address(0));
  }

  function recoverAddressFromSignature(
       uint nonce,
       uint amount,
       bytes signature
     )
       constant
       internal
       returns (address)
   {
       bytes32 signed_hash;
       require(signature.length == 65);
       signed_hash = keccak256(this,nonce,amount);
       var (r, s, v) = signatureSplit(signature);
       return ecrecover(signed_hash, v, r, s);
   }

   function signatureSplit(bytes signature)
        internal
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        // The signature format is a compact form of:
        //   {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(signature, 65)), 0xff)
        }
        require(v == 27 || v == 28);
    }
}
