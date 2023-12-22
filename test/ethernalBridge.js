const { expect } = require("chai");
const { ethers } = require("hardhat");
const { config, tokenIndexes } = require('../config')

describe("Ethernal Bridge", function () {
    let EthernalBridgeContract

    let ethernalBridge

    let VaultMintable

    let VaultEthernal

    let vaultMintableUSDT

    let vaultEthernalEUSDT


    beforeEach(async function () {
        ERC20Token = await ethers.getContractFactory("ERC20Token");
        EthernalToken = await ethers.getContractFactory("EthernalToken");

        EthernalBridgeContract = await ethers.getContractFactory("EthernalBridge");

        VaultMintable = await ethers.getContractFactory("VaultMintable");
        VaultEthernal = await ethers.getContractFactory("VaultEthernal");

        MockXOracleMessage = await ethers.getContractFactory("XOracleMessage");

        // Deploy Token
        usdt = await ERC20Token.deploy("Ethernal-Peg USDT Token", "USDT");
        await usdt.deployed();

        eusdt = await EthernalToken.deploy("Ethernal Wrapped Yield USDT", "EUSDT", usdt.address);
        await eusdt.deployed();

        // Deploy EthernalBridge
        ethernalBridge = await EthernalBridgeContract.deploy();
        await ethernalBridge.deployed();

        // Deploy Vault USDT - EUSDT
        vaultMintableUSDT = await VaultMintable.deploy(tokenIndexes.USDT, usdt.address, expandDecimals(1, 18));
        await vaultMintableUSDT.deployed();

        vaultEthernalEUSDT = await VaultEthernal.deploy(tokenIndexes.EUSDT, usdt.address, expandDecimals(1, 18), tokenIndexes.USDT, eusdt.address);
        await vaultEthernalEUSDT.deployed();

        // Deploy Mock XOracleMessage
        xOracleMessage = await MockXOracleMessage.deploy();
        await xOracleMessage.deployed();
        await ethernalBridge.setXOracleMessage(xOracleMessage.address);
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

        // const chainId = await vaultMintableUSDT.chainId();
        // console.log("chainId: ", chainId.toString());
        
        // const tokenIndex = await vaultMintableUSDT.tokenIndex();
        // console.log("tokenIndex: ", tokenIndex.toString());
        
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

    it("send", async function () {
        const [deployer, account2, account3, endpoint] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        const chainIdHardHat = await vaultMintableUSDT.chainId();
        console.log("chainId: ", chainIdHardHat.toString());
        const chainIdBSC = 56;

        // Bridge EUSDT -> USDT  
        // Chain hardhat -> BSC
        // vault vaultEthernal -> vaultVenus

        // send token address = AddressZero
        await expect(ethernalBridge.connect(account2).send(AddressZero, 0, chainIdHardHat, tokenIndexes.USDT, account2.address))
        .to.be.revertedWith("invalid token address");

        // srcChainId = dstChainId
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, chainIdHardHat, tokenIndexes.USDT, AddressZero))
        .to.be.revertedWith("invalid chainId");

        // receiver = AddressZero
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, 0, tokenIndexes.USDT, AddressZero))
        .to.be.revertedWith("invalid receiver address");

        // not yet set endpoint
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, 0, tokenIndexes.USDT, account2.address))
        .to.be.revertedWith("invalid endpoint address");

        await ethernalBridge.connect(deployer).setEndpoint(chainIdBSC, endpoint.address)

        // not yet add allow token
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, chainIdBSC, tokenIndexes.USDT, account2.address))
        .to.be.revertedWith("token not allowed");

        await ethernalBridge.connect(deployer).addAllowToken(eusdt.address, vaultEthernalEUSDT.address);
        
        // vault not set support Token
        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, chainIdBSC, tokenIndexes.USDT, account2.address))
        .to.be.revertedWith("tokenIndex not allowed");

        await vaultEthernalEUSDT.connect(deployer).setSupportTokenIndex(tokenIndexes.USDT, true);

        await usdt.connect(deployer).setController(deployer.address, true);
        await usdt.connect(deployer).setController(vaultEthernalEUSDT.address, true);
        await usdt.connect(deployer).mint(account2.address, expandDecimals(100, 18));
        await usdt.connect(account2).approve(eusdt.address, expandDecimals(100, 18));
        // deposit usdt get 100 eusdt
        await eusdt.connect(account2).deposit(expandDecimals(100, 18));
        
        // approve eusdt to ethernalBridge
        await eusdt.connect(account2).approve(ethernalBridge.address, expandDecimals(100, 18));

        await vaultEthernalEUSDT.connect(deployer).setController(ethernalBridge.address);

        await ethernalBridge.connect(account2).send(eusdt.address, expandDecimals(100, 18), chainIdBSC, tokenIndexes.USDT, account2.address);
    });
})

function bigNumberify(n) {
    return ethers.BigNumber.from(n)
}

function expandDecimals(n, decimals) {
    return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
}