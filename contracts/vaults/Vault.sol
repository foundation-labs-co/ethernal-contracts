// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IVault.sol";
import "../interfaces/IERC20Mintable.sol";

contract VaultMintable is IVault, Ownable, Pausable {
    uint64 public override chainId;
    uint256 public override tokenIndex;
    address public override reserveToken;
    uint256 public override minDeposit;
    address public controller;
    mapping (uint256 => bool) public supportTokenIndexes;

    modifier onlyController() {
        require(controller == msg.sender, "onlyController: caller is not the controller" );
        _;
    }

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event SetController(address indexed controller);
    event SetMinDeposit(uint256 minDeposit);
    event SetDepositPause(bool depositPause);
    event SetSupportTokenIndex(uint256 indexed tokenIndex, bool flag);

    /**
     * @dev Constructor
     * @param _tokenIndex token index for reserve token
     * @param _reserveToken reserve token address
     * @param _minDeposit minimum deposit amount
     */
    constructor(uint256 _tokenIndex, address _reserveToken, uint256 _minDeposit) {
        require(_reserveToken != address(0), "invalid address");

        chainId = uint64(block.chainid);
        tokenIndex = _tokenIndex;
        reserveToken = _reserveToken;
        minDeposit = _minDeposit;

        // default support tokenIndex
        supportTokenIndexes[_tokenIndex] = true;
    }

    /**
     * @dev Call from EthernalBridge.send()
     * @param _from sender address
     * @param _amount amount of ReserveToken
     */
    function deposit(address _from, uint256 _amount) external override onlyController whenNotPaused {
        uint256 balance = IERC20(reserveToken).balanceOf(address(this));
        require(_amount > minDeposit, "amount too small");
        require(balance >= _amount, "insufficient amount");

        // burn
        IERC20Mintable(reserveToken).burn(address(this), _amount);

        emit Deposit(_from, _amount);
    }

    /**
     * @dev Call from EthernalBridge.receiving()
     * @param _to receiver address
     * @param _amount amount of ReserveToken
     */
    function withdraw(address _to, uint256 _amount) external override onlyController {
        // mint
        IERC20Mintable(reserveToken).mint(_to, _amount);

        emit Withdraw(_to, _amount);
    }

    function totalBalance() external override view returns (uint256) {
        return IERC20(reserveToken).balanceOf(address(this));
    }

    function supportTokenIndex(uint256 _tokenIndex) external override view returns (bool) {
        return supportTokenIndexes[_tokenIndex];
    }

    function depositPause() external override view returns (bool) {
        return super.paused();
    }

    // ------------------------------
    // onlyOwner
    // ------------------------------
    function setController(address _controller) public onlyOwner() {
        require(_controller != address(0), "invalid address");
        controller = _controller;

        emit SetController(_controller);
    }

    function setMinDeposit(uint256 _minDeposit) public onlyOwner() {
        minDeposit = _minDeposit;

        emit SetMinDeposit(_minDeposit);
    }

    function setDepositPause(bool _flag) external onlyOwner() {
        if (_flag) {
            _pause();
        } else {
            _unpause();
        }
        
        emit SetDepositPause(_flag);
    }

    function setSupportTokenIndex(uint256 _tokenIndex, bool _flag) external onlyOwner() {
        supportTokenIndexes[_tokenIndex] = _flag;

        emit SetSupportTokenIndex(_tokenIndex, _flag);
    }
}