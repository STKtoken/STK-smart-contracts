/**
 * This smart contract code is Copyright 2017 TokenMarket Ltd. For more information see https://tokenmarket.net
 *
 * Licensed under the Apache License, version 2.0: https://github.com/TokenMarketNet/ico/blob/master/LICENSE.txt
 */

pragma solidity ^0.4.23;

/**
 * Safe unsigned safe math.
 *
 */
library SafeMathLib {

  function times(uint a, uint b)
     internal pure returns (uint) {
        uint c = a * b;
        assert(a == 0 || c / a == b);
        return c;
  }

  function minus(uint a, uint b)
      internal pure returns (uint) {
          assert(b <= a);
          return a - b;
  }

  function plus(uint a, uint b)
      internal pure returns (uint) {
      uint c = a + b;
      assert(c>=a);
      return c;
  }
}
