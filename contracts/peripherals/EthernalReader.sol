// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEthernalBridge {
    function getTokenPause(address token) external view returns(bool);
    function getTokenVault(address token) external view returns(address);
    function getTokenIndexVault(uint256 tokenIndex) external view returns(address);
    function getFaucet() external view returns(uint256);
}

interface IVault {
    function tokenIndex() external view returns(uint256);
    function reserveToken() external view returns(address);
    function minDeposit() external view returns(uint256);
    function depositPause() external view returns(bool);
    function totalBalance() external view returns(uint256);
    function isVaultMintable() external view returns(bool);
}

interface IVaultEthernal {
    function ethernalToken() external view returns(address);
}

interface IEthernalToken {
    function interestPerBlock() external view returns(uint256);
    function blockPerYear() external view returns(uint256);
    function ethernalToReserveAmount(uint256 amount) external view returns(uint256);
    function ethernalRatio() external view returns(uint256);
}

contract EthernalReader {
    struct UserTokenInfo {
        address token; // token address
        uint256 tokenIndex; // token index
        uint256 balance; // user balance
        address vault; // vault address
        bool isPause; // is pause for bridge

        // for ethernal token
        bool isEthernalToken; // is ethernal token
        uint256 apr; // apr for ethernal token
        uint256 exchangeRate; // exchange rate for ethernal token
        uint256 reserveBalance; // reserve balance for ethernal token
    }

    address public constant ETH_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function getUserTokenInfo(address _ethernalBridge, address _account, address[] memory _tokens) external view returns(UserTokenInfo[] memory) {
        UserTokenInfo[] memory userTokenInfos = new UserTokenInfo[](_tokens.length);
        for (uint256 i = 0; i < _tokens.length; i++) {
            address token = _tokens[i];

            // get token info
            address vault = IEthernalBridge(_ethernalBridge).getTokenVault(token);
            uint256 tokenIndex = IVault(vault).tokenIndex();
            uint256 balance = 0;
            if (token == ETH_TOKEN) {
                balance = _account.balance;
            } else {
                balance = IERC20(token).balanceOf(_account);
            }
            bool pause = IEthernalBridge(_ethernalBridge).getTokenPause(token);

            // check if reserveToken != token, it's ethernal token
            bool isEthernalToken = IVault(vault).reserveToken() != token;
            uint256 apr = 0;
            uint256 exchangeRate = 1e18;
            uint256 reserveBalance = balance;
            
            if (isEthernalToken) {
                address ethernalToken = IVaultEthernal(vault).ethernalToken();
                // precision 18 decimals
                apr = IEthernalToken(ethernalToken).interestPerBlock() * IEthernalToken(ethernalToken).blockPerYear();
                // get exchange rate
                exchangeRate = IEthernalToken(ethernalToken).ethernalRatio();
                // get reserve balance
                reserveBalance = IEthernalToken(ethernalToken).ethernalToReserveAmount(balance);
            }
            
            userTokenInfos[i] = UserTokenInfo({
                token: token,
                tokenIndex: tokenIndex,
                balance: balance,
                vault: vault,
                isPause: pause,
                isEthernalToken: isEthernalToken,
                apr: apr,
                exchangeRate: exchangeRate,
                reserveBalance: reserveBalance
            });
        }

        return userTokenInfos;
    }

    function getTokenInfo(address _ethernalBridge, address _token) public view returns(
        uint256 minAmount,
        bool isPause,
        uint256 totalBalance,
        bool isVaultMintable,
        bool isEthernalToken,
        uint256 apr,
        uint256 exchangeRate,
        uint256 faucet
    ) {
        // get vault
        address vault = IEthernalBridge(_ethernalBridge).getTokenVault(_token);
        minAmount = IVault(vault).minDeposit();
        isPause = IVault(vault).depositPause();
        totalBalance = IVault(vault).totalBalance();
        isVaultMintable = IVault(vault).isVaultMintable();
        faucet = IEthernalBridge(_ethernalBridge).getFaucet();

        // check if reserveToken != token, it's ethernal token
        isEthernalToken = IVault(vault).reserveToken() != _token;
        exchangeRate = 1e18;

        if (isEthernalToken) {
            address ethernalToken = IVaultEthernal(vault).ethernalToken();
            // precision 18 decimals
            apr = IEthernalToken(ethernalToken).interestPerBlock() * IEthernalToken(ethernalToken).blockPerYear();
            // get exchange rate
            exchangeRate = IEthernalToken(ethernalToken).ethernalRatio();
        }
    }
}