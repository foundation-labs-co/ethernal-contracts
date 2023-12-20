// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IVaultETH.sol";
import "./interfaces/IXOracleMessage.sol";

contract EthernalBridge is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint64 public chainId;
    address public constant ETH_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public xOracleMessage;

    mapping (address => address) tokenVaults;
    mapping (uint256 => address) tokenIndexVaults;
    mapping (uint64 => address) public ethernalBridgeEndpoints;

    // events
    event Send(
        uint256 indexed srcTokenIndex, 
        uint256 indexed dstTokenIndex, 
        uint256 amount, 
        uint64 srcChainId, 
        uint64 dstChainId, 
        address indexed from, 
        address receiver
    );
    event Receive(
        uint256 indexed srcTokenIndex, 
        uint256 indexed dstTokenIndex, 
        uint256 amount, 
        uint64 srcChainId, 
        uint64 dstChainId, 
        address indexed from, 
        address receiver
    );
    event AddAllowToken(address indexed token, uint256 indexed tokenIndex, address indexed vault);
    event RemoveAllowToken(address indexed token, uint256 indexed tokenIndex);
    event SetXOracleMessage(address indexed xOracleMessage);
    event SetEndpoint(uint64 indexed dstChainId, address indexed endpoint);

    constructor() {
        chainId = uint64(block.chainid);
    }

    /**
     * @dev Send token to another chain
     * @param _token token address
     * @param _amount amount of token
     * @param _dstChainId destination chainId
     * @param _dstTokenIndex destination tokenIndex
     * @param _receiver receiver address
     */
    function send(address _token, uint256 _amount, uint64 _dstChainId, uint256 _dstTokenIndex, address _receiver) external nonReentrant {
        require(_token != address(0), "invalid token address");
        require(_dstChainId != chainId, "invalid chainId");
        require(_receiver != address(0), "invalid receiver address");

        // endpoint
        address endpoint = ethernalBridgeEndpoints[_dstChainId];
        require(endpoint != address(0), "invalid endpoint address");

        // lookup vault
        IVault vault = IVault(tokenVaults[_token]);
        require(address(vault) != address(0), "token not allowed");
        require(vault.supportTokenIndex(_dstTokenIndex), "tokenIndex not allowed");

        // deposit to vault
        uint256 srcTokenIndex = vault.tokenIndex();
        IERC20(_token).safeTransferFrom(msg.sender, address(vault), _amount);
        vault.deposit(msg.sender, _amount);

        // send message
        bytes memory payload = abi.encode(srcTokenIndex, _dstTokenIndex, _amount, chainId, _dstChainId, msg.sender, _receiver);
        IXOracleMessage(xOracleMessage).sendMessage(payload, endpoint, _dstChainId);

        emit Send(srcTokenIndex, _dstTokenIndex, _amount, chainId, _dstChainId, msg.sender, _receiver);
    }

    /**
     * @dev Send ETH to another chain
     * @param _dstChainId destination chainId
     * @param _dstTokenIndex destination tokenIndex
     * @param _receiver receiver address
     */
    function sendETH(uint64 _dstChainId, uint256 _dstTokenIndex, address _receiver) external payable nonReentrant {
        require(_dstChainId != chainId, "invalid chainId");
        require(_receiver != address(0), "invalid receiver address");

        // endpoint
        address endpoint = ethernalBridgeEndpoints[_dstChainId];
        require(endpoint != address(0), "invalid endpoint address");

        // transfer amount
        uint256 amount = msg.value;

        // lookup vault
        IVaultETH vault = IVaultETH(tokenVaults[ETH_TOKEN]);
        require(address(vault) != address(0), "token not allowed");
        require(vault.supportTokenIndex(_dstTokenIndex), "tokenIndex not allowed");

        // deposit ETH to vault
        uint256 srcTokenIndex = vault.tokenIndex();
        vault.deposit{ value: amount }(msg.sender);

        // send message
        bytes memory payload = abi.encode(srcTokenIndex, _dstTokenIndex, amount, chainId, _dstChainId, msg.sender, _receiver);
        IXOracleMessage(xOracleMessage).sendMessage(payload, endpoint, _dstChainId);

        emit Send(srcTokenIndex, _dstTokenIndex, amount, chainId, _dstChainId, msg.sender, _receiver);
    }

    /**
     * @dev Callback from xOracleMessage (sent from another chain)
     * @param _srcTokenIndex source tokenIndex
     * @param _dstTokenIndex destination tokenIndex
     * @param _amount amount of token
     * @param _srcChainId source chainId
     * @param _dstChainId destination chainId
     * @param _from sender address
     * @param _receiver receiver address
     */
    function receiving(
        uint256 _srcTokenIndex, 
        uint256 _dstTokenIndex, 
        uint256 _amount, 
        uint64 _srcChainId, 
        uint64 _dstChainId, 
        address _from, 
        address _receiver
    ) external nonReentrant {
        // security callback
        require(msg.sender == xOracleMessage, "only xOracleMessage callback");

        require(_amount > 0, "invalid amount");
        require(_dstChainId == chainId, "invalid chainId");
        require(_receiver != address(0), "invalid receiver address");

        // Lookup vault
        address vault = tokenIndexVaults[_dstTokenIndex];
        require(vault != address(0), "tokenIndex not allowed");

        // Withdraw to receiver
        IVault(vault).withdraw(_receiver, _amount);

        emit Receive(_srcTokenIndex, _dstTokenIndex, _amount, _srcChainId, _dstChainId, _from, _receiver);
    }

    // ------------------------------
    // onlyOwner
    // ------------------------------
    function addAllowToken(address _token, address _vault) external onlyOwner {
        require(_token != address(0), "invalid address");
        require(IVault(_vault).chainId() == chainId, "invalid chainId");
        
        uint256 tokenIndex = IVault(_vault).tokenIndex();
        require(tokenIndexVaults[tokenIndex] == address(0), "tokenIndex already exists");

        tokenVaults[_token] = _vault;
        tokenIndexVaults[tokenIndex] = _vault;

        emit AddAllowToken(_token, tokenIndex, _vault);
    }

    function removeAllowToken(address _token) external onlyOwner {
        require(tokenVaults[_token] != address(0), "invalid address");

        address vault = tokenVaults[_token];
        uint256 tokenIndex = IVault(vault).tokenIndex();
        delete tokenIndexVaults[tokenIndex];
        delete tokenVaults[_token];

        emit RemoveAllowToken(_token, tokenIndex);
    }

    function setXOracleMessage(address _xOracleMessage) public onlyOwner() {
        require(_xOracleMessage != address(0), "invalid address");
        xOracleMessage = _xOracleMessage;
        
        emit SetXOracleMessage(_xOracleMessage);
    }

    function setEndpoint(uint64 _dstChainId, address _endpoint) public onlyOwner() {
        require(_endpoint != address(0), "invalid address");
        ethernalBridgeEndpoints[_dstChainId] = _endpoint;

        emit SetEndpoint(_dstChainId, _endpoint);
    }

    // ------------------------------
    // view function
    // ------------------------------
    function getTokenPause(address _token) external view returns (bool) {
        return IVault(tokenVaults[_token]).depositPause();
    }

    function getTokenVault(address _token) external view returns (address) {
        return tokenVaults[_token];
    }
}