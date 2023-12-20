// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IVToken {
  function mint(uint mintTokens) external returns (uint);
  function redeem(uint redeemTokens) external returns (uint);
  function balanceOf(address account) external view returns (uint256);
}