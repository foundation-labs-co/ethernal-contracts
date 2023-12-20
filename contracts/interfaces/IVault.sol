// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IVault {
    function deposit(address from, uint256 amount) external;
    function withdraw(address to, uint256 amount) external;
    function totalBalance() external view returns (uint256);
    function reserveToken() external view returns (address);
    function chainId() external view returns (uint64);
    function tokenIndex() external view returns (uint256);
    function minDeposit() external view returns (uint256);
    function supportTokenIndex(uint256 tokenIndex) external view returns (bool);
    function depositPause() external view returns (bool);
}
