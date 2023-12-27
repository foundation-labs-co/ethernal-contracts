// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC20Mintable.sol";

contract EthernalToken is ERC20, Ownable {
    using SafeERC20 for IERC20;

    address public immutable reserveToken; 

    uint256 private balance;
    uint256 public interestPerBlock;
    uint256 public lastBlock;
    uint256 public blockPerYear = 365 * 24 * 60 * 60 / 15; // 15 seconds per block

    bool public depositPause;
    bool public withdrawPause;
    uint256 public minAmount; // 0 reserveToken
    uint256 public maxAmount = 1000000 * 1e18; // 1,000,000 reserveToken
    address public worker;
    mapping (address => uint256) private userBlock;

    modifier onlyWorker() {
        require(msg.sender == worker, "onlyWorker: caller is not the worker");
        _;
    }

    event Deposit(address indexed _address, uint256 _balance);
    event Withdraw(address indexed _address, uint256 _balance);
    event SetBlockPerYear(uint256 _blockPerYear);
    event SetInterest(uint256 _rate, uint256 _interestPerBlock);
    event SetDepositPause(bool _depositPause);
    event SetWithdrawPause(bool _withdrawPause);
    event SetMinAmount(uint256 _amount);
    event SetMaxAmount(uint256 _amount);
    event SetWorker(address _worker);

    constructor(string memory _name, string memory _symbol, address _reserveToken) ERC20( _name, _symbol) {
        require(_reserveToken != address(0), "invalid address");

        reserveToken = _reserveToken;
        lastBlock = block.number;
    }
    
    function deposit(uint256 _amount) external returns(uint256) {
        require(!depositPause, "deposit is pause");
        require(_amount > 0, "amount != 0");
        require(_amount >= minAmount, "amount must higher than min amount");
        require(_amount <= maxAmount, "amount must lower than max amount");
        require(block.number > userBlock[tx.origin], "wait at least 1 block");
        userBlock[tx.origin] = block.number;

        // update yield
        updateBalance();

        uint256 _balance = reserveToEthernalAmount(_amount);

        // transfer reserveToken to this contract
        IERC20(reserveToken).safeTransferFrom(msg.sender, address(this), _amount);

        // update balance
        balance = balance + _amount;

        // mint this token to msg.sender
        _mint(msg.sender, _balance);

        emit Deposit(msg.sender, _balance);
        return _balance;
    }

    function withdraw(uint256 _amount) external returns(uint256) {
        require(!withdrawPause, "withdraw is pause");
        require(_amount > 0, "amount != 0");
        require(block.number > userBlock[tx.origin], "wait at least 1 block");
        userBlock[tx.origin] = block.number;

        // update yield
        updateBalance();

        uint256 _balance = ethernalToReserveAmount(_amount);
        require(_balance <= reserveBalance(), "insufficient reserve fund");
        require(_balance >= minAmount, "amount must higher than min amount");
        require(_balance <= maxAmount, "amount must lower than max amount");

        // burn this token from msg.sender
        _burn(msg.sender, _amount);

        // update balance
        balance = balance - _balance;

        // transfer reserveToken to msg.sender
        transferTo(reserveToken, msg.sender, _balance);
        
        emit Withdraw(msg.sender, _amount);
        return _balance;
    }

    function updateBalance() internal {
        balance = distributionBalance();
        lastBlock = block.number;

        // mint reserveToken for distribution
        if (balance > reserveBalance()) {
            uint256 _amount = balance - reserveBalance();
            IERC20Mintable(reserveToken).mint(address(this), _amount);
        }
    }

    // ------------------------------
    // view
    // ------------------------------
    function distributionBalance() public view returns(uint256) {
        uint256 _interest = (balance * (block.number - lastBlock) * interestPerBlock) / 1e20;
        return balance + _interest;
    }

    function reserveBalance() public view returns(uint256) {
        return IERC20(reserveToken).balanceOf(address(this));
    }

    function ethernalRatio() public view returns(uint256) {
        uint256 _supply = totalSupply();
        if (_supply == 0) {
            return 1e18;
        }
        return (distributionBalance() * 1e18) / _supply;
    }

    function reserveToEthernalAmount(uint256 _amount) public view returns(uint256) {
        return (_amount * 1e18) / ethernalRatio();
    }

    function ethernalToReserveAmount(uint256 _amount) public view returns(uint256) {
        return (_amount * ethernalRatio()) / 1e18;
    }

    function transferTo(address _reserveToken, address _receiver, uint256 _amount) private {
        require(_receiver != address(0), "invalid address");
        require(_amount > 0, "cannot transfer zero amount");
        IERC20(_reserveToken).safeTransfer(_receiver, _amount);
    }

    // ------------------------------
    // onlyWorker
    // ------------------------------
    function compound() external onlyWorker {
        updateBalance();
    }

    // ------------------------------
    // onlyOwner
    // ------------------------------
    function setBlockPerYear(uint256 _blockPerYear) external onlyOwner {
        require(_blockPerYear > 0, "invalid blockPerYear");

        // get current rate
        uint256 rate = (interestPerBlock * blockPerYear) / 1e15;
        
        // update blockPerYear
        blockPerYear = _blockPerYear;
        emit SetBlockPerYear(_blockPerYear);

        _setInterest(rate);
    }

    function setInterest(uint256 _rate) external onlyOwner {
        _setInterest(_rate);
    }

    function _setInterest(uint256 _rate) internal {
        require(_rate < 50000, "maximum rate must less than 50%");
        updateBalance();
        interestPerBlock = (_rate * 1e15) / blockPerYear;
        emit SetInterest(_rate, interestPerBlock);
    }

    function setDepositPause(bool _depositPause) external onlyOwner {
        depositPause = _depositPause;
        emit SetDepositPause(_depositPause);
    }

    function setWithdrawPause(bool _withdrawPause) external onlyOwner {
        withdrawPause = _withdrawPause;
        emit SetWithdrawPause(_withdrawPause);
    }

    function setMinAmount(uint256 _amount) external onlyOwner {
        minAmount = _amount;
        emit SetMinAmount(_amount);
    }

    function setMaxAmount(uint256 _amount) external onlyOwner {
        maxAmount = _amount;
        emit SetMaxAmount(_amount);
    }

    function setWorker(address _worker) external onlyOwner {
        require(_worker != address(0), "address invalid");
        worker = _worker;
        emit SetWorker(_worker);
    }
}