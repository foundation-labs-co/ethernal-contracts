// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20, Ownable {
    mapping (address => bool) public controllers;

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
    }

    modifier onlyController() {
        require(controllers[msg.sender], "ERC20Token: caller is not the controller");
        _;
    }
    
    function mint(address _account, uint256 _amount) external onlyController() {
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _amount) external onlyController() {
        _burn(_account, _amount);
    }

    function setController(address _controller, bool _flag) external onlyOwner() {
        require(_controller != address(0), "invalid address");
        controllers[_controller] = _flag;
    }
}