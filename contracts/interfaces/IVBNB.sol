// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IVBNB {
    function mint() external payable;
    function redeem(uint redeemTokens) external returns(uint);
}