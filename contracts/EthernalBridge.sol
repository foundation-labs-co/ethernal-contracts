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

    struct UserBridge {
        uint256 uid;
        uint256 srcTokenIndex; 
        uint256 dstTokenIndex;
        uint256 amount;
        uint64 srcChainId;
        uint64 dstChainId;
        address from;
        address receiver;
        uint256 bridgeType; // 0 = outgoing, 1 = incoming
        bool outgoingRefund; // flag for outgoing refund
    }

    uint64 public immutable chainId;
    address public constant ETH_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public xOracleMessage;
    uint256 public uid; // uid counter for outgoing, start with 1
    
    mapping (address => address) public tokenVaults; // token => vault
    mapping (uint256 => address) public tokenIndexVaults; // tokenIndex => vault
    mapping (uint64 => address) public ethernalBridgeEndpoints; // dstChainId => endpoint
    mapping (uint64 => mapping(uint256 => bool)) public supportDstTokenIndexes; // dstChainId => tokenIndex => support
    
    mapping (uint256 => UserBridge) public outgoingBridges; // uid => UserBridge
    mapping (uint256 => mapping (uint256 => UserBridge)) public incomingBridges; // srcChainId => uid => UserBridge

    // events
    event Send(
        uint256 indexed uid,
        uint256 indexed srcTokenIndex, 
        uint256 dstTokenIndex, 
        uint256 amount, 
        uint64 srcChainId, 
        uint64 dstChainId, 
        address indexed from, 
        address receiver
    );
    event Receive(
        uint256 indexed uid,
        uint256 indexed srcTokenIndex, 
        uint256 dstTokenIndex, 
        uint256 amount, 
        uint64 srcChainId, 
        uint64 dstChainId, 
        address indexed from, 
        address receiver
    );
    event AdminRefund(
        uint256 indexed uid,
        uint256 indexed srcTokenIndex, 
        uint256 dstTokenIndex, 
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
    event SetSupportDstTokenIndex(uint64 indexed dstChainId, uint256 indexed tokenIndex, bool support);

    constructor(address _xOracleMessage) {
        require(_xOracleMessage != address(0), "invalid address");

        chainId = uint64(block.chainid);
        xOracleMessage = _xOracleMessage;
    }

    /**
     * @dev Send token to another chain
     * @param _token token address
     * @param _amount amount of token
     * @param _dstChainId destination chainId
     * @param _dstTokenIndex destination tokenIndex
     * @param _receiver receiver address
     */
    function send(address _token, uint256 _amount, uint64 _dstChainId, uint256 _dstTokenIndex, address _receiver) external payable nonReentrant {
        require(_token != address(0), "invalid token address");
        require(_dstChainId != chainId, "invalid chainId");
        require(_receiver != address(0), "invalid receiver address");

        // check fee
        uint256 fee = getBridgeFee(_dstChainId);
        require(msg.value >= fee, "insufficient fee");

        // endpoint
        address endpoint = ethernalBridgeEndpoints[_dstChainId];
        require(endpoint != address(0), "invalid endpoint address");

        // lookup vault
        IVault vault = IVault(tokenVaults[_token]);
        require(address(vault) != address(0), "token not allowed");
        require(getSupportDstTokenIndex(_dstChainId, _dstTokenIndex), "dstTokenIndex not allowed");

        // deposit to vault
        uint256 srcTokenIndex = vault.tokenIndex();
        IERC20(_token).safeTransferFrom(msg.sender, address(vault), _amount);
        vault.deposit(msg.sender, _amount);

        // save user bridge outgoing
        uid++;
        outgoingBridges[uid] = UserBridge({
            uid: uid,
            srcTokenIndex: srcTokenIndex,
            dstTokenIndex: _dstTokenIndex,
            amount: _amount,
            srcChainId: chainId,
            dstChainId: _dstChainId,
            from: msg.sender,
            receiver: _receiver,
            bridgeType: 0, // outgoing
            outgoingRefund: false
        });

        // send message
        bytes memory payload = abi.encode(srcTokenIndex, _dstTokenIndex, _amount, chainId, _dstChainId, msg.sender, _receiver);
        IXOracleMessage(xOracleMessage).sendMessage{ value: msg.value }(payload, endpoint, _dstChainId);

        emit Send(uid, srcTokenIndex, _dstTokenIndex, _amount, chainId, _dstChainId, msg.sender, _receiver);
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

        // transfer amount
        uint256 amount = msg.value;

        // check fee
        uint256 fee = getBridgeFee(_dstChainId);
        if (fee > 0) {
            require(amount > fee, "insufficient fee");
            amount = amount - fee;
        }

        // endpoint
        address endpoint = ethernalBridgeEndpoints[_dstChainId];
        require(endpoint != address(0), "invalid endpoint address");

        // lookup vault
        IVaultETH vault = IVaultETH(tokenVaults[ETH_TOKEN]);
        require(address(vault) != address(0), "token not allowed");
        require(getSupportDstTokenIndex(_dstChainId, _dstTokenIndex), "dstTokenIndex not allowed");

        // deposit ETH to vault
        uint256 srcTokenIndex = vault.tokenIndex();
        vault.deposit{ value: amount }(msg.sender);

        // save user bridge outgoing
        uid++;
        outgoingBridges[uid] = UserBridge({
            uid: uid,
            srcTokenIndex: srcTokenIndex,
            dstTokenIndex: _dstTokenIndex,
            amount: amount,
            srcChainId: chainId,
            dstChainId: _dstChainId,
            from: msg.sender,
            receiver: _receiver,
            bridgeType: 0, // outgoing
            outgoingRefund: false
        });

        // send message
        bytes memory payload = abi.encode(uid, srcTokenIndex, _dstTokenIndex, amount, chainId, _dstChainId, msg.sender, _receiver);
        IXOracleMessage(xOracleMessage).sendMessage{ value: fee }(payload, endpoint, _dstChainId);

        emit Send(uid, srcTokenIndex, _dstTokenIndex, amount, chainId, _dstChainId, msg.sender, _receiver);
    }

    /**
     * @dev Callback from xOracleMessage (sent from another chain)
     * @param _uid uid
     * @param _srcTokenIndex source tokenIndex
     * @param _dstTokenIndex destination tokenIndex
     * @param _amount amount of token
     * @param _srcChainId source chainId
     * @param _dstChainId destination chainId
     * @param _from sender address
     * @param _receiver receiver address
     */
    function receiving(
        uint256 _uid,
        uint256 _srcTokenIndex, 
        uint256 _dstTokenIndex, 
        uint256 _amount, 
        uint64 _srcChainId, 
        uint64 _dstChainId, 
        address _from, 
        address _receiver
    ) external nonReentrant {
        // check security callback
        require(msg.sender == xOracleMessage, "only xOracleMessage callback");

        require(incomingBridges[_srcChainId][_uid].uid == 0, "already received");
        require(_uid > 0, "invalid uid");
        require(_amount > 0, "invalid amount");
        require(_dstChainId == chainId, "invalid chainId");
        require(_receiver != address(0), "invalid receiver address");

        // lookup vault
        address vault = tokenIndexVaults[_dstTokenIndex];
        require(vault != address(0), "tokenIndex not allowed");

        // withdraw to receiver
        IVault(vault).withdraw(_receiver, _amount);

        // save user bridge incoming
        incomingBridges[_srcChainId][_uid] = UserBridge({
            uid: _uid,
            srcTokenIndex: _srcTokenIndex,
            dstTokenIndex: _dstTokenIndex,
            amount: _amount,
            srcChainId: _srcChainId,
            dstChainId: _dstChainId,
            from: _from,
            receiver: _receiver,
            bridgeType: 1, // incoming
            outgoingRefund: false
        });

        emit Receive(_uid, _srcTokenIndex, _dstTokenIndex, _amount, _srcChainId, _dstChainId, _from, _receiver);
    }

    // ------------------------------
    // onlyOwner
    // ------------------------------
    /**
     * @dev Admin refund outgoing bridge
     * @param _uid uid
     */
    function adminRefund(uint64 _uid) external onlyOwner {
        UserBridge memory userBridge = outgoingBridges[_uid];
        require(userBridge.uid == _uid, "uid not found");
        require(userBridge.outgoingRefund == false, "already refunded");

        // lookup vault
        address vault = tokenIndexVaults[userBridge.srcTokenIndex];
        require(vault != address(0), "tokenIndex not allowed");

        // withdraw to user
        IVault(vault).withdraw(userBridge.from, userBridge.amount);

        // set outgoing refunded
        outgoingBridges[_uid].outgoingRefund = true;

        emit AdminRefund(_uid, userBridge.srcTokenIndex, userBridge.dstTokenIndex, userBridge.amount, userBridge.srcChainId, userBridge.dstChainId, userBridge.from, userBridge.receiver);
    }

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

    function setXOracleMessage(address _xOracleMessage) external onlyOwner() {
        require(_xOracleMessage != address(0), "invalid address");
        xOracleMessage = _xOracleMessage;
        
        emit SetXOracleMessage(_xOracleMessage);
    }

    function setEndpoint(uint64 _dstChainId, address _endpoint) external onlyOwner() {
        require(_endpoint != address(0), "invalid address");
        ethernalBridgeEndpoints[_dstChainId] = _endpoint;

        emit SetEndpoint(_dstChainId, _endpoint);
    }

    function setSupportDstTokenIndex(uint64 _dstChainId, uint256 _tokenIndex, bool _support) external onlyOwner() {
        supportDstTokenIndexes[_dstChainId][_tokenIndex] = _support;

        emit SetSupportDstTokenIndex(_dstChainId, _tokenIndex, _support);
    }

    // ------------------------------
    // view function
    // ------------------------------
    function getTokenPause(address _token) external view returns(bool) {
        return IVault(tokenVaults[_token]).depositPause();
    }

    function getTokenVault(address _token) external view returns(address) {
        return tokenVaults[_token];
    }

    function getTokenIndexVault(uint256 _tokenIndex) external view returns(address) {
        return tokenIndexVaults[_tokenIndex];
    }

    function getSupportDstTokenIndex(uint64 _dstChainId, uint256 _tokenIndex) public view returns(bool) {
        return supportDstTokenIndexes[_dstChainId][_tokenIndex];
    }

    function getBridgeFee(uint64 _dstChainId) public view returns(uint256) {
        return IXOracleMessage(xOracleMessage).getFee(_dstChainId);
    }

    function getOutgoingBridge(uint256 _uid) external view returns(
        uint256, // uid
        uint256, // srcTokenIndex
        uint256, // dstTokenIndex
        uint256, // amount
        uint64, // srcChainId
        uint64, // dstChainId
        address, // from
        address // receiver
    ) {
        UserBridge memory userBridge = outgoingBridges[_uid];
        return (
            userBridge.uid,
            userBridge.srcTokenIndex,
            userBridge.dstTokenIndex,
            userBridge.amount,
            userBridge.srcChainId,
            userBridge.dstChainId,
            userBridge.from,
            userBridge.receiver
        );
    }

    function getIncomingBridge(uint256 _srcChainId, uint256 _uid) external view returns(
        uint256, // uid
        uint256, // srcTokenIndex
        uint256, // dstTokenIndex
        uint256, // amount
        uint64, // srcChainId
        uint64, // dstChainId
        address, // from
        address // receiver
    ) {
        UserBridge memory userBridge = incomingBridges[_srcChainId][_uid];
        return (
            userBridge.uid,
            userBridge.srcTokenIndex,
            userBridge.dstTokenIndex,
            userBridge.amount,
            userBridge.srcChainId,
            userBridge.dstChainId,
            userBridge.from,
            userBridge.receiver
        );
    }
}