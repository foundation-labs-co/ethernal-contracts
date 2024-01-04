const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const srcChain = networkId.develop
  const dstChains = [networkId.bscTestnet]

  // deploy EthernalBridge
  const ethernalBridge = await deployContract(
    'EthernalBridge',
    [config.chains[srcChain].xOracleMessage],
    'EthernalBridge',
    deployer
  )

  // deploy Vaults
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]
    let vault
    let tokenAddress
    if (vaultToken.type == 'VaultMintable') {
      vault = await deployContract(
        'VaultMintable',
        [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit],
        `Vault${vaultToken.name}`,
        deployer
      )
      tokenAddress = getContractAddress(vaultToken.tokenName)
    } else if (vaultToken.type == 'VaultEthernal') {
      vault = await deployContract(
        'VaultEthernal',
        [
          vaultToken.tokenIndex,
          getContractAddress(vaultToken.tokenName),
          vaultToken.minDeposit,
          getContractAddress(vaultToken.ethernalTokenName),
        ],
        `Vault${vaultToken.name}`,
        deployer
      )
      tokenAddress = getContractAddress(vaultToken.ethernalTokenName)
    }

    // set controller
    await sendTxn(vault.setController(ethernalBridge.address), `vault.setController(${ethernalBridge.address})`)

    const isExist = await ethernalBridge.tokenVaults(tokenAddress)
    if (isExist != '0x0000000000000000000000000000000000000000') {
      // removeAllowToken
      await sendTxn(ethernalBridge.removeAllowToken(tokenAddress), `ethernalBridge.removeAllowToken(${tokenAddress})`)
    }
    
    // addAllowTokens
    await sendTxn(
      ethernalBridge.addAllowToken(tokenAddress, vault.address),
      `ethernalBridge.addAllowToken(${tokenAddress}, ${vault.address})`
    )
  }

  // set supported tokenIndexes for dstChain
  for (let i = 0; i < dstChains.length; i++) {
    const dstChain = dstChains[i]
    for (let j = 0; j < config.chains[dstChain].vaultTokens.length; j++) {
      const vaultToken = config.chains[dstChain].vaultTokens[j]
      await sendTxn(
        ethernalBridge.setSupportDstTokenIndex(dstChain, vaultToken.tokenIndex, true),
        `ethernalBridge.setSupportDstTokenIndex(${dstChain}, ${vaultToken.tokenIndex}, true)`
      )
    }
  }

  // set pair tokenIndex
  for (let i = 0; i < config.pairTokenIndexes.length; i++) {
    const pairTokenIndex = config.pairTokenIndexes[i]
    await sendTxn(
      ethernalBridge.addPairTokenIndex(pairTokenIndex[0], pairTokenIndex[1]),
      `ethernalBridge.addPairTokenIndex(${pairTokenIndex[0]}, ${pairTokenIndex[1]})`
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
