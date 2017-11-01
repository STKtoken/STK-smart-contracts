const sha3 = require('solidity-sha3').default;
var ethUtil = require('ethereumjs-util');
module.exports = {
  "getClosingParameters": function(nonce,amount,channelAddress,signingAddress)
  {
    const hash = sha3(channelAddress,nonce,amount);
    const signature = web3.eth.sign(signingAddress,hash);
    const signatureData = ethUtil.fromRpcSig(signature);
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    return {r:r,s:s,v:v};
  }
}
