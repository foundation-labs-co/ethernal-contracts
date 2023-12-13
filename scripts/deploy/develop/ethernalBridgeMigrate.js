const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  // deploy new EthernalBridge
  const ethernalBridge = await deployContract('EthernalBridge', [], 'EthernalBridge', deployer)

  // migrate
  for (let i = 0; i < config.vaultTokens.length; i++) {
    const vaultToken = config.vaultTokens[i]
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
