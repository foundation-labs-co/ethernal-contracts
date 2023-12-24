const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const srcChain = networkId.bscTestnet
  const dstChains = [networkId.develop]

  // deploy EthernalBridge
  const ethernalBridge = await deployContract(
    'EthernalBridge',
    [config.chains[srcChain].xOracleMessage],
    'EthernalBridge',
    deployer
  )
  // const ethernalBridge = await contractAt('EthernalBridge', getContractAddress('ethernalBridge'), deployer)

  // deploy Vaults
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]
    const tokenAddress = getContractAddress(vaultToken.tokenName)
    const vault = await deployContract(
      vaultToken.type,
      [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit, vaultToken.ibToken],
      `${vaultToken.type} ${vaultToken.name}`,
      deployer
    )

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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
