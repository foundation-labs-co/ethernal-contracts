const { expect } = require("chai");
const { ethers } = require("hardhat");
const { config, tokenIndexes, networkId } = require('../config')
const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../scripts/lib/deploy')


describe("Ethernal Bridge", function () {
    let EthernalBridgeContract

    let ethernalBridge

    let VaultMintable

    let VaultEthernal

    let vaultMintableUSDT

    let vaultEthernalEUSDT

    const fee = expandDecimals(1,15); // 0.001 ETH

    beforeEach(async function () {

        // Bridge Contract
        EthernalBridgeContract = await ethers.getContractFactory("EthernalBridge");
        
        // XOracle Message Contract
        MockXOracleMessage = await ethers.getContractFactory("XOracleMessage");

        // Token Contract
        ERC20Token = await ethers.getContractFactory("ERC20Token");
        EthernalToken = await ethers.getContractFactory("EthernalToken");

        // Vault Contract
        VaultMintable = await ethers.getContractFactory("VaultMintable");
        VaultEthernal = await ethers.getContractFactory("VaultEthernal");
        VaultETH = await ethers.getContractFactory("VaultETH");
        
        // Deploy Mock XOracleMessage
        xOracleMessage = await MockXOracleMessage.deploy();
        await xOracleMessage.deployed();

        await xOracleMessage.setFee(fee);

        // Deploy EthernalBridge
        ethernalBridge = await EthernalBridgeContract.deploy(xOracleMessage.address);
        await ethernalBridge.deployed();

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

        // Deploy Vault USDT - EUSDT
        vaultMintableUSDT = await VaultMintable.deploy(tokenIndexes.USDT, usdt.address, expandDecimals(1, 18));
        await vaultMintableUSDT.deployed();

        vaultEthernalEUSDT = await VaultEthernal.deploy(tokenIndexes.EUSDT, usdt.address, expandDecimals(1, 18), tokenIndexes.USDT, eusdt.address);
        await vaultEthernalEUSDT.deployed();

        // Deploy Vault ETH 
        vaultETH = await VaultETH.deploy(tokenIndexes.ETH, eth.address, expandDecimals(1, 18), "0x0000000000000000000000000000000000000000");
        await vaultETH.deployed();

    });

    it("Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(ethernalBridge.connect(account2).addAllowToken(usdt.address, vaultMintableUSDT.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(ethernalBridge.connect(account2).removeAllowToken(usdt.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
        
        await expect(ethernalBridge.connect(account2).setXOracleMessage(AddressZero))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(ethernalBridge.connect(account2).setEndpoint(56, AddressZero))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Add allow token", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(ethernalBridge.connect(deployer).addAllowToken(AddressZero, vaultMintableUSDT.address))
        .to.be.revertedWith("invalid address");

        await ethernalBridge.connect(deployer).addAllowToken(usdt.address, vaultMintableUSDT.address);

        await expect(ethernalBridge.connect(deployer).addAllowToken(usdt.address, vaultMintableUSDT.address))
        .to.be.revertedWith("tokenIndex already exists");
    });

    it("Remove Allow Token", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(ethernalBridge.connect(deployer).removeAllowToken(AddressZero))
        .to.be.revertedWith("invalid address");

        await ethernalBridge.connect(deployer).addAllowToken(usdt.address, vaultMintableUSDT.address);

        await ethernalBridge.connect(deployer).removeAllowToken(usdt.address);

        await expect(ethernalBridge.connect(deployer).removeAllowToken(usdt.address))
        .to.be.revertedWith("invalid address");
    });

    it("Set XOracle Message", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(ethernalBridge.connect(deployer).setXOracleMessage(AddressZero))
        .to.be.revertedWith("invalid address");

    });

    it("Set Endpoint", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(ethernalBridge.connect(deployer).setEndpoint(56, AddressZero))
        .to.be.revertedWith("invalid address");

    });

    it("Set Support Dst Token Index", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants
        const chainIdHardHat = await ethernalBridge.chainId();

        await expect(ethernalBridge.connect(deployer).setSupportDstTokenIndex(chainIdHardHat, tokenIndexes.USDT, true))
        .to.be.revertedWith("invalid chainId");
    });

    it("Send", async function () {
        const [deployer, account2, account3, endpoint] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        const chainIdHardHat = await ethernalBridge.chainId();
        const chainIdBSC = 56;

        // Bridge EUSDT -> USDT  
        // Chain hardhat -> BSC
        // vault vaultEthernal -> vaultVenus

        // send token address = AddressZero
        await expect(ethernalBridge.connect(account2).send(AddressZero, 0, chainIdHardHat, tokenIndexes.USDT, account2.address, {value: 0}))
        .to.be.revertedWith("invalid token address");

        // srcChainId = dstChainId
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, chainIdHardHat, tokenIndexes.USDT, AddressZero, {value: 0}))
        .to.be.revertedWith("invalid chainId");

        // receiver = AddressZero
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, 0, tokenIndexes.USDT, AddressZero, {value: 0}))
        .to.be.revertedWith("invalid receiver address");

        // check fee
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, 0, tokenIndexes.USDT, account2.address, {value: 0}))
        .to.be.revertedWith("insufficient fee");

        // not yet set endpoint
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, 0, tokenIndexes.USDT, account2.address, {value: fee}))
        .to.be.revertedWith("invalid endpoint address");

        await ethernalBridge.connect(deployer).setEndpoint(chainIdBSC, endpoint.address)

        // not yet add allow token
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, chainIdBSC, tokenIndexes.USDT, account2.address, {value: fee}))
        .to.be.revertedWith("token not allowed");

        await ethernalBridge.connect(deployer).addAllowToken(eusdt.address, vaultEthernalEUSDT.address);
        
        // bridge not set support dst token
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, chainIdBSC, tokenIndexes.USDT, account2.address, {value: fee}))
        .to.be.revertedWith("dstTokenIndex not allowed");

        await ethernalBridge.connect(deployer).setSupportDstTokenIndex(chainIdBSC, tokenIndexes.USDT, true);

        // set controller for mint usdt
        await usdt.connect(deployer).setController(deployer.address, true);
        await usdt.connect(deployer).mint(account2.address, expandDecimals(100, 18));
        await usdt.connect(account2).approve(eusdt.address, expandDecimals(100, 18));

        // deposit usdt get 100 eusdt
        await eusdt.connect(account2).deposit(expandDecimals(100, 18));

        // set controller for burn
        await usdt.connect(deployer).setController(vaultEthernalEUSDT.address, true);

        // approve eusdt to ethernalBridge
        await eusdt.connect(account2).approve(ethernalBridge.address, expandDecimals(100, 18));

        await vaultEthernalEUSDT.connect(deployer).setController(ethernalBridge.address);

        await ethernalBridge.connect(account2).send(eusdt.address, expandDecimals(100, 18), chainIdBSC, tokenIndexes.USDT, account2.address, {value: fee});
    });

    it("Send ETH", async function () {
        const [deployer, account2, account3, endpoint] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        const chainIdHardHat = await vaultETH.chainId();
        const chainIdBSC = 56;
        const ETH_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        const amount = 1; // 1 ETH

        // Bridge ETH -> ETH  
        // Chain hardhat -> BSC
        // vault vaultETH -> vaultVenus

        // srcChainId = dstChainId
        await expect(ethernalBridge.connect(account2).sendETH(chainIdHardHat, tokenIndexes.ETH, AddressZero, {value: 0}))
        .to.be.revertedWith("invalid chainId");

        // receiver = AddressZero
        await expect(ethernalBridge.connect(account2).sendETH(0, tokenIndexes.ETH, AddressZero, {value: 0}))
        .to.be.revertedWith("invalid receiver address");

        // check fee
        await expect(ethernalBridge.connect(account2).sendETH(0, tokenIndexes.ETH, account2.address, {value: 0}))
        .to.be.revertedWith("insufficient fee");

        // not yet set endpoint
        await expect(ethernalBridge.connect(account2).sendETH(0, tokenIndexes.ETH, account2.address, {value: fee + amount}))
        .to.be.revertedWith("invalid endpoint address");

        await ethernalBridge.connect(deployer).setEndpoint(chainIdBSC, endpoint.address)

        // not yet add allow token
        await expect(ethernalBridge.connect(account2).sendETH(chainIdBSC, tokenIndexes.ETH, account2.address, {value: fee + amount}))
        .to.be.revertedWith("token not allowed");

        await ethernalBridge.connect(deployer).addAllowToken(ETH_TOKEN, vaultETH.address);

        // bridge not set support Token
        await expect(ethernalBridge.connect(account2).sendETH(chainIdBSC, tokenIndexes.ETH, account2.address, {value: fee + amount}))
        .to.be.revertedWith("dstTokenIndex not allowed");

        await ethernalBridge.connect(deployer).setSupportDstTokenIndex(chainIdBSC, tokenIndexes.ETH, true);

        await vaultETH.connect(deployer).setController(ethernalBridge.address);

        await ethernalBridge.connect(account2).sendETH(chainIdBSC, tokenIndexes.ETH, account2.address, {value: fee + amount});
    });
})

function bigNumberify(n) {
    return ethers.BigNumber.from(n)
}

function expandDecimals(n, decimals) {
    return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
}