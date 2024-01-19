const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner, writeTmpAddresses } = require('../../lib/deploy')


async function main() {
    let deployer = await getFrameSigner()
    console.log('Deploying contracts with the account:', deployer.address)
    
    // ERC20Token
    const btc = await deployContract('ERC20Token', ['BTC (Ethernal)', 'BTC'], 'BTC', deployer)
    const eth = { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' }
    writeTmpAddresses({
      ['ETH']: eth.address,
    })
    const bnb = await deployContract('ERC20Token', ['BNB  (Ethernal)', 'BNB'], 'BNB', deployer)
    const usdt = await deployContract('ERC20Token', ['USDT (Ethernal)', 'USDT'], 'USDT', deployer)
    const usdc = await deployContract('ERC20Token', ['USDC (Ethernal)', 'USDC'], 'USDC', deployer)
    // const btc = await getContractAddress(`btc`)
    // const eth = await getContractAddress(`eth`)
    // const bnb = await getContractAddress(`bnb`)
    // const usdt = await getContractAddress(`usdt`)
    // const usdc = await getContractAddress(`usdc`)

    // ibToken
    const ceth = await deployContract('CETH', ['Compound ETH', 'CETH', 0], 'CETH', deployer)
    
    // EthernalToken
    const ebtc = await deployContract('EthernalToken', ['Ethernal Passive Yield BTC', 'EBTC', getContractAddress(`btc`)], 'EBTC', deployer)
    // const eeth = await deployContract('EthernalToken', ['Ethernal Passive Yield ETH', 'EETH', eth.address], 'EETH', deployer)
    const ebnb = await deployContract('EthernalToken', ['Ethernal Passive Yield BNB', 'EBNB', getContractAddress(`eth`)], 'EBNB', deployer)
    const eusdt = await deployContract('EthernalToken', ['Ethernal Passive Yield USDT', 'EUSDT', getContractAddress(`usdt`)], 'EUSDT', deployer)
    const eusdc = await deployContract('EthernalToken', ['Ethernal Passive Yield USDC', 'EUSDC', getContractAddress(`usdc`)], 'EUSDC', deployer)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })