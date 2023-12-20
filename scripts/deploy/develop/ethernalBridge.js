const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  // deploy EthernalBridge
  const ethernalBridge = await deployContract('EthernalBridge', [], 'EthernalBridge', deployer)

  // deploy Vaults
  for (let i = 0; i < config.vaultTokens.length; i++) {
    const vaultToken = config.vaultTokens[i]
    let vault
    let tokenAddress
    if (vaultToken.type == 'VaultMintable') {
      vault = await deployContract(
        'VaultMintable',
        [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit],
        `VaultMintable ${vaultToken.name}`,
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
          vaultToken.reserveTokenIndex,
          getContractAddress(vaultToken.ethernalTokenName),
        ],
        `VaultEthernal ${vaultToken.name}`,
        deployer
      )
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
