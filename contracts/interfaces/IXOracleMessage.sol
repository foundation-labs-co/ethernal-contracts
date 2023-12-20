// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IXOracleMessage {
    function sendMessage(bytes memory payload, address endpoint, uint64 dstChainId) external;
    function xOracleCall(bytes memory payload) external;
}
