// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VenusToken {

    address public underlyingToken;

    constructor(address _underlyingToken) {
        underlyingToken = _underlyingToken;
    }

    function mint(uint mintTokens) external returns(uint) {
        IERC20(underlyingToken).transferFrom(msg.sender, address(this), mintTokens);
        return 0;
    }
    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        IERC20(underlyingToken).transfer(msg.sender, redeemAmount);
        return 0;
    }
}