const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const dstChains = [networkId.bscTestnet, networkId.holesky]

  // ethernalBridge
  const ethernalBridge = await contractAt('EthernalBridge', getContractAddress('ethernalBridge'), deployer)

  // set endpoints
  for (let i = 0; i < dstChains.length; i++) {
    const dstChainId = dstChains[i]
    const endpoint = config.chains[dstChainId].ethernalBridge
    await sendTxn(
      ethernalBridge.setEndpoint(dstChainId, endpoint),
      `ethernalBridge.setEndpoint(${dstChainId}, ${endpoint})`
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
