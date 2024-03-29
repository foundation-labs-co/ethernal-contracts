// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IVault.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/IEthernalToken.sol";

contract VaultEthernal is IVault, Ownable, Pausable {
    uint64 public immutable override chainId;
    uint256 public override tokenIndex;
    address public override reserveToken;
    uint256 public override minDeposit;
    address public ethernalToken;
    address public controller;

    modifier onlyController() {
        require(controller == msg.sender, "VaultEthernal: caller is not the controller" );
        _;
    }

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event SetController(address indexed controller);
    event SetMinDeposit(uint256 minDeposit);
    event SetDepositPause(bool depositPause);

    /**
     * @dev Constructor
     * @param _tokenIndex token index for ethernal token
     * @param _reserveToken reserve token address of ethernal token
     * @param _minDeposit minimum deposit amount
     * @param _ethernalToken ethernal token address
     */
    constructor(uint256 _tokenIndex, address _reserveToken, uint256 _minDeposit, address _ethernalToken) {
        require(_reserveToken != address(0), "invalid address");
        require(_ethernalToken != address(0), "invalid address");

        chainId = uint64(block.chainid);
        tokenIndex = _tokenIndex;
        reserveToken = _reserveToken;
        minDeposit = _minDeposit;
        ethernalToken = _ethernalToken;
    }

    /**
     * @dev Call from EthernalBridge.send()
     * @param _from sender address
     * @param _amount amount of EthernalToken
     */
    function deposit(address _from, uint256 _amount) external override onlyController whenNotPaused returns(uint256) {
        uint256 balance = IERC20(ethernalToken).balanceOf(address(this));
        require(balance >= _amount, "insufficient amount");

        // withdraw
        uint256 reserveBalance = IERC20(reserveToken).balanceOf(address(this));
        IEthernalToken(ethernalToken).withdraw(_amount);
        uint256 reserveAmount = IERC20(reserveToken).balanceOf(address(this)) - reserveBalance;
        require(reserveAmount > minDeposit, "amount too small");

        // burn
        IERC20Mintable(reserveToken).burn(address(this), reserveAmount);

        emit Deposit(_from, _amount);
        return reserveAmount;
    }

    /**
     * @dev Call from EthernalBridge.receiving()
     * @param _to receiver address
     * @param _amount amount of ReserveToken
     */
    function withdraw(address _to, uint256 _amount) external override onlyController {
        // mint and approve
        IERC20Mintable(reserveToken).mint(address(this), _amount);
        IERC20(reserveToken).approve(ethernalToken, _amount);

        // deposit
        uint256 balance = IERC20(ethernalToken).balanceOf(address(this));
        IEthernalToken(ethernalToken).deposit(_amount);
        uint256 ethernalAmount = IERC20(ethernalToken).balanceOf(address(this)) - balance;

        // transfer
        IERC20(ethernalToken).transfer(_to, ethernalAmount);

        emit Withdraw(_to, _amount);
    }

    function totalBalance() external override view returns(uint256) {
        return IERC20(reserveToken).balanceOf(address(this));
    }

    function depositPause() external override view returns(bool) {
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
}