const web3Utils = require('web3-utils')
var ethUtil = require('ethereumjs-util');
const prefix = new Buffer("\x19Ethereum Signed Message:\n");
module.exports = {
  "getClosingParameters": function(nonce,amount,channelAddress,signersPk)
    {
      const hash = web3Utils.soliditySha3(channelAddress,nonce,amount);
      const hashBuffer = ethUtil.toBuffer(hash);
      const prefixedHash = addPrefix(hashBuffer);
      const signature = ethUtil.ecsign(prefixedHash, signersPk);
      var serialized = ethUtil.bufferToHex(concatSig(signature.v, signature.r, signature.s));
      const signatureData = ethUtil.fromRpcSig(serialized);
      let v = ethUtil.bufferToHex(signatureData.v)
      let r = ethUtil.bufferToHex(signatureData.r)
      let s = ethUtil.bufferToHex(signatureData.s)
      return {r:r,s:s,v:v};
    }
}

function addPrefix(msgHash) {
  return ethUtil.sha3(
    Buffer.concat([prefix, Buffer.from(msgHash.length.toString()), msgHash])
  );
}

function concatSig(v, r, s) {
  r = ethUtil.fromSigned(r)
  s = ethUtil.fromSigned(s)
  v = ethUtil.bufferToInt(v)
  r = ethUtil.toUnsigned(r).toString('hex')
  s = ethUtil.toUnsigned(s).toString('hex')
  v = ethUtil.stripHexPrefix(ethUtil.intToHex(v))
  return ethUtil.addHexPrefix(r.concat(s, v).toString("hex"))
}

