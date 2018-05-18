pragma solidity ^0.4.23;


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

    event LogChannelOpened(address from, address to, uint blockNumber);
    event LogChannelClosed(uint blockNumber, address closer, uint amount);
    event LogDeposited(address depositingAddress, uint amount);
    event LogChannelContested(uint amount, address caller);

    /**
     * @dev Contract constructor
     * @param _from The user address in the contract.
     * @param _addressOfSigner The signer address in the contract.
     * @param _addressOfToken The address when the ERC20 token is deployed.
     * @param _expiryNumberOfBlocks The time in blocks of waiting after channel closing after which it can be settled.
     */
    constructor (
        address _from,
        address _addressOfSigner,
        address _addressOfToken,
        uint _expiryNumberOfBlocks)
        public
    {

        channelData_.userAddress_ = _from;
        channelData_.signerAddress_ = _addressOfSigner;
        channelData_.recipientAddress_ = msg.sender;
        channelData_.timeout_ = _expiryNumberOfBlocks;
        channelData_.token_ = STKToken(_addressOfToken);
        channelData_.openedBlock_ = block.number;

        emit LogChannelOpened(channelData_.userAddress_, channelData_.recipientAddress_, channelData_.openedBlock_);
    }

    /**
    * @notice Function to close the payment channel.
    * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
    * @param _amount The amount of tokens claimed to be due to the receiver.
    * @param _v Cryptographic param v derived from the signature.
    * @param _r Cryptographic param r derived from the signature.
    * @param _s Cryptographic param s derived from the signature.
    */
    function close(
        uint _nonce,
        uint _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s)
        external
    {
        channelData_.close(address(this), _nonce, _amount, _v,_r,_s);
        emit LogChannelClosed(block.number, msg.sender, _amount);
    }

    /**
    * @notice Function to close the payment channel without a signature.
    */
    function closeWithoutSignature()
        external
    {
        channelData_.closeWithoutSignature();
        emit LogChannelClosed(block.number, msg.sender, channelData_.amountOwed_);
    }

    /**
    * @notice Function to contest the closing state of the payment channel. Will be able to be called for a time period (in blocks) given by timeout after closing of the channel.
    * @param _nonce The nonce of the deposit. Used for avoiding replay attacks.
    * @param _amount The amount of tokens claimed to be due to the receiver.
    * @param _v Cryptographic param v derived from the signature.
    * @param _r Cryptographic param r derived from the signature.
    * @param _s Cryptographic param s derived from the signature.
    */
    function updateClosedChannel(
        uint _nonce,
        uint _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s)
        external
    {
        channelData_.updateClosedChannel(address(this), _nonce, _amount, _v, _r, _s);
        emit LogChannelContested(_amount, msg.sender);
    }

    /**
    * @notice After the timeout of the channel after closing has passed, can be called by either participant to withdraw funds.
    */
    function settle(bool _returnToken)
        external
    {
        channelData_.settle(address(this), _returnToken);
    }
}
