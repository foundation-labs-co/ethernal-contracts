// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface IEthernalBridge {
    function getTokenPause(address _token) external view returns(bool);
    function getTokenVault(address _token) external view returns(address);
}

interface IVault {
    function tokenIndex() external view returns(uint256);
    function reserveToken() external view returns (address);
}

interface IVaultEthernal {
    function ethernalToken() external view returns(address);
}

interface IEthernalToken {
    function interestPerBlock() external view returns(uint256);
    function blockPerYear() external view returns(uint256);
    function ethernalToReserveAmount(uint256 amount) external view returns (uint256);
}

contract EthernalReader {
    struct TokenInfo {
        address token; // token address
        uint256 tokenIndex; // token index
        uint256 balance; // user balance
        address vault; // vault address
        bool isPause; // is pause for bridge

        // for ethernal token
        bool isEthernalToken; // is ethernal token
        uint256 apr; // apr for ethernal token
        uint256 reserveBalance; // reserve balance for ethernal token
    }

    function getUserTokenInfo(address _ethernalBridge, address _account, address[] memory _tokens) external view returns(TokenInfo[] memory) {
        TokenInfo[] memory tokenInfos = new TokenInfo[](_tokens.length);
        for (uint256 i = 0; i < _tokens.length; i++) {
            address token = _tokens[i];

            // get token info
            address vault = IEthernalBridge(_ethernalBridge).getTokenVault(token);
            uint256 tokenIndex = IVault(vault).tokenIndex();
            uint256 balance = IERC20(token).balanceOf(_account);
            bool pause = IEthernalBridge(_ethernalBridge).getTokenPause(token);

            // check if reserveToken != token, it's ethernal token
            bool isEthernalToken = IVault(vault).reserveToken() != token;
            uint256 apr = 0;
            uint256 reserveBalance = balance;
            
            if (isEthernalToken) {
                address ethernalToken = IVaultEthernal(vault).ethernalToken();
                // precision 18 decimals
                apr = IEthernalToken(ethernalToken).interestPerBlock() * IEthernalToken(ethernalToken).blockPerYear();
                // get reserve balance
                reserveBalance = IEthernalToken(ethernalToken).ethernalToReserveAmount(balance);
            }
            
            tokenInfos[i] = TokenInfo({
                token: token,
                tokenIndex: tokenIndex,
                balance: balance,
                vault: vault,
                isPause: pause,
                isEthernalToken: isEthernalToken,
                apr: apr,
                reserveBalance: reserveBalance
            });
        }

        return tokenInfos;
    }
}