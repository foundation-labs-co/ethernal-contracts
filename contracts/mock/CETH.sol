// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IERC20Mintable.sol";

contract CETH is ERC20, Ownable {
    using SafeERC20 for IERC20;
    
    uint256 private balance;
    uint256 public interestPerBlock;
    uint256 public lastBlock;
    uint256 public blockPerYear = 365 * 24 * 60 * 60 / 3; // 3 seconds per block

    receive() external payable {}

    constructor(string memory _name, string memory _symbol, uint256 _interestPerBlock) ERC20( _name, _symbol) {
        lastBlock = block.number;
        interestPerBlock = _interestPerBlock;
    }
    
    function mint() external payable {
        uint256 _amount = msg.value;

        // update yield
        updateBalance();

        uint256 _balance = toVAmount(_amount);

        // update balance
        balance = balance + _amount;

        // mint this token to msg.sender
        _mint(msg.sender, _balance);
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        // update yield
        updateBalance();

        uint256 _balance = toVAmount(redeemAmount);
        require(redeemAmount <= reserveBalance(), "insufficient reserve fund");

        // burn this token from msg.sender
        _burn(msg.sender, _balance);

        // update balance
        balance = balance - redeemAmount;

        // transfer msg.sender
        payable(msg.sender).transfer(redeemAmount);
        
        return redeemAmount;
    }

    function redeem(uint redeemTokens) external returns (uint) {
        // update yield
        updateBalance();

        uint256 _balance = toReserveAmount(redeemTokens);
        require(_balance <= reserveBalance(), "insufficient reserve fund");

        // burn this token from msg.sender
        _burn(msg.sender, redeemTokens);

        // update balance
        balance = balance - _balance;

        // transfer msg.sender
        payable(msg.sender).transfer(_balance);
        
        return _balance;
    }

    function updateBalance() internal {
        balance = distributionBalance();
        lastBlock = block.number;
    }

    // ------------------------------
    // view
    // ------------------------------
    function distributionBalance() public view returns (uint256) {
        uint256 _interest = (balance * (block.number - lastBlock) * interestPerBlock) / 1e20;
        return balance + _interest;
    }

    function reserveBalance() public view returns (uint256) {
        return (address(this)).balance;
    }

    function ethernalRatio() public view returns (uint256) {
        uint256 _supply = totalSupply();
        if (_supply == 0) {
            return 1e18;
        }
        return (distributionBalance() * 1e18) / _supply;
    }

    function toVAmount(uint256 _amount) public view returns (uint256) {
        return (_amount * 1e18) / ethernalRatio();
    }

    function toReserveAmount(uint256 _amount) public view returns (uint256) {
        return (_amount * ethernalRatio()) / 1e18;
    }

    // ------------------------------
    // onlyOwner
    // ------------------------------
    function setInterest(uint256 _rate) external onlyOwner {
        updateBalance();
        interestPerBlock = (_rate * 1e15) / blockPerYear;
    }

    function adminWithdrawAll() external onlyOwner {
        payable(msg.sender).transfer(reserveBalance());
    }
}