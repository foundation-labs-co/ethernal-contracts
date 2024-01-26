const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config, tokenIndexes } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const srcChain = networkId.holesky

  // get EthernalBridge deployed
  const ethernalBridge = await contractAt('EthernalBridge', getContractAddress('ethernalBridge'), deployer)

  // migrate
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]
    if (vaultToken.type == 'VaultEthernal') {
      // remove controller previous vault
      const token = await contractAt('ERC20Token', getContractAddress(vaultToken.tokenName), deployer)
      const prevVaultAddress = getContractAddress(`vault${vaultToken.name}`)
      await sendTxn(token.setController(prevVaultAddress, false), `${vaultToken.tokenName}.setController(${prevVaultAddress}, false)`)

      // deploy new VaultEthernal
      const vault = await deployContract(
        vaultToken.type,
        [
          vaultToken.tokenIndex,
          getContractAddress(vaultToken.tokenName),
          vaultToken.minDeposit,
          getContractAddress(vaultToken.ethernalTokenName),
        ],
        `Vault${vaultToken.name}`,
        deployer
      )

      const ethernalTokenAddress = getContractAddress(vaultToken.ethernalTokenName)

      // set controller
      await sendTxn(vault.setController(ethernalBridge.address), `vault.setController(${ethernalBridge.address})`)
      await sendTxn(token.setController(vault.address, true), `${vaultToken.tokenName}.setController(${vault.address}, true)`)

      // removeAllowToken
      const isExist = await ethernalBridge.tokenVaults(ethernalTokenAddress)
      if (isExist != '0x0000000000000000000000000000000000000000') {
        // removeAllowToken
        await sendTxn(ethernalBridge.removeAllowToken(ethernalTokenAddress), `ethernalBridge.removeAllowToken(${ethernalTokenAddress})`)
      }

      // addAllowTokens
      await sendTxn(
        ethernalBridge.addAllowToken(ethernalTokenAddress, vault.address),
        `ethernalBridge.addAllowToken(${ethernalTokenAddress}, ${vault.address})`
      )
    }
    else if (vaultToken.type == 'VaultMintable') {
      // remove controller previous vault
      const token = await contractAt('ERC20Token', getContractAddress(vaultToken.tokenName), deployer)
      const prevVaultAddress = getContractAddress(`vault${vaultToken.name}`)
      await sendTxn(token.setController(prevVaultAddress, false), `${vaultToken.tokenName}.setController(${prevVaultAddress}, false)`)

      // deploy new VaultMintable
      const vault = await deployContract(
        vaultToken.type,
        [
          vaultToken.tokenIndex,
          getContractAddress(vaultToken.tokenName),
          vaultToken.minDeposit,
        ],
        `Vault${vaultToken.name}`,
        deployer
      )

      // set controller
      await sendTxn(vault.setController(ethernalBridge.address), `vault.setController(${ethernalBridge.address})`)
      await sendTxn(token.setController(vault.address, true), `${vaultToken.tokenName}.setController(${vault.address}, true)`)

      // removeAllowToken
      const isExist = await ethernalBridge.tokenVaults(token.address)
      if (isExist != '0x0000000000000000000000000000000000000000') {
        // removeAllowToken
        await sendTxn(ethernalBridge.removeAllowToken(token.address), `ethernalBridge.removeAllowToken(${token.address})`)
      }

      // addAllowTokens
      await sendTxn(
        ethernalBridge.addAllowToken(token.address, vault.address),
        `ethernalBridge.addAllowToken(${token.address}, ${vault.address})`
      )
    }
    else if (vaultToken.type == 'VaultCompoundETH') {
      // remove controller previous vault
      const token = await contractAt('ERC20Token', getContractAddress(vaultToken.tokenName), deployer)

      // deploy new VaultCompoundETH
      const vault = await deployContract(
        vaultToken.type,
        [
          vaultToken.tokenIndex,
          getContractAddress(vaultToken.tokenName),
          vaultToken.minDeposit,
          vaultToken.ibToken,
        ],
        `Vault${vaultToken.name}`,
        deployer
      )

      // set controller
      await sendTxn(vault.setController(ethernalBridge.address), `vault.setController(${ethernalBridge.address})`)

      // removeAllowToken
      const isExist = await ethernalBridge.tokenVaults(token.address)
      if (isExist != '0x0000000000000000000000000000000000000000') {
        // removeAllowToken
        await sendTxn(ethernalBridge.removeAllowToken(token.address), `ethernalBridge.removeAllowToken(${token.address})`)
      }

      // addAllowTokens
      await sendTxn(
        ethernalBridge.addAllowToken(token.address, vault.address),
        `ethernalBridge.addAllowToken(${token.address}, ${vault.address})`
      )
    }
  }
  // call send function from ethernalBridge
  const amount = ethers.utils.parseEther('0.001')
  const fee = ethers.utils.parseEther('0.001')
  const amountWithFee = amount.add(fee)
  const dstChainId = 97

  await sendTxn(
    ethernalBridge.sendETH(dstChainId, tokenIndexes.ETH, deployer.address, { value: amountWithFee }),
    `ethernalBridge.sendETH(${dstChainId}, ${tokenIndexes.ETH}, ${deployer.address}, {value: ${amountWithFee}})`
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })