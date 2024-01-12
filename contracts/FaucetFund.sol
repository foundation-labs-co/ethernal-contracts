// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FaucetFund is Ownable {
    uint256 public faucet;
    mapping(address => bool) public pools;

    event TransferFaucet(address receiver, uint256 amount);
    event SetFaucet(uint256 amount);
    event AddPool(address pool);
    event RemovePool(address pool);
    event RescueFund(address owner, uint256 amount);

    receive() external payable {}

    modifier onlyPools() {
        require(pools[msg.sender], "FaucetFund: caller is not the pool");
        _;
    }

    function transferTo(address _receiver) external onlyPools {
        // check faucet balance and receiver is not contract
        if (balance() < faucet || Address.isContract(_receiver)) {
            return;
        }

        // transfer
        payable(_receiver).transfer(faucet);

        emit TransferFaucet(_receiver, faucet);
    }

    // ------------------------------
    // onlyOwner
    // ------------------------------
    function setFaucet(uint256 _amount) external onlyOwner {
        faucet = _amount;
        emit SetFaucet(_amount);
    }

    function addPool(address _address) external onlyOwner {
        require(!pools[_address], "pool exist");
        pools[_address] = true;
        emit AddPool(_address);
    }

    function removePool(address _address) external onlyOwner {
        require(pools[_address], "pool not exist");
        // delete from the mapping
        delete pools[_address];
        emit RemovePool(_address);
    }

    function rescueFund() external onlyOwner {
        uint256 amount = address(this).balance;
        payable(msg.sender).transfer(amount);
        emit RescueFund(msg.sender, amount);
    }

    // ------------------------------
    // view function
    // ------------------------------
    function balance() public view returns (uint256) {
        return address(this).balance;
    }
}