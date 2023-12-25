// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IVToken {
    function mint(uint mintTokens) external returns(uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function exchangeRateStored() external view returns (uint);
}