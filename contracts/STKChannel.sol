pragma solidity ^0.4.11;

import "./Token.sol";
import "./SafeMathLib.sol";

/**
Payment Channel between two parties that allows multiple deposits.
Once closed, there is a contest period which allows state updates.
*/
contract STKChannel
{
  using SafeMathLib for uint;
  /**
   * Storage variables
   */
  Token public token_;
  address public userAddress_;
  address public receipientAddress_;
  uint public timeout_;
  uint public tokenBalance_;
  uint public amountOwed_;
  uint public openedBlock_;
  uint public closedBlock_;
  uint public closedNonce_;
  address public closingAddress_;

  event LogChannelOpened(address from, address to, uint blockNumber);
  event LogChannelClosed(uint blockNumber, address closer, uint amount);
  event LogDeposited(address depositingAddress, uint amount);
  event LogChannelSettled(uint blockNumber, uint finalBalance);
  event LogChannelContested(uint amount, address caller);

  modifier channelAlreadyClosed()
  {
    require(closedBlock_ > 0);
    _;
  }

  modifier timeoutNotOver()
  {
    require(closedBlock_ + timeout_ >= block.number);
    _;
  }

  modifier timeoutOver()
  {
    require(closedBlock_ + timeout_ < block.number);
    _;
  }

  modifier channelIsOpen()
  {
    require(closedBlock_ == 0);
    require(openedBlock_ > 0);
    _;
  }

  modifier callerIsChannelParticipant()
  {
    require(msg.sender == receipientAddress_ || msg.sender == userAddress_);
    _;
  }

  /**
   * @dev Contract constructor
   * @param _to The receiving address in the contract.
   * @param _addressOfToken The address when the ERC20 token is deployed.
   * @param _expiryTime The time in blocks of waiting after channel closing after which it can be settled.
   */
  function STKChannel(
    address _to,
    address _addressOfToken,
    uint _expiryTime)
    public
  {  //can't open a channel with yourself.
      require(_to != msg.sender);
      userAddress_ = msg.sender;
      receipientAddress_ = _to;
      timeout_ = _expiryTime;
      token_ = Token(_addressOfToken);
      openedBlock_ = block.number;
      LogChannelOpened(userAddress_,receipientAddress_,openedBlock_);
  }

  /**
  * @notice deposit _amount into the channel.
  * @param _amount The amount of tokens to deposit into the channel.
  */
  function deposit(uint256 _amount)
    external
    channelIsOpen()
    returns (bool,uint256)
  {
    // only user can deposit into account
    require(msg.sender == userAddress_);
    require(_amount>0);
    require(token_.balanceOf(msg.sender) >= _amount);
    require(token_.allowance(msg.sender,this) >= _amount);
    var success = token_.transferFrom(msg.sender,this,_amount);
    if(success == true)
    {
      tokenBalance_ = tokenBalance_.plus(_amount);
      LogDeposited(msg.sender,_amount);
      return (true,tokenBalance_);
    }
    return (false, 0);
  }

  /**
  * @notice Function to close the payment channel. If Signature is empty/malformed it WILL still close the channel.
  * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
  * @param _amount The amount of tokens claimed to be due to the receiver.
  * @param _signature The signed amount and nonce, It is in the form of keccak256(this,nonce,address).
  */
  function close(uint _nonce,
    uint _amount,
    bytes _signature)
    external
    channelIsOpen()
    callerIsChannelParticipant()
  { // update with sig length check
      require(closedBlock_ == 0);
      require(_amount <= tokenBalance_);
      closedBlock_ = block.number;
      closingAddress_ = msg.sender;
      // This assumes at least one signed message has been sent
      if(_signature.length == 65)
      {
      address signerAddress = recoverAddressFromSignature(_nonce,_amount,_signature);
      require((signerAddress == userAddress_ && receipientAddress_ == msg.sender) || (signerAddress == receipientAddress_ && userAddress_==msg.sender));
      require(signerAddress!=msg.sender);
        amountOwed_ = _amount;
        closedNonce_ = _nonce;
      }
      //can't owe more than the total amount in the channel
      LogChannelClosed(block.number,msg.sender,_amount);
  }

  /**
  * @notice Function to contest the closing state of the payment channel. Will be able to be called for a time period (in blocks) given by timeout after closing of the channel.
  * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
  * @param _amount The amount of tokens claimed to be due to the receiver.
  * @param _v Cryptographic param v derived from the signature.
  * @param _r Cryptographic param r derived from the signature.
  * @param _s Cryptographic param s derived from the signature.
  */
  function updateClosedChannel(uint _nonce,
    uint _amount,
    uint8 _v,
    bytes32 _r,
    bytes32 _s)
    external
    callerIsChannelParticipant()
    channelAlreadyClosed()
  { // closer cannot update the state of the channel after closing
    require(msg.sender != closingAddress_);
    bytes32 msgHash = keccak256(this,_nonce,_amount);
    address signerAddress = ecrecover(msgHash,_v,_r,_s);
    require(signerAddress == closingAddress_);
    // require that the nonce of this transaction be higher than the previous closing nonce
    require(_nonce > closedNonce_);
    closedNonce_ = _nonce;
    //update the amount
    amountOwed_ = _amount;
    LogChannelContested(_amount,msg.sender);
  }

  /**
  * @notice After the timeout of the channel after closing has passed, can be called by either participant to withdraw funds.
  */
  function settle()
    external
    channelAlreadyClosed()
    timeoutOver()
    callerIsChannelParticipant()
  {
    require(tokenBalance_ >= amountOwed_);
    uint returnToUserAmount = tokenBalance_.minus(amountOwed_);
    if(amountOwed_ > 0)
    {
      require(token_.transfer(receipientAddress_,amountOwed_));
    }
    if(returnToUserAmount > 0)
    {
      require(token_.transfer(userAddress_,returnToUserAmount));
    }
    LogChannelSettled(block.number, amountOwed_);
    //destroy the payment channel, if anyone accidentally sent ether to this address it gets burned here.
    selfdestruct(address(0));
  }

  /**
  * @notice Internal function to recover the signing address of a signature.
  * @param _nonce The nonce of the new transaction in the contest, must be higher than the previously claimed nonce.
  * @param _amount The amount of tokens claimed to be transferred.
  * @param _signature The signed transaction.
  */
  function recoverAddressFromSignature(
       uint _nonce,
       uint _amount,
       bytes _signature
    )
       constant
       internal
       returns (address)
   {
       bytes32 signed_hash;
       require(_signature.length == 65);
       signed_hash = keccak256(this,_nonce,_amount);
       var (r, s, v) = signatureSplit(_signature);
       return ecrecover(signed_hash, v, r, s);
   }

   /**
   * @notice Internal function to split a signature into the component (r,s,v).
   * @param _signature The signed transaction.
   */
   function signatureSplit(bytes _signature)
        internal
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        // The signature format is a compact form of:
        // {bytes32 r}{bytes32 s}{uint8 v}
        // Compact means, uint8 is not padded to 32 bytes.
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            // Here we are loading the last 32 bytes, including 31 bytes
            // of 's'. There is no 'mload8' to do this.
            //
            // 'byte' is not working due to the Solidity parser, so lets
            // use the second best option, 'and'
            v := and(mload(add(_signature, 65)), 0xff)
        }
        require(v == 27 || v == 28);
    }
}
