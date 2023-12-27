// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IEthernalToken {
    function deposit(uint256 amount) external returns(uint256);
    function withdraw(uint256 amount) external returns(uint256);
    function ethernalToReserveAmount(uint256 amount) external view returns(uint256);
}