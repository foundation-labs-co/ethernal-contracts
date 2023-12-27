// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

contract VenusTokenBNB {

    receive() external payable {}

    function mint() external payable returns(uint) {
        return 0;
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        payable(msg.sender).transfer(redeemAmount);
        return 0;
    }
}