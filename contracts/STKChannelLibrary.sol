pragma solidity ^0.4.15;

import "./STKToken.sol";
import "./SafeMathLib.sol";

library STKChannelLibrary
{
    using SafeMathLib for uint;

    struct STKChannelData
    {    STKToken token_;
         address userAddress_;
         address recipientAddress_;
         address closingAddress_;
         uint timeout_;
         uint tokenBalance_;
         uint amountOwed_;
         uint openedBlock_;
         uint closedBlock_;
         uint closedNonce_;
    }

    event LogChannelSettled(uint blockNumber, uint finalBalance);

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
        require(msg.sender == data.recipientAddress_  || msg.sender == data.userAddress_);
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
    * @notice Function to close the payment channel.
    * @param data The channel specific data to work on.
    * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
    * @param _amount The amount of tokens claimed to be due to the receiver.
    * @param _v Cryptographic param v derived from the signature.
    * @param _r Cryptographic param r derived from the signature.
    * @param _s Cryptographic param s derived from the signature.
    */
    function close(STKChannelData storage data,uint _nonce,
        uint _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s)
        public
        channelIsOpen(data)
        callerIsChannelParticipant(data)
    {
        require(_amount <= data.tokenBalance_);

        address signerAddress = recoverAddressFromHashAndParameters(_nonce,_amount,_r,_s,_v);
        require((signerAddress == data.userAddress_ && data.recipientAddress_  == msg.sender) || (signerAddress == data.recipientAddress_  && data.userAddress_==msg.sender));
        require(signerAddress!=msg.sender);
        data.amountOwed_ = _amount;
        data.closedNonce_ = _nonce;
        data.closedBlock_ = block.number;
        data.closingAddress_ = msg.sender;
    }

    /**
    * @notice Function to close the payment channel without a signature.
    * @param data The channel specific data to work on.
    */
    function closeWithoutSignature(STKChannelData storage data)
        public
        channelIsOpen(data)
        callerIsChannelParticipant(data)
      {
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
    {   //closer cannot update the state of the channel after closing
        require(msg.sender != data.closingAddress_);
        require(data.tokenBalance_ >= _amount);
        address signerAddress = recoverAddressFromHashAndParameters(_nonce,_amount,_r,_s,_v);
        require(signerAddress == data.closingAddress_);
        //require that the nonce of this transaction be higher than the previous closing nonce
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
            require(data.token_.transfer(data.recipientAddress_ ,data.amountOwed_));
        }

        if(returnToUserAmount > 0)
        {
            require(data.token_.transfer(data.userAddress_,returnToUserAmount));
        }

        LogChannelSettled(block.number,data.amountOwed_);
        //destroy the payment channel, if anyone accidentally sent ether to this address it gets burned here.
        selfdestruct(address(0));
    }

      function recoverAddressFromHashAndParameters(uint _nonce,uint _amount,bytes32 r,bytes32 s,uint8 v)
          internal
          returns (address)
      {
          bytes memory prefix = "\x19Ethereum Signed Message:\n32";
          bytes32 msgHash = keccak256(this,_nonce,_amount);
          bytes32 prefixedHash = keccak256(prefix, msgHash);
          return ecrecover(prefixedHash, v, r, s);
      }
}
