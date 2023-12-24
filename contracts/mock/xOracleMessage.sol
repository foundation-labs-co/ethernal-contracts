
// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

contract XOracleMessage {
    uint256 public dummy;
    uint256 public fee;

    receive() external payable {}

    function sendMessage(bytes memory /*_payload*/, address /*_endpoint*/, uint64 /*_dstChainId*/) external payable returns (uint256) {
        // Nothing to do
        dummy++;
        return 0;
    }

    function getFee(uint64 /*_dstChainId*/) external view returns(uint256) {
        return fee;
    }

    function setFee(uint256 _fee) external {
        fee = _fee;
    }
}
