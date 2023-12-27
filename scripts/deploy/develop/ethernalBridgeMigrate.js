const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const srcChain = networkId.develop
  const dstChains = [networkId.bscTestnet]

  // deploy new EthernalBridge
  const ethernalBridge = await deployContract(
    'EthernalBridge',
    [config.chains[srcChain].xOracleMessage],
    'EthernalBridge',
    deployer
  )

  // migrate
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]
    const vault = await contractAt(vaultToken.type, getContractAddress(`vault${vaultToken.name}`), deployer)
    let tokenAddress
    if (vaultToken.type == 'VaultMintable') {
      tokenAddress = getContractAddress(vaultToken.tokenName)
    } else if (vaultToken.type == 'VaultEthernal') {
      tokenAddress = getContractAddress(vaultToken.ethernalTokenName)
    }

    // set controller
    await sendTxn(vault.setController(ethernalBridge.address), `vault.setController(${ethernalBridge.address})`)

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
