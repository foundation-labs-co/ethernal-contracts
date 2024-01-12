// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IFaucetFund {
    function transferTo(address _receiver) external;
    function faucet() external view returns (uint256);
    function balance() external view returns (uint256);
}