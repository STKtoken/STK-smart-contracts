pragma solidity ^0.4.11;

import "./STKChannelLibrary.sol";

/**
Payment Channel between two parties that allows multiple deposits.
Once closed, there is a contest period which allows state updates.
*/
contract STKChannel
{
  using STKChannelLibrary for STKChannelLibrary.STKChannelData;
  /**
   * Storage variables
   */
  STKChannelLibrary.STKChannelData public channelData_;

  event LogChannelOpened(address from, address to,uint blockNumber);
  event LogChannelClosed(uint blockNumber,address closer,uint amount);
  event LogDeposited(address depositingAddress,uint amount);
  event LogChannelContested(uint amount,address caller);

  /**
   * @dev Contract constructor
   * @param _to The receiving address in the contract.
   * @param _addressOfToken The address when the ERC20 token is deployed.
   * @param _expiryNumberofBlocks The time in blocks of waiting after channel closing after which it can be settled.
   */
  function STKChannel(
    address _to,
    address _addressOfToken,
    uint _expiryNumberofBlocks)
    public
  {
       //cannot open a channel with yourself.
       require(_to != msg.sender);
       channelData_.userAddress_ = msg.sender;
       channelData_.recepientAddress_  = _to;
       channelData_.timeout_ = _expiryNumberofBlocks;
       channelData_.token_ = STKToken(_addressOfToken);
       channelData_.openedBlock_ = block.number;
      LogChannelOpened(channelData_.userAddress_,channelData_.recepientAddress_ ,channelData_.openedBlock_);
  }

  /**
  * @notice deposit _amount into the channel.
  * @param _amount The amount of tokens to deposit into the channel.
  */
  function deposit(uint256 _amount)
    external
  {
    channelData_.deposit(_amount);
    LogDeposited(msg.sender,_amount);
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
  {
    channelData_.close(_nonce,_amount,_signature);
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
  {
    channelData_.updateClosedChannel(_nonce,_amount,_v,_r,_s);
    LogChannelContested(_amount,msg.sender);
  }

  /**
  * @notice After the timeout of the channel after closing has passed, can be called by either participant to withdraw funds.
  */
  function settle()
    external
  {
    channelData_.settle();
  }
}
