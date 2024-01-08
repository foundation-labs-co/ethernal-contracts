const { networkId, config } = require('../../../config')
const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')
const { toWei } = require('../../lib/helper')

async function main() {
  let deployer = await getFrameSigner()

  const srcChain = networkId.develop
  const faucet = config.chains[srcChain].faucet

  if (+faucet == 0) {
    console.log('faucet unavailable')
    return
  }

  // deploy FaucetFund
  const faucetFund = await deployContract('FaucetFund', [], 'FaucetFund', deployer)
  // const faucetFund = await contractAt('FaucetFund', getContractAddress(`faucetFund`), deployer)

  await sendTxn(faucetFund.setFaucet(toWei(faucet)), `faucetFund.setFaucet(${faucet})`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
