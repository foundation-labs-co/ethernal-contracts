const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')


async function main() {
    let deployer = await getFrameSigner()
    console.log('Deploying contracts with the account:', deployer.address)
    
    // ERC20Token
    const btc = await deployContract('ERC20Token', ['Ethernal-Peg BTC Token', 'BTC'], 'BTC', deployer)
    const eth = await deployContract('ERC20Token', ['Ethernal-Peg ETH Token', 'ETH'], 'ETH', deployer)
    const bnb = await deployContract('ERC20Token', ['Ethernal-Peg BNB Token', 'BNB'], 'BNB', deployer)
    const usdt = await deployContract('ERC20Token', ['Ethernal-Peg USDT Token', 'USDT'], 'USDT', deployer)
    const usdc = await deployContract('ERC20Token', ['Ethernal-Peg USDC Token', 'USDC'], 'USDC', deployer)
    
    // EthernalToken
    const ebtc = await deployContract('EthernalToken', ['Ethernal Wrapped Yield BTC', 'EBTC', btc.address], 'EBTC', deployer)
    const eeth = await deployContract('EthernalToken', ['Ethernal Wrapped Yield ETH', 'EETH', eth.address], 'EETH', deployer)
    const ebnb = await deployContract('EthernalToken', ['Ethernal Wrapped Yield BNB', 'EBNB', bnb.address], 'EBNB', deployer)
    const eusdt = await deployContract('EthernalToken', ['Ethernal Wrapped Yield USDT', 'EUSDT', usdt.address], 'EUSDT', deployer)
    const eusdc = await deployContract('EthernalToken', ['Ethernal Wrapped Yield USDC', 'EUSDC', usdc.address], 'EUSDC', deployer)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })