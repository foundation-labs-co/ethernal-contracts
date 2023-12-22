// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IXOracleMessage {
    function sendMessage(bytes memory payload, address endpoint, uint64 dstChainId) external returns (uint256);
    function xOracleCall(bytes memory payload) external;
    function getNonce() external view returns (uint256);
}
