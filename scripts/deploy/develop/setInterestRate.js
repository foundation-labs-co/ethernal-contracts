const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()
  console.log('Deploying contracts with the account:', deployer.address)

  const srcChain = networkId.develop
  
  // set interest rate ethernal tokens
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]

    if (vaultToken.type == 'VaultEthernal') {
      const ethernalToken = await contractAt('EthernalToken', getContractAddress(vaultToken.ethernalTokenName), deployer)
      const rate = vaultToken.ethernalTokenRate

      await sendTxn(ethernalToken.setInterest(rate), `${vaultToken.ethernalTokenName}.setInterest(${rate})`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })