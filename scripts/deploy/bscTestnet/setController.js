const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()

  const srcChain = networkId.bscTestnet

  // set tokens
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]
    
    if (vaultToken.type == 'VaultVenus') {
      const token = await contractAt('ERC20Token', getContractAddress(vaultToken.tokenName), deployer)
      const vault = getContractAddress(`vaultVenus${vaultToken.name}`)
      const ibToken = vaultToken.ibToken

      // set controller
      await sendTxn(token.setController(vault, true), `${vaultToken.tokenName}.setController(${vault}, true)`)
      await sendTxn(token.setController(ibToken, true), `${vaultToken.tokenName}.setController(${ibToken}, true)`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
