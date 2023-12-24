const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')


async function main() {
    let deployer = await getFrameSigner()
    console.log('Deploying contracts with the account:', deployer.address)

    const interestPerBlock = Math.round(0.1 * (365*24*60*60 / 3));
    
    // ERC20Token
    const btc = await deployContract('ERC20Token', ['BTC (Ethernal)', 'BTC'], 'BTC', deployer)
    const eth = await deployContract('ERC20Token', ['ETH (Ethernal)', 'ETH'], 'ETH', deployer)
    const bnb = await deployContract('ERC20Token', ['BNB  (Ethernal)', 'BNB'], 'BNB', deployer)
    const usdt = await deployContract('ERC20Token', ['USDT (Ethernal)', 'USDT'], 'USDT', deployer)
    const usdc = await deployContract('ERC20Token', ['USDC (Ethernal)', 'USDC'], 'USDC', deployer)

    // ibToken
    const vbtc = await deployContract('VToken', ['Venus BTC', 'VBTC', btc.address, interestPerBlock], 'VBTC', deployer)
    const veth = await deployContract('VToken', ['Venus ETH', 'VETH', eth.address, interestPerBlock], 'VETH', deployer)
    const vbnb = await deployContract('VToken', ['Venus BNB', 'VBNB', bnb.address, interestPerBlock], 'VBNB', deployer)
    const vusdt = await deployContract('VToken', ['Venus USDT', 'VUSDT', usdt.address, interestPerBlock], 'VUSDT', deployer)
    const vusdc = await deployContract('VToken', ['Venus USDC', 'VUSDC', usdc.address, interestPerBlock], 'VUSDC', deployer)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })