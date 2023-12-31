const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const dstChains = [networkId.develop]

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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
