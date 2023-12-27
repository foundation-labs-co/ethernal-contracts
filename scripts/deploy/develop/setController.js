const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const srcChain = networkId.develop

  // set tokens
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]
    
    if (vaultToken.type == 'VaultMintable') {
      const token = await contractAt('ERC20Token', getContractAddress(vaultToken.tokenName), deployer)
      const vault = getContractAddress(`vault${vaultToken.name}`)
      const vaultEthernal = getContractAddress(`vaultE${vaultToken.name}`)
      const ethernalToken = getContractAddress(`e${vaultToken.tokenName}`)

      // set controller
      await sendTxn(token.setController(vault, true), `${vaultToken.tokenName}.setController(${vault}, true)`)
      await sendTxn(token.setController(vaultEthernal, true), `${vaultToken.tokenName}.setController(${vaultEthernal}, true)`)
      await sendTxn(token.setController(ethernalToken, true), `${vaultToken.tokenName}.setController(${ethernalToken}, true)`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
