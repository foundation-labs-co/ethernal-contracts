const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')


async function main() {
    let deployer = await getFrameSigner()
    console.log('Deploying contracts with the account:', deployer.address)
    
    // ERC20Token
    const btc = await deployContract('ERC20Token', ['BTC (Ethernal)', 'BTC'], 'BTC', deployer)
    const eth = await deployContract('ERC20Token', ['ETH (Ethernal)', 'ETH'], 'ETH', deployer)
    const bnb = await deployContract('ERC20Token', ['BNB  (Ethernal)', 'BNB'], 'BNB', deployer)
    const usdt = await deployContract('ERC20Token', ['USDT (Ethernal)', 'USDT'], 'USDT', deployer)
    const usdc = await deployContract('ERC20Token', ['USDC (Ethernal)', 'USDC'], 'USDC', deployer)
    
    // EthernalToken
    const ebtc = await deployContract('EthernalToken', ['Ethernal Passive Yield BTC', 'EBTC', btc.address], 'EBTC', deployer)
    const eeth = await deployContract('EthernalToken', ['Ethernal Passive Yield ETH', 'EETH', eth.address], 'EETH', deployer)
    const ebnb = await deployContract('EthernalToken', ['Ethernal Passive Yield BNB', 'EBNB', bnb.address], 'EBNB', deployer)
    const eusdt = await deployContract('EthernalToken', ['Ethernal Passive Yield USDT', 'EUSDT', usdt.address], 'EUSDT', deployer)
    const eusdc = await deployContract('EthernalToken', ['Ethernal Passive Yield USDC', 'EUSDC', usdc.address], 'EUSDC', deployer)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })