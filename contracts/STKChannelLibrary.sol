pragma solidity ^0.4.11;

import "./STKToken.sol";
import "./SafeMathLib.sol";

library STKChannelLibrary
{
    using SafeMathLib for uint;

    struct STKChannelData
    { STKToken  token_;
      address userAddress_;
      address recepientAddress_;
      address closingAddress_;
      uint timeout_;
      uint tokenBalance_;
      uint amountOwed_;
      uint openedBlock_;
      uint closedBlock_;
      uint closedNonce_;
    }

    event LogChannelSettled(uint blockNumber, uint finalBalance);
    event Debug(string str);
    event DebugBool(bool result);
    event DebugAddress(address Address);
    event DebugUint(uint value);

    modifier channelAlreadyClosed(STKChannelData storage data)
    {
      require(data.closedBlock_ > 0);
      _;
    }

    modifier timeoutNotOver(STKChannelData storage data)
    {
      require(data.closedBlock_ + data.timeout_ >= block.number);
      _;
    }

    modifier timeoutOver(STKChannelData storage data)
    {
      require(data.closedBlock_ + data.timeout_ < block.number);
      _;
    }

    modifier channelIsOpen(STKChannelData storage data)
    {
      require(data.closedBlock_ == 0);
      require(data.openedBlock_ > 0);
      _;
    }

    modifier callerIsChannelParticipant(STKChannelData storage data)
    {
      require(msg.sender == data.recepientAddress_  || msg.sender == data.userAddress_);
      _;
    }

    /**
    * @notice deposit _amount into the channel.
    * @param data The channel specific data to work on.
    * @param _amount The amount of tokens to deposit into the channel.
    */
    function deposit(STKChannelData storage data, uint256 _amount)
      public
      channelIsOpen(data)
    {
      // only user can deposit into account
      require(msg.sender == data.userAddress_);
      require(_amount>0);
      require(data.token_.balanceOf(msg.sender) >= _amount);
      require(data.token_.allowance(msg.sender,this) >= _amount);
      var success = data.token_.transferFrom(msg.sender,this,_amount);
      require(success);
      data.tokenBalance_ = data.tokenBalance_.plus(_amount);

    }

    /**
    * @notice Function to close the payment channel. If Signature is empty/malformed it WILL still close the channel.
    * @param data The channel specific data to work on.
    * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
    * @param _amount The amount of tokens claimed to be due to the receiver.
    * @param _signature The signed amount and nonce, It is in the form of keccak256(this,nonce,address).
    */
    function close(STKChannelData storage data,uint _nonce,
      uint _amount,
      bytes _signature)
      public
      channelIsOpen(data)
      callerIsChannelParticipant(data)
    { // update with sig length check
        Debug('Closing');
        require(_amount <= data.tokenBalance_);
        Debug('closedBlock_ == 0');
        DebugBool(data.closedBlock_ == 0);
        Debug('_amount <= tokenBalance_');
        DebugBool(_amount <= data.tokenBalance_);
        Debug('amount');
        DebugUint(_amount);
        Debug('Pre-checks complete');
        // This assumes at least one signed message has been sent
        Debug('signature Length');
        DebugUint(_signature.length);
        if(_signature.length == 65)
        {
        address signerAddress = recoverAddressFromSignature(_nonce,_amount,_signature);
        Debug('signerAddress');
        DebugAddress(signerAddress);
        require((signerAddress == data.userAddress_ && data.recepientAddress_  == msg.sender) || (signerAddress == data.recepientAddress_  && data.userAddress_==msg.sender));
        Debug('(signerAddress == userAddress_ && recepientAddress_  == msg.sender) || (signerAddress == recepientAddress_  && userAddress_==msg.sender)');
        DebugBool((signerAddress == data.userAddress_ && data.recepientAddress_  == msg.sender) || (signerAddress == data.recepientAddress_  && data.userAddress_==msg.sender));
        require(signerAddress!=msg.sender);
        DebugBool(signerAddress!=msg.sender);
          data.amountOwed_ = _amount;
          data.closedNonce_ = _nonce;
        }
        data.closedBlock_ = block.number;
        data.closingAddress_ = msg.sender;
    }

    /**
    * @notice Function to contest the closing state of the payment channel. Will be able to be called for a time period (in blocks) given by timeout after closing of the channel.
    * @param data The channel specific data to work on.
    * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
    * @param _amount The amount of tokens claimed to be due to the receiver.
    * @param _v Cryptographic param v derived from the signature.
    * @param _r Cryptographic param r derived from the signature.
    * @param _s Cryptographic param s derived from the signature.
    */
    function updateClosedChannel(STKChannelData storage data,uint _nonce,
      uint _amount,
      uint8 _v,
      bytes32 _r,
      bytes32 _s)
      public
      callerIsChannelParticipant(data)
      channelAlreadyClosed(data)
    { // closer cannot update the state of the channel after closing
      Debug('msgSender');
      DebugAddress(msg.sender);
      require(msg.sender != data.closingAddress_);
      require(data.tokenBalance_ >= _amount);
      bytes32 msgHash = keccak256(this,_nonce,_amount);
      bytes memory prefix = "\x19Ethereum Signed Message:\n32";
      bytes32 prefixedHash = keccak256(prefix, msgHash);
      address signerAddress = ecrecover(prefixedHash,_v,_r,_s);
      Debug('signer Address');
      DebugAddress(signerAddress);
      Debug('signerAddress == closingAddress_');
      DebugBool(signerAddress == data.closingAddress_);
      require(signerAddress == data.closingAddress_);
      // require that the nonce of this transaction be higher than the previous closing nonce
      Debug('_nonce > closedNonce_');
      DebugBool(_nonce > data.closedNonce_);
      require(_nonce > data.closedNonce_);
      data.closedNonce_ = _nonce;
      //update the amount
      data.amountOwed_ = _amount;
    }

    /**
    * @notice After the timeout of the channel after closing has passed, can be called by either participant to withdraw funds.
    * @param data The channel specific data to work on.
    */
    function settle(STKChannelData storage data)
      public
      channelAlreadyClosed(data)
      timeoutOver(data)
      callerIsChannelParticipant(data)
    {
      require(data.tokenBalance_ >= data.amountOwed_);
      uint returnToUserAmount = data.tokenBalance_.minus(data.amountOwed_);
      if(data.amountOwed_ > 0)
      {
        require(data.token_.transfer(data.recepientAddress_ ,data.amountOwed_));
      }
      if(returnToUserAmount > 0)
      {
        require(data.token_.transfer(data.userAddress_,returnToUserAmount));
      }
      LogChannelSettled(block.number,data.amountOwed_);
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
         Debug('_signature.length == 65');
         DebugBool(_signature.length == 65);
         bytes memory prefix = "\x19Ethereum Signed Message:\n32";
         bytes32 msgHash = keccak256(this,_nonce,_amount);
         bytes32 prefixedHash = keccak256(prefix, msgHash);
         var (r, s, v) = signatureSplit(_signature);

         return ecrecover(prefixedHash, v, r, s);
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
          if(v ==0 || v ==1)
            v = v + 27 ;
          Debug('v == 27 || v == 28');
          DebugBool(v == 27 || v == 28);
          require(v == 27 || v == 28);
      }
}
