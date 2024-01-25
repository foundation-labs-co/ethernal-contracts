const { expect } = require("chai");
const { ethers } = require("hardhat");
const { config, tokenIndexes, networkId } = require('../config')

const abiCoder = new ethers.utils.AbiCoder()

describe("Ethernal Bridge", function () {
    let EthernalBridgeContract

    let ethernalBridge

    let VaultMintable

    let VaultEthernal

    let vaultMintableUSDT

    let vaultEthernalEUSDT

    const fee = expandDecimals(1,15); // 0.001 ETH
    const lastUid = 0

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
        ethernalBridge = await EthernalBridgeContract.deploy(xOracleMessage.address, lastUid);
        await ethernalBridge.deployed();

        // set pair tokenIndex
        for (let i = 0; i < config.pairTokenIndexes.length; i++) {
            const pairTokenIndex = config.pairTokenIndexes[i]
            await ethernalBridge.addPairTokenIndex(pairTokenIndex[0], pairTokenIndex[1])
        }

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

        vaultEthernalEUSDT = await VaultEthernal.deploy(tokenIndexes.EUSDT, usdt.address, expandDecimals(1, 18), eusdt.address);
        await vaultEthernalEUSDT.deployed();

        // Deploy Vault ETH 
        vaultETH = await VaultETH.deploy(tokenIndexes.ETH, eth.address, expandDecimals(1, 18), "0x0000000000000000000000000000000000000000");
        await vaultETH.deployed();
    });

    it("Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants
        const uid = await ethernalBridge.uid();

        await expect(ethernalBridge.connect(account2).adminRefund(uid))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(ethernalBridge.connect(account2).addAllowToken(usdt.address, vaultMintableUSDT.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(ethernalBridge.connect(account2).removeAllowToken(usdt.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
        
        await expect(ethernalBridge.connect(account2).setXOracleMessage(AddressZero))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(ethernalBridge.connect(account2).setEndpoint(56, AddressZero))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(ethernalBridge.connect(account2).setSupportDstTokenIndex(56, tokenIndexes.USDT, true))
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
    
    it("Add Pair Token Index", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const { AddressZero } = ethers.constants;
    
        // Call the addPairTokenIndex function
        await ethernalBridge.connect(deployer).addPairTokenIndex(1, 2);
    
        // Call the addPairTokenIndex function again
        await expect(ethernalBridge.connect(deployer).addPairTokenIndex(1, 2))
        .to.be.revertedWith("pair already exists");
    });

    it("Remove Pair Token Index", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const { AddressZero } = ethers.constants;
    
        // Call the removePairTokenIndex function
        await expect(ethernalBridge.connect(deployer).removePairTokenIndex(1, 2))
        .to.be.revertedWith("pair not exists");
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

        await ethernalBridge.connect(deployer).removePairTokenIndex(tokenIndexes.EUSDT, tokenIndexes.USDT);

        await expect(ethernalBridge.connect(account2).send(eusdt.address, 0, chainIdBSC, tokenIndexes.USDT, account2.address, {value: fee}))
        .to.be.revertedWith("pair tokenIndex not allowed");

        await ethernalBridge.connect(deployer).addPairTokenIndex(tokenIndexes.EUSDT, tokenIndexes.USDT);

        // set controller for mint usdt
        await usdt.connect(deployer).setController(deployer.address, true);

        const amount = expandDecimals(100, 18); // 100 USDT
        await usdt.connect(deployer).mint(account2.address, amount);
        await usdt.connect(account2).approve(eusdt.address, amount);

        // deposit usdt get 100 eusdt
        await eusdt.connect(account2).deposit(amount);

        // set controller for burn
        await usdt.connect(deployer).setController(vaultEthernalEUSDT.address, true);

        // approve eusdt to ethernalBridge
        await eusdt.connect(account2).approve(ethernalBridge.address, amount);

        await vaultEthernalEUSDT.connect(deployer).setController(ethernalBridge.address);

        await ethernalBridge.connect(account2).send(eusdt.address, amount, chainIdBSC, tokenIndexes.USDT, account2.address, {value: fee});
        
        // outgoingBridges = parameter
        const uid = await ethernalBridge.uid();
        const outgoingBridges = await ethernalBridge.outgoingBridges(uid);

        await expect(outgoingBridges.srcChainId).to.equal(chainIdHardHat);
        await expect(outgoingBridges.dstChainId).to.equal(chainIdBSC);
        await expect(outgoingBridges.srcTokenIndex).to.equal(tokenIndexes.EUSDT);
        await expect(outgoingBridges.dstTokenIndex).to.equal(tokenIndexes.USDT);
        await expect(outgoingBridges.from).to.equal(account2.address);
        await expect(outgoingBridges.receiver).to.equal(account2.address);
        await expect(outgoingBridges.amount).to.equal(amount);
        await expect(outgoingBridges.bridgeType).to.equal(0); // outgoing
        await expect(outgoingBridges.outgoingRefund).to.equal(false);

        // admin refund
        await ethernalBridge.connect(deployer).removeAllowToken(eusdt.address);

        await expect(ethernalBridge.connect(deployer).adminRefund(999))
        .to.be.revertedWith("uid not found");

        await expect(ethernalBridge.connect(deployer).adminRefund(uid))
        .to.be.revertedWith("tokenIndex not allowed");

        await ethernalBridge.connect(deployer).addAllowToken(eusdt.address, vaultEthernalEUSDT.address);

        await ethernalBridge.connect(deployer).adminRefund(uid);

        await expect(ethernalBridge.connect(deployer).adminRefund(uid))
        .to.be.revertedWith("already refunded");

        const outgoingBridgesAfterRefund = await ethernalBridge.outgoingBridges(uid);
        await expect(outgoingBridgesAfterRefund.outgoingRefund).to.be.equal(true);
    });

    it("Send ETH", async function () {
        const [deployer, account2, account3, endpoint] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        const chainIdHardHat = await vaultETH.chainId();
        const chainIdBSC = 56;
        const ETH_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        const amount = expandDecimals(1, 18); // 1 ETH
        const amountWithFee = amount.add(fee);

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
        await expect(ethernalBridge.connect(account2).sendETH(0, tokenIndexes.ETH, account2.address, {value: amountWithFee}))
        .to.be.revertedWith("invalid endpoint address");

        await ethernalBridge.connect(deployer).setEndpoint(chainIdBSC, endpoint.address)

        // not yet add allow token
        await expect(ethernalBridge.connect(account2).sendETH(chainIdBSC, tokenIndexes.ETH, account2.address, {value: amountWithFee}))
        .to.be.revertedWith("token not allowed");

        await ethernalBridge.connect(deployer).addAllowToken(ETH_TOKEN, vaultETH.address);

        // bridge not set support Token
        await expect(ethernalBridge.connect(account2).sendETH(chainIdBSC, tokenIndexes.ETH, account2.address, {value: amountWithFee}))
        .to.be.revertedWith("dstTokenIndex not allowed");

        await ethernalBridge.connect(deployer).setSupportDstTokenIndex(chainIdBSC, tokenIndexes.ETH, true);

        await ethernalBridge.connect(deployer).removePairTokenIndex(tokenIndexes.ETH, tokenIndexes.ETH);

        await expect(ethernalBridge.connect(account2).sendETH(chainIdBSC, tokenIndexes.ETH, account2.address, {value: amountWithFee}))
        .to.be.revertedWith("pair tokenIndex not allowed");

        await ethernalBridge.connect(deployer).addPairTokenIndex(tokenIndexes.ETH, tokenIndexes.ETH);

        await vaultETH.connect(deployer).setController(ethernalBridge.address);

        await ethernalBridge.connect(account2).sendETH(chainIdBSC, tokenIndexes.ETH, account2.address, {value: amountWithFee});
        
        // outgoingBridges = parameters
        const uid = await ethernalBridge.uid();
        outgoingBridges = await ethernalBridge.outgoingBridges(uid);

        await expect(outgoingBridges.srcChainId).to.equal(chainIdHardHat);
        await expect(outgoingBridges.dstChainId).to.equal(chainIdBSC);
        await expect(outgoingBridges.srcTokenIndex).to.equal(tokenIndexes.ETH);
        await expect(outgoingBridges.dstTokenIndex).to.equal(tokenIndexes.ETH);
        await expect(outgoingBridges.from).to.equal(account2.address);
        await expect(outgoingBridges.receiver).to.equal(account2.address);
        await expect(outgoingBridges.amount).to.equal(amount);
        await expect(outgoingBridges.bridgeType).to.equal(0); // outgoing
        await expect(outgoingBridges.outgoingRefund).to.equal(false);

        // admin refund
        await ethernalBridge.connect(deployer).removeAllowToken(ETH_TOKEN);

        await expect(ethernalBridge.connect(deployer).adminRefund(999))
        .to.be.revertedWith("uid not found");

        await expect(ethernalBridge.connect(deployer).adminRefund(uid))
        .to.be.revertedWith("tokenIndex not allowed");

        await ethernalBridge.connect(deployer).addAllowToken(ETH_TOKEN, vaultETH.address);

        await ethernalBridge.connect(deployer).adminRefund(uid);

        await expect(ethernalBridge.connect(deployer).adminRefund(uid))
        .to.be.revertedWith("already refunded");

        const outgoingBridgesAfterRefund = await ethernalBridge.outgoingBridges(uid);
        
        await expect(outgoingBridgesAfterRefund.outgoingRefund).to.be.equal(true);
    });

    it("Receiving from xOracleCall", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        const chainIdHardHat = await ethernalBridge.chainId();
        const chainIdBSC = 56;
        const amount = expandDecimals(100, 18); // 100 USDT

        // Bridge USDT -> EUSDT
        // Chain  BSC -> hardhat
        // vault vaultVenus -> vaultEthernal

        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(0, tokenIndexes.USDT, tokenIndexes.EUSDT, 0, chainIdBSC, chainIdBSC, account2.address, account2.address)))
        .to.be.revertedWith("only xOracleMessage callback")

        // set account2 to xOracleMessage
        await ethernalBridge.connect(deployer).setXOracleMessage(account2.address);

        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(0, tokenIndexes.USDT, tokenIndexes.EUSDT, 0, chainIdBSC, chainIdBSC, account2.address, account2.address)))
        .to.be.revertedWith("invalid uid")

        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(1, tokenIndexes.USDT, tokenIndexes.EUSDT, 0, chainIdBSC, chainIdBSC, account2.address, account2.address)))
        .to.be.revertedWith("invalid amount")

        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(1, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdBSC, account2.address, account2.address)))
        .to.be.revertedWith("invalid chainId")

        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(1, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, AddressZero)))
        .to.be.revertedWith("invalid receiver address")

        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(1, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, account2.address)))
        .to.be.revertedWith("tokenIndex not allowed")

        await ethernalBridge.connect(deployer).addAllowToken(eusdt.address, vaultEthernalEUSDT.address);

        await vaultEthernalEUSDT.connect(deployer).setController(ethernalBridge.address);
        await usdt.connect(deployer).setController(vaultEthernalEUSDT.address, true);

        await ethernalBridge.connect(account2).xOracleCall(encodePayload(1, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, account2.address))

        // incomingBridges = parameters
        const uidSrcChain = 1;
        incomingBridges = await ethernalBridge.incomingBridges(chainIdBSC, uidSrcChain);
        await expect(incomingBridges.srcChainId).to.equal(chainIdBSC);
        await expect(incomingBridges.dstChainId).to.equal(chainIdHardHat);
        await expect(incomingBridges.srcTokenIndex).to.equal(tokenIndexes.USDT);
        await expect(incomingBridges.dstTokenIndex).to.equal(tokenIndexes.EUSDT);
        await expect(incomingBridges.from).to.equal(account2.address);
        await expect(incomingBridges.receiver).to.equal(account2.address);
        await expect(incomingBridges.amount).to.equal(amount);
        await expect(incomingBridges.bridgeType).to.equal(1); // incoming
        await expect(incomingBridges.outgoingRefund).to.equal(false);
        
        // // check already received
        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(1, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, account2.address)))
        .to.be.revertedWith("already received")
    });
})

function bigNumberify(n) {
    return ethers.BigNumber.from(n)
}

function expandDecimals(n, decimals) {
    return bigNumberify(n).mul(bigNumberify(10).pow(decimals))
}

function encodePayload(uid, srcTokenIndex, dstTokenIndex, amount, srcChainId, dstChainId, from, receiver) {
    const encodedData = abiCoder.encode(
        ['uint256', 'uint256', 'uint256', 'uint256', 'uint64', 'uint64', 'address', 'address'],
        [uid, srcTokenIndex, dstTokenIndex, amount, srcChainId, dstChainId, from, receiver]
    )
    return encodedData;
}