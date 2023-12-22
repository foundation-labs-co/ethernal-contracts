
// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

contract XOracleMessage {
    uint256 public dummy;
    function sendMessage(bytes memory /*_payload*/, address /*_endpoint*/, uint64 /*_dstChainId*/) external returns (uint256) {
        // Nothing to do
        dummy++;
        return dummy;
    }
}