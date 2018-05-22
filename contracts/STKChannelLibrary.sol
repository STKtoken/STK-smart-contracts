pragma solidity ^0.4.23;

import "./STKToken.sol";
import "./SafeMathLib.sol";

library STKChannelLibrary
{
    using SafeMathLib for uint;

    struct STKChannelData
    {    STKToken token_;
         address userAddress_;
         address signerAddress_;
         address recipientAddress_;
         address closingAddress_;
         uint timeout_;
         uint amountOwed_;
         uint openedBlock_;
         uint closedBlock_;
         uint closedNonce_;
    }

    event LogChannelSettled(uint blockNumber, uint finalBalance);
    event CloseTest(address addr);

    modifier channelAlreadyClosed(STKChannelData storage data)
    {
        require(data.closedBlock_ > 0);
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
    * @notice Function to close the payment channel.
    * @param data The channel specific data to work on.
    * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
    * @param _amount The amount of tokens claimed to be due to the receiver.
    * @param _v Cryptographic param v derived from the signature.
    * @param _r Cryptographic param r derived from the signature.
    * @param _s Cryptographic param s derived from the signature.
    */
    function close(
        STKChannelData storage data,
        address _channelAddress,
        uint _nonce,
        uint _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s)
        public
        channelIsOpen(data)
        callerIsChannelParticipant(data)
    {
        require(_amount <= data.token_.balanceOf(_channelAddress));
        address signerAddress = recoverAddressFromHashAndParameters(_nonce,_amount,_r,_s,_v);
        require((signerAddress == data.signerAddress_ && data.recipientAddress_  == msg.sender) || (signerAddress == data.recipientAddress_  && data.signerAddress_==msg.sender));
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
    function updateClosedChannel(
        STKChannelData storage data,
        address _channelAddress,
        uint _nonce,
        uint _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s)
        public
        callerIsChannelParticipant(data)
        channelAlreadyClosed(data)
    {
        require(data.token_.balanceOf(_channelAddress) >= _amount);
        address signerAddress = recoverAddressFromHashAndParameters(_nonce,_amount,_r,_s,_v);
        require(signerAddress == data.signerAddress_);
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
    function settle(STKChannelData storage data, address _channelAddress, bool _returnToken)
        public
        channelAlreadyClosed(data)
        timeoutOver(data)
        callerIsChannelParticipant(data)
    {
        require(data.token_.balanceOf(_channelAddress)>= data.amountOwed_);
        uint returnToUserAmount = data.token_.balanceOf(_channelAddress).minus(data.amountOwed_);
        uint owedAmount = data.amountOwed_;
        data.amountOwed_ = 0;

        data.closingAddress_ = 0x0000000000000000000000000000000000000000;
        data.openedBlock_ = block.number;
        data.closedBlock_ = 0;
        data.closedNonce_ = 0;

        if(owedAmount > 0)
        {
            require(data.token_.transfer(data.recipientAddress_ ,owedAmount));
        }

        if(returnToUserAmount > 0 && _returnToken)
        {
            require(data.token_.transfer(data.userAddress_,returnToUserAmount));
        }

        emit LogChannelSettled(block.number,owedAmount);
    }

    /**
    * @notice After the timeout of the channel after closing has passed, can be called by either participant to withdraw funds.
    * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
    * @param _amount The amount of tokens claimed to be due to the receiver.
    * @param r Cryptographic param v derived from the signature.
    * @param s Cryptographic param r derived from the signature.
    * @param v Cryptographic param s derived from the signature.
    */
    function recoverAddressFromHashAndParameters(uint _nonce,uint _amount,bytes32 r,bytes32 s,uint8 v)
        internal view
        returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 msgHash = keccak256(this,_nonce,_amount);
        bytes32 prefixedHash = keccak256(prefix, msgHash);
        return ecrecover(prefixedHash, v, r, s);
    }
}
