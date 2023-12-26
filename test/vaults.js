const { expect } = require("chai");
const { ethers } = require("hardhat");
const { config, tokenIndexes, networkId } = require('../config')

describe("Vaults", function () {
    let VaultMintable

    let VaultEthernal

    let vaultMintableUSDT

    let vaultEthernalEUSDT

    const fee = expandDecimals(1,15); // 0.001 ETH

    beforeEach(async function () {

        // Token Contract
        ERC20Token = await ethers.getContractFactory("ERC20Token");
        EthernalToken = await ethers.getContractFactory("EthernalToken");
        VenusToken = await ethers.getContractFactory("VenusToken");

        // Vault Contract
        VaultMintable = await ethers.getContractFactory("VaultMintable");
        VaultEthernal = await ethers.getContractFactory("VaultEthernal");
        VaultVenus = await ethers.getContractFactory("VaultVenus");

        // Deploy Token

        // USDT - EUSDT
        usdt = await ERC20Token.deploy("USDT (Ethernal)", "USDT");
        await usdt.deployed();
        eusdt = await EthernalToken.deploy("Ethernal Passive Yield USDT", "EUSDT", usdt.address);
        await eusdt.deployed();
        
        // ETH - EETH
        eth = await ERC20Token.deploy("ETH (Ethernal)", "ETH");
        await eth.deployed();
        eeth = await EthernalToken.deploy("Ethernal Passive Yield ETH", "EETH", eth.address);
        await eeth.deployed();

        // Venus
        ibToken = await VenusToken.deploy(usdt.address);
        await ibToken.deployed();

        // Deploy Vault USDT - EUSDT
        vaultMintableUSDT = await VaultMintable.deploy(tokenIndexes.USDT, usdt.address, expandDecimals(1, 18));
        await vaultMintableUSDT.deployed();

        vaultEthernalEUSDT = await VaultEthernal.deploy(tokenIndexes.EUSDT, usdt.address, expandDecimals(1, 18), tokenIndexes.USDT, eusdt.address);
        await vaultEthernalEUSDT.deployed();

        // Deploy Vault ETH - EETH
        vaultMintableETH = await VaultMintable.deploy(tokenIndexes.ETH, eth.address, expandDecimals(1000, 18));
        await vaultMintableETH.deployed();

        vaultEthernalEETH = await VaultEthernal.deploy(tokenIndexes.EETH, eth.address, expandDecimals(1000, 18), tokenIndexes.ETH, eeth.address);
        await vaultEthernalEETH.deployed();

        // Deploy Vault Venus
        vaultVenus = await VaultVenus.deploy(tokenIndexes.USDT, usdt.address, expandDecimals(1000, 18), ibToken.address);
        await vaultVenus.deployed();
    });

    it("VaultMintable: Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(vaultMintableUSDT.connect(account2).setController(account2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(vaultMintableUSDT.connect(deployer).setController(AddressZero))
        .to.be.revertedWith("invalid address");

        await expect(vaultMintableUSDT.connect(account2).setMinDeposit(expandDecimals(1, 18)))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(vaultMintableUSDT.connect(account2).setDepositPause(true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("VaultMintable: Deposit", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants
        const amount = expandDecimals(100, 18);

        await vaultMintableUSDT.connect(deployer).setDepositPause(true)

        await expect(vaultMintableUSDT.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("onlyController: caller is not the controller");

        await vaultMintableUSDT.connect(deployer).setController(deployer.address)

        await expect(vaultMintableUSDT.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("Pausable: paused");

        await vaultMintableUSDT.connect(deployer).setDepositPause(false)

        await expect(vaultMintableUSDT.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("amount too small");

        await vaultMintableUSDT.connect(deployer).setMinDeposit(expandDecimals(1, 18))

        await expect(vaultMintableUSDT.connect(deployer).deposit(account2.address, amount))
        .to.be.revertedWith("insufficient amount");

        await usdt.connect(deployer).setController(deployer.address, true);
        await usdt.connect(deployer).setController(vaultMintableUSDT.address, true);
        await usdt.connect(deployer).mint(vaultMintableUSDT.address, amount);
        expect(await usdt.balanceOf(vaultMintableUSDT.address)).to.be.equal(amount);

        await vaultMintableUSDT.connect(deployer).deposit(account2.address, amount)

        expect(await usdt.balanceOf(vaultMintableUSDT.address)).to.be.equal(0);
    });

    it("VaultMintable: Withdraw", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants
        const amount = expandDecimals(100, 18);

        await expect(vaultMintableUSDT.connect(deployer).withdraw(account2.address, amount))
        .to.be.revertedWith("onlyController: caller is not the controller");

        await vaultMintableUSDT.connect(deployer).setController(deployer.address)
        await usdt.connect(deployer).setController(vaultMintableUSDT.address, true);

        expect(await usdt.balanceOf(account2.address)).to.be.equal(0);

        await vaultMintableUSDT.connect(deployer).withdraw(account2.address, amount)

        expect(await usdt.balanceOf(account2.address)).to.be.equal(amount);
    });

    it("VaultEthernal: Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(vaultMintableUSDT.connect(account2).setController(account2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(vaultMintableUSDT.connect(deployer).setController(AddressZero))
        .to.be.revertedWith("invalid address");

        await expect(vaultMintableUSDT.connect(account2).setMinDeposit(expandDecimals(1, 18)))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(vaultMintableUSDT.connect(account2).setDepositPause(true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("VaultEthernal: Deposit", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants
        const amount = expandDecimals(100, 18);
    
        await vaultEthernalEETH.connect(deployer).setDepositPause(true)

        await expect(vaultEthernalEETH.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("onlyController: caller is not the controller");

        await vaultEthernalEETH.connect(deployer).setController(deployer.address)

        await expect(vaultEthernalEETH.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("Pausable: paused");

        await vaultEthernalEETH.connect(deployer).setDepositPause(false)

        await eth.connect(deployer).setController(deployer.address, true);
        await eth.connect(deployer).setController(vaultEthernalEETH.address, true);
        await eth.connect(deployer).mint(deployer.address, amount);
        await eth.connect(deployer).approve(eeth.address, amount);
        await eeth.connect(deployer).deposit(amount);
        await eeth.connect(deployer).transfer(vaultEthernalEETH.address, amount);

        await expect(vaultEthernalEETH.connect(deployer).deposit(account2.address, expandDecimals(1000, 18)))
        .to.be.revertedWith("insufficient amount");

        await expect(vaultEthernalEETH.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("amount too small");

        await vaultEthernalEETH.connect(deployer).setMinDeposit(expandDecimals(1, 18))

        await vaultEthernalEETH.connect(deployer).deposit(account2.address, amount)

        expect(await eth.balanceOf(vaultEthernalEETH.address)).to.be.equal(0);
    });

    it("VaultEthernal: Withdraw", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants
        const amount = expandDecimals(100, 18);

        await expect(vaultEthernalEETH.connect(deployer).withdraw(account2.address, amount))
        .to.be.revertedWith("onlyController: caller is not the controller");

        await vaultEthernalEETH.connect(deployer).setController(deployer.address)
        await eth.connect(deployer).setController(vaultEthernalEETH.address, true);

        expect(await eeth.balanceOf(account2.address)).to.be.equal(0);

        await vaultEthernalEETH.connect(deployer).withdraw(account2.address, amount)

        expect(await eeth.balanceOf(account2.address)).to.be.equal(amount);
    });

    it("VaultVenus: Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(vaultVenus.connect(account2).setController(account2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(vaultVenus.connect(deployer).setController(AddressZero))
        .to.be.revertedWith("invalid address");

        await expect(vaultVenus.connect(account2).setMinDeposit(expandDecimals(1, 18)))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(vaultVenus.connect(account2).setDepositPause(true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("VaultVenus: Deposit & Withdraw", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants
        const amount = expandDecimals(100, 18);

        // deposit
        await vaultVenus.connect(deployer).setDepositPause(true)

        await expect(vaultVenus.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("onlyController: caller is not the controller");

        await vaultVenus.connect(deployer).setController(deployer.address)

        await expect(vaultVenus.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("Pausable: paused");

        await vaultVenus.connect(deployer).setDepositPause(false)

        await expect(vaultVenus.connect(deployer).deposit(account2.address, expandDecimals(1, 18)))
        .to.be.revertedWith("amount too small");

        await vaultVenus.connect(deployer).setMinDeposit(expandDecimals(1, 18))

        await expect(vaultVenus.connect(deployer).deposit(account2.address, amount))
        .to.be.revertedWith("insufficient amount");

        await usdt.connect(deployer).setController(deployer.address, true);
        await usdt.connect(deployer).setController(vaultVenus.address, true);
        await usdt.connect(deployer).mint(vaultVenus.address, amount);
        expect(await usdt.balanceOf(vaultVenus.address)).to.be.equal(amount);

        await vaultVenus.connect(deployer).deposit(account2.address, amount)

        expect(await usdt.balanceOf(vaultVenus.address)).to.be.equal(0);

        // withdraw
        await vaultVenus.connect(deployer).setController(account2.address)

        await expect(vaultVenus.connect(deployer).withdraw(account2.address, amount))
        .to.be.revertedWith("onlyController: caller is not the controller");

        await vaultVenus.connect(deployer).setController(deployer.address)

        expect(await usdt.balanceOf(account2.address)).to.be.equal(0);

        await vaultVenus.connect(deployer).withdraw(account2.address, amount)

        expect(await usdt.balanceOf(account2.address)).to.be.equal(amount);
    });
})

function bigNumberify(n) {
    return ethers.BigNumber.from(n)
}

function expandDecimals(n, decimals) {
    return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
}