// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IVBNB {
    function mint() external payable;
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function exchangeRateStored() external view returns (uint);
}