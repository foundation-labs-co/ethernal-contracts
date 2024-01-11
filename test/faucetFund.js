const { expect } = require("chai");
const { ethers } = require("hardhat");
const { config, tokenIndexes, networkId } = require('../config')

const abiCoder = new ethers.utils.AbiCoder()

describe("Ethernal Bridge", function () {
    let EthernalBridgeContract
    let ethernalBridge

    let MockXOracleMessage
    let xOracleMessage

    let FaucetFund
    let faucetFund

    let ERC20Token
    let EthernalToken

    let usdt
    let eusdt
    
    let VaultEthernal
    let vaultEthernalEUSDT

    const fee = expandDecimals(1,15); // 0.001 ETH

    beforeEach(async function () {

        // Bridge Contract
        EthernalBridgeContract = await ethers.getContractFactory("EthernalBridge");
        
        // XOracle Message Contract
        MockXOracleMessage = await ethers.getContractFactory("XOracleMessage");

        // Faucet Contract
        FaucetFund = await ethers.getContractFactory("FaucetFund");

        // Token Contract
        ERC20Token = await ethers.getContractFactory("ERC20Token");
        EthernalToken = await ethers.getContractFactory("EthernalToken");

        // Vault Contract
        VaultEthernal = await ethers.getContractFactory("VaultEthernal");
        
        // Deploy Mock XOracleMessage
        xOracleMessage = await MockXOracleMessage.deploy();
        await xOracleMessage.deployed();

        await xOracleMessage.setFee(fee);

        // Deploy EthernalBridge
        ethernalBridge = await EthernalBridgeContract.deploy(xOracleMessage.address);
        await ethernalBridge.deployed();

        // USDT - EUSDT
        usdt = await ERC20Token.deploy("USDT (Ethernal)", "USDT");
        await usdt.deployed();
        eusdt = await EthernalToken.deploy("Ethernal Passive Yield USDT", "EUSDT", usdt.address);
        await eusdt.deployed();
        
        // Deploy Vault EUSDT
        vaultEthernalEUSDT = await VaultEthernal.deploy(tokenIndexes.EUSDT, usdt.address, expandDecimals(1, 18), eusdt.address);
        await vaultEthernalEUSDT.deployed();

        // set pair tokenIndex
        for (let i = 0; i < config.pairTokenIndexes.length; i++) {
            const pairTokenIndex = config.pairTokenIndexes[i]
            await ethernalBridge.addPairTokenIndex(pairTokenIndex[0], pairTokenIndex[1])
        }

        // Deploy Faucet
        faucetFund = await FaucetFund.deploy();
        await faucetFund.deployed();
    });

    it("Only owner can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(faucetFund.connect(account2).setFaucet(expandDecimals(1, 18)))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(faucetFund.connect(account2).addPool(AddressZero))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(faucetFund.connect(account2).removePool(AddressZero))
        .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(faucetFund.connect(account2).rescueFund())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Only pools can call this function", async function () {
        const [deployer, account2, account3] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await expect(faucetFund.connect(account2).transferTo(AddressZero))
        .to.be.revertedWith("FaucetFund: caller is not the pool");
    });

    it("Add Pool", async function () {
        const [deployer, account2, account3, pool] = await ethers.getSigners();
        const {AddressZero} = ethers.constants

        await faucetFund.connect(deployer).addPool(pool.address)

        await expect(faucetFund.connect(deployer).addPool(pool.address))
        .to.be.revertedWith("pool exist")

        expect(await faucetFund.pools(pool.address)).to.equal(true);
    });

    it("Remove Pool", async function () {
        const [deployer, account2, account3, pool] = await ethers.getSigners();

        await expect(faucetFund.connect(deployer).removePool(pool.address))
        .to.be.revertedWith("pool not exist")

        await faucetFund.connect(deployer).addPool(pool.address)

        await faucetFund.connect(deployer).removePool(pool.address)

        expect(await faucetFund.pools(pool.address)).to.equal(false);
    });

    it("Rescue Fund", async function () {
        const [deployer, account2, account3, pool] = await ethers.getSigners();

        // send ETH to FaucetFund
        await deployer.sendTransaction({
            to: faucetFund.address,
            value: expandDecimals(1, 18)
        })

        // get balance before rescue
        const balanceBefore = await deployer.getBalance();
        
        // get gas spent from this tx
        const tx = await faucetFund.connect(deployer).rescueFund()
        const receipt = await tx.wait()
        const gasSpent = receipt.gasUsed * receipt.effectiveGasPrice

        // get balance after rescue
        const balanceAfter = await deployer.getBalance();

        const amount = balanceAfter.sub(balanceBefore).add(gasSpent);

        await expect(amount).to.equal(expandDecimals(1, 18));
    });

    it("Transfer To", async function () {
        const [deployer, account2, account3, pool, relayNode, user, user2] = await ethers.getSigners();

        const chainIdHardHat = await ethernalBridge.chainId();
        const chainIdBSC = 56;
        const amount = expandDecimals(100, 18); // 100 USDT
        const faucetAmount = expandDecimals(1, 18);
        const uid = 1

        // Bridge USDT -> EUSDT
        // Chain  BSC -> hardhat
        // vault vaultVenus -> vaultEthernal

        // set account2 to xOracleMessage
        await ethernalBridge.connect(deployer).setXOracleMessage(account2.address);

        await ethernalBridge.connect(deployer).addAllowToken(eusdt.address, vaultEthernalEUSDT.address);
        await vaultEthernalEUSDT.connect(deployer).setController(ethernalBridge.address);
        await usdt.connect(deployer).setController(vaultEthernalEUSDT.address, true);

        // send ETH to FaucetFund
        await deployer.sendTransaction({
            to: faucetFund.address,
            value: expandDecimals(1, 18)
        })

        // set faucetFund
        await ethernalBridge.connect(deployer).setFaucetFund(faucetFund.address);
        await faucetFund.connect(deployer).setFaucet(faucetAmount)

        await expect(ethernalBridge.connect(account2).xOracleCall(encodePayload(uid, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, user.address)))
        .to.be.revertedWith("FaucetFund: caller is not the pool");

        await faucetFund.connect(deployer).addPool(ethernalBridge.address)

        // get ETH balance FaucetFund before xOracleCall
        const balanceFaucetFundBefore = await faucetFund.balance()

        // receiver = contract (usdt)
        await ethernalBridge.connect(account2).xOracleCall(encodePayload(uid, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, usdt.address))

        // get ETH balance FaucetFund after xOracleCall
        const balanceFaucetFundAfter = await faucetFund.balance()
        
        await expect(balanceFaucetFundAfter).to.be.equal(balanceFaucetFundBefore)

        // get ETH balance user before xOracleCall
        let balanceUserBefore = await user.getBalance()

        await ethernalBridge.connect(account2).xOracleCall(encodePayload(uid + 1, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, user.address))

        // get ETH balance user after xOracleCall
        let balanceUserAfter = await user.getBalance()

        const amountUser = await balanceUserAfter.sub(balanceUserBefore);
        await expect(amountUser).to.be.equal(faucetAmount);

        // get ETH balance user before xOracleCall
        balanceUserBefore = await user.getBalance()

        // faucet fund = 0, do not transfer to user
        await ethernalBridge.connect(account2).xOracleCall(encodePayload(uid + 2, tokenIndexes.USDT, tokenIndexes.EUSDT, amount, chainIdBSC, chainIdHardHat, account2.address, user.address))
        
        // get ETH balance user after xOracleCall
        balanceUserAfter = await user.getBalance()

        await expect(balanceUserBefore).to.be.equal(balanceUserAfter)
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