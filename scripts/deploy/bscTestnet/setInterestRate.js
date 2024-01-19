const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner, writeTmpAddresses } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()
  console.log('Deploying contracts with the account:', deployer.address)

  const srcChain = networkId.bscTestnet

  // set interest rate venus tokens
  for (let i = 0; i < config.chains[srcChain].vaultTokens.length; i++) {
    const vaultToken = config.chains[srcChain].vaultTokens[i]

    if (vaultToken.type == 'VaultVenus') {
      const vToken = await contractAt('VToken', getContractAddress(`v${vaultToken.tokenName}`), deployer)
      const rate = vaultToken.ibTokenRate

      await sendTxn(vToken.setInterest(rate), `v${vaultToken.tokenName}.setInterest(${rate})`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })