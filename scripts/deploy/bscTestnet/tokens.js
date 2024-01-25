const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner, writeTmpAddresses } = require('../../lib/deploy')
const { networkId, config } = require('../../../config')

async function main() {
  let deployer = await getFrameSigner()
  const interestPerBlock = 0;
  console.log('Deploying contracts with the account:', deployer.address)

  // ERC20Token
  const btc = await deployContract('ERC20Token', ['BTC (Ethernal)', 'BTC'], 'BTC', deployer)
  const eth = await deployContract('ERC20Token', ['ETH (Ethernal)', 'ETH'], 'ETH', deployer)
  const bnb = { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' }
  writeTmpAddresses({
    ['BNB']: bnb.address,
  })
  const usdt = await deployContract('ERC20Token', ['USDT (Ethernal)', 'USDT'], 'USDT', deployer)
  const usdc = await deployContract('ERC20Token', ['USDC (Ethernal)', 'USDC'], 'USDC', deployer)

  // ibToken
  const vbtc = await deployContract('VToken', ['Venus BTC', 'VBTC', getContractAddress('btc'), interestPerBlock], 'VBTC', deployer)
  const veth = await deployContract('VToken', ['Venus ETH', 'VETH', getContractAddress('eth'), interestPerBlock], 'VETH', deployer)
  const vbnb = await deployContract('VBNB', ['Venus BNB', 'VBNB', interestPerBlock], 'VBNB', deployer)
  const vusdt = await deployContract('VToken', ['Venus USDT', 'VUSDT', getContractAddress('usdt'), interestPerBlock], 'VUSDT', deployer)
  const vusdc = await deployContract('VToken', ['Venus USDC', 'VUSDC', getContractAddress('usdc'), interestPerBlock], 'VUSDC', deployer)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })