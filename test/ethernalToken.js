const { expect } = require("chai");
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("ERC20 Token and Ethernal Token", function () {
    let ERC20Token
    let EthernalToken

    let eth
    let usdt

    let eeth
    let eusdt

    beforeEach(async function () {
        ERC20Token = await ethers.getContractFactory("ERC20Token");
        EthernalToken = await ethers.getContractFactory("EthernalToken");

        eth = await ERC20Token.deploy("ETH (Ethernal)", "ETH");
        await eth.deployed();
        eeth = await EthernalToken.deploy("Ethernal Passive Yield ETH", "EETH", eth.address);
        await eeth.deployed();

        usdt = await ERC20Token.deploy("USDT (Ethernal)", "USDT");
        await usdt.deployed();
        eusdt = await EthernalToken.deploy("Ethernal Passive Yield USDT", "EUSDT", usdt.address);
        await eusdt.deployed();
    });

    it("ERC20Token: Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(usdt.connect(account2).setController(account3.address, true))
        .to.be.revertedWith("Ownable: caller is not the owner");
        
        await expect(usdt.connect(deployer).setController(AddressZero, true))
        .to.be.revertedWith("invalid address");
    });

    it("ERC20Token: Only controller can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await expect(usdt.connect(account2).mint(account3.address, expandDecimals(100, 18)))
        .to.be.revertedWith("ERC20Token: caller is not the controller");
        
        await expect(usdt.connect(account2).burn(account3.address, expandDecimals(100, 18)))
        .to.be.revertedWith("ERC20Token: caller is not the controller");
    });

    it("ERC20Token: Mint & Burn ", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        // set account2 as controller
        await usdt.connect(deployer).setController(account2.address, true);
        // mint 100 usdt to account3
        await usdt.connect(account2).mint(account3.address, expandDecimals(100, 18));

        expect(await usdt.balanceOf(account3.address)).to.be.equal(expandDecimals(100, 18));
        expect(await usdt.totalSupply()).to.be.equal(expandDecimals(100, 18))
        // burn 50 usdt from account3
        await usdt.connect(account2).burn(account3.address, expandDecimals(50, 18));

        expect(await usdt.balanceOf(account3.address)).to.be.equal(expandDecimals(50, 18))
        expect(await usdt.totalSupply()).to.be.equal(expandDecimals(50, 18))
    });

    it("EthernalToken: Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await expect(eeth.connect(account2).setInterest(50000))
        .to.be.revertedWith("Ownable: caller is not the owner");

        const blockPerYear = 365 * 24 * 60 * 60 / 15
        await expect(eeth.connect(account2).setBlockPerYear(blockPerYear))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(eeth.connect(account2).setDepositPause(true))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(eeth.connect(account2).setWithdrawPause(true))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(eeth.connect(account2).setMinAmount(expandDecimals(1, 17)))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(eeth.connect(account2).setMinAmount(expandDecimals(1000000, 18)))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(eeth.connect(account2).setWorker(account3.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("EthernalToken: Only worker can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await expect(eeth.connect(deployer).compound())
        .to.be.revertedWith("onlyWorker: caller is not the worker");
    });

    it("EthernalToken: Set block per year", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await expect(eusdt.connect(deployer).setBlockPerYear(0))
        .to.be.revertedWith("invalid blockPerYear");
        
        await eusdt.connect(deployer).setBlockPerYear(2102400); //  365 * 24 * 60 * 60 / 15
        await eusdt.connect(deployer).setInterest(5000);

        const BlockPerYear = 365 * 24 * 60 * 60 / 15 // 15 seconds per block
        const interestPerBlock = Math.round((5000 * 1e15) / BlockPerYear);

        expect(await eusdt.interestPerBlock()).to.be.equal(interestPerBlock);
    });

    it("EthernalToken: Set interest", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await expect(eusdt.connect(deployer).setInterest(50000))
        .to.be.revertedWith("maximum rate must less than 50%");

        await eusdt.connect(deployer).setInterest(5000);

        const BlockPerYear = 365 * 24 * 60 * 60 / 15; // 15 seconds per block
        const interestPerBlock = Math.round((5000 * 1e15) / BlockPerYear);

        expect(await eusdt.interestPerBlock()).to.be.equal(interestPerBlock);
    });

    it("EthernalToken: Set deposit pause", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await eth.connect(deployer).setController(deployer.address, true);
        await eth.connect(deployer).mint(account2.address, expandDecimals(1000, 18));
        await eth.connect(account2).approve(eeth.address, expandDecimals(1000, 18));

        await eeth.connect(deployer).setDepositPause(true);
        
        await expect(eeth.connect(account2).deposit(expandDecimals(1000, 18)))
        .to.be.revertedWith("deposit is pause");
        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)

        await eeth.connect(deployer).setDepositPause(false);

        await eeth.connect(account2).deposit(expandDecimals(1000, 18));
        expect(await eeth.balanceOf(account2.address)).to.be.equal(expandDecimals(1000, 18));
        expect(await eeth.totalSupply()).to.be.equal(expandDecimals(1000, 18))
    });

    it("EthernalToken: Set withdraw pause", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await eth.connect(deployer).setController(deployer.address, true);
        await eth.connect(deployer).mint(account2.address, expandDecimals(1000, 18));
        await eth.connect(account2).approve(eeth.address, expandDecimals(1000, 18));

        await eeth.connect(account2).deposit(expandDecimals(1000, 18));

        await eeth.connect(deployer).setWithdrawPause(true);

        await expect(eeth.connect(account2).withdraw(expandDecimals(1000, 18)))
        .to.be.revertedWith("withdraw is pause");
        expect(await eeth.balanceOf(account2.address)).to.be.equal(expandDecimals(1000, 18));
        expect(await eeth.totalSupply()).to.be.equal(expandDecimals(1000, 18))

        await eeth.connect(deployer).setWithdrawPause(false);

        await eeth.connect(account2).withdraw(expandDecimals(1000, 18));
        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)
    });

    it("EthernalToken: Set min amount", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await eth.connect(deployer).setController(deployer.address, true);
        await eth.connect(deployer).mint(account2.address, expandDecimals(1000, 18));
        await eth.connect(account2).approve(eeth.address, expandDecimals(1000, 18));

        await eeth.connect(deployer).setMinAmount(expandDecimals(1, 17));

        await expect(eeth.connect(account2).deposit(expandDecimals(1, 16)))
        .to.be.revertedWith("amount must higher than min amount");
        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)

        await eeth.connect(deployer).setMinAmount(expandDecimals(1000000, 18));

        await expect(eeth.connect(account2).deposit(expandDecimals(1000, 18)))
        .to.be.revertedWith("amount must higher than min amount");
        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)

        await eeth.connect(deployer).setMinAmount(expandDecimals(1, 18));

        await eeth.connect(account2).deposit(expandDecimals(1000, 18));
        expect(await eeth.balanceOf(account2.address)).to.be.equal(expandDecimals(1000, 18));
        expect(await eeth.totalSupply()).to.be.equal(expandDecimals(1000, 18))
    });

    it("EthernalToken: Set max amount", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await eth.connect(deployer).setController(deployer.address, true);
        await eth.connect(deployer).mint(account2.address, expandDecimals(1000, 18));
        await eth.connect(account2).approve(eeth.address, expandDecimals(1000, 18));

        await eeth.connect(deployer).setMaxAmount(expandDecimals(1, 17));

        await expect(eeth.connect(account2).deposit(expandDecimals(1, 18)))
        .to.be.revertedWith("amount must lower than max amount");
        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)

        await eeth.connect(deployer).setMaxAmount(expandDecimals(1000000, 18));

        await expect(eeth.connect(account2).deposit(expandDecimals(1000001, 18)))
        .to.be.revertedWith("amount must lower than max amount");
        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)

        await eeth.connect(deployer).setMaxAmount(expandDecimals(1000, 18));

        await eeth.connect(account2).deposit(expandDecimals(1000, 18));
        expect(await eeth.balanceOf(account2.address)).to.be.equal(expandDecimals(1000, 18));
        expect(await eeth.totalSupply()).to.be.equal(expandDecimals(1000, 18))
    });

    it("EthernalToken: Set worker", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(eeth.connect(deployer).setWorker(AddressZero))
        .to.be.revertedWith("address invalid");

        await eeth.connect(deployer).setWorker(account2.address);
        await expect(eeth.connect(account3).compound())
        .to.be.revertedWith("onlyWorker: caller is not the worker");

        await eeth.connect(account2).compound();
    });

    it("EthernalToken: Deposit", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await eth.connect(deployer).setController(deployer.address, true);
        await eth.connect(deployer).mint(account2.address, expandDecimals(1000, 18));
        await eth.connect(account2).approve(eeth.address, expandDecimals(1000, 18));

        await expect(eeth.connect(account2).deposit(expandDecimals(1001, 18)))
        .to.be.revertedWith("ERC20: insufficient allowance");

        await expect(eeth.connect(account2).deposit(0))
        .to.be.revertedWith("amount != 0");

        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)

        // wrap 1000 eth account2
        await eeth.connect(account2).deposit(expandDecimals(1000, 18));

        expect(await eeth.balanceOf(account2.address)).to.be.equal(expandDecimals(1000, 18));
        expect(await eeth.totalSupply()).to.be.equal(expandDecimals(1000, 18))

    });

    it("EthernalToken: Withdraw", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();

        await eth.connect(deployer).setController(deployer.address, true);
        await eth.connect(deployer).mint(account2.address, expandDecimals(1000, 18));
        await eth.connect(account2).approve(eeth.address, expandDecimals(1000, 18));
        await eeth.connect(account2).deposit(expandDecimals(1000, 18));

        await expect(eeth.connect(account2).withdraw(0))
        .to.be.revertedWith("amount != 0");

        await expect(eeth.connect(account2).withdraw(expandDecimals(1001, 18)))
        .to.be.revertedWith("insufficient reserve fund"); 

        await eeth.connect(account2).withdraw(expandDecimals(1000, 18))
        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);
        expect(await eeth.totalSupply()).to.be.equal(0)

    });
    it("EthernalToken: Deposit and Withdraw with interest", async function (){
        const [deployer, account2, account3, worker] = await ethers.getSigners();

        const blockPerYear = 365 * 24 * 60 * 60 / 15; 
        const blockPerDay = 24 * 60 * 60 / 15; 
        const rate = 10000; // 10 %

        await usdt.connect(deployer).setController(deployer.address, true);
        await usdt.connect(deployer).setController(eusdt.address, true);

        await eusdt.connect(deployer).setWorker(worker.address);
        await eusdt.connect(deployer).setBlockPerYear(blockPerYear); 
        await eusdt.connect(deployer).setInterest(rate);

        await usdt.connect(deployer).mint(account2.address, expandDecimals(100000, 18));
        await usdt.connect(account2).approve(eusdt.address, expandDecimals(100000, 18));
        await usdt.connect(deployer).mint(account3.address, expandDecimals(100000, 18));
        await usdt.connect(account3).approve(eusdt.address, expandDecimals(100000, 18));
        
        // wrap 100k usdt account2
        const eusdtBalanceBeforeAccount2 = await eusdt.balanceOf(account2.address)

        await eusdt.connect(account2).deposit(expandDecimals(100000, 18));

        const eusdtBalanceAfterAccount2 = await eusdt.balanceOf(account2.address)
        const balanceAccount2 = eusdtBalanceAfterAccount2.sub(eusdtBalanceBeforeAccount2)

        // auto compound daily for 1 year --> 365 days
        for (let i = 0; i < 365; i++) {
            await eusdt.connect(worker).compound();

            // increase time 1 day
            await helpers.mine(blockPerDay);
        }

        const eusdtBalanceBeforeAccount3 = await eusdt.balanceOf(account3.address)
        
        // wrap 100k usdt account3
        await eusdt.connect(account3).deposit(expandDecimals(100000, 18));

        const eusdtBalanceAfterAccount3 = await eusdt.balanceOf(account3.address)
        const balanceAccount3 = eusdtBalanceAfterAccount3.sub(eusdtBalanceBeforeAccount3)

        
        // auto compound daily for 1 year --> 730 days
        for (let i = 0; i < 365; i++) {
            await eusdt.connect(worker).compound();

            // increase time 1 day
            await helpers.mine(blockPerDay);
        }

        // withdraw all eusdt account2
        await eusdt.connect(account2).withdraw(balanceAccount2);

        // withdraw all eusdt account3
        await eusdt.connect(account3).withdraw(balanceAccount3);

        expect(await eusdt.totalSupply()).to.be.equal(0);
        expect(await eusdt.balanceOf(account2.address)).to.be.equal(0);
    });
})

function bigNumberify(n) {
    return ethers.BigNumber.from(n)
}

function expandDecimals(n, decimals) {
    return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
}