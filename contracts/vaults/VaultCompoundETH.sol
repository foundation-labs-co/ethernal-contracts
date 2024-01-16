// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IVaultETH.sol";
import "../interfaces/ICETH.sol";

contract VaultCompoundETH is IVaultETH, Ownable, Pausable {
    uint64 public immutable override chainId;
    uint256 public override tokenIndex;
    address public override reserveToken;
    uint256 public override minDeposit;
    address public ibToken;
    address public controller;

    modifier onlyController() {
        require(controller == msg.sender, "VaultCompoundETH: caller is not the controller" );
        _;
    }

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event SetController(address indexed controller);
    event SetMinDeposit(uint256 minDeposit);
    event SetDepositPause(bool depositPause);

    receive() external payable {}

    /**
     * @dev Constructor
     * @param _tokenIndex token index for reserve token
     * @param _reserveToken reserve token address
     * @param _minDeposit minimum deposit amount
     * @param _ibToken venus ibToken address
     */
    constructor(uint256 _tokenIndex, address _reserveToken, uint256 _minDeposit, address _ibToken) {
        require(_reserveToken != address(0), "invalid address");
        require(_ibToken != address(0), "invalid address");

        chainId = uint64(block.chainid);
        tokenIndex = _tokenIndex;
        reserveToken = _reserveToken;
        minDeposit = _minDeposit;
        ibToken = _ibToken;
    }

    /**
     * @dev Call from EthernalBridge.send()
     * @param _from sender address
     * - msg.value is amount of ReserveToken
     */
    function deposit(address _from) external payable override onlyController whenNotPaused returns(uint256) {
        require(msg.value > minDeposit, "amount too small");

        // mint
        ICETH(ibToken).mint{ value: msg.value }();

        emit Deposit(_from, msg.value);
        return msg.value;
    }

    /**
     * @dev Call from EthernalBridge.receiving()
     * @param _to receiver address
     * @param _amount amount of ReserveToken
     */
    function withdraw(address _to, uint256 _amount) external override onlyController {
        uint256 balance = address(this).balance;

        // burn
        ICETH(ibToken).redeemUnderlying(_amount);
        
        uint256 reserveAmount = address(this).balance - balance;
        payable(_to).transfer(reserveAmount);

        emit Withdraw(_to, _amount);
    }

    function totalBalance() external override view returns(uint256) {
        uint256 balance = IERC20(ibToken).balanceOf(address(this));
        return (balance * 1e38) / ICETH(ibToken).exchangeRateStored();
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