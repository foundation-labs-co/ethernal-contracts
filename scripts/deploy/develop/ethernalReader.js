const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')

async function main() {
  let deployer = await getFrameSigner()

  // deploy EthernalReader
  const ethernalReader = await deployContract('EthernalReader', [], 'EthernalReader', deployer)
  // const ethernalReader = await contractAt('EthernalReader', getContractAddress(`ethernalReader`), deployer)

  // test reader
  const result = await ethernalReader.getUserTokenInfo(
    getContractAddress(`ethernalBridge`),
    '0x881D40237659C251811CEC9c364ef91dC08D300C', // account
    [
      getContractAddress(`btc`),
      getContractAddress(`eth`),
      getContractAddress(`bnb`),
      getContractAddress(`usdt`),
      getContractAddress(`usdc`),
      getContractAddress(`ebtc`),
      getContractAddress(`eeth`),
      getContractAddress(`ebnb`),
      getContractAddress(`eusdt`),
      getContractAddress(`eusdc`),
    ]
  )
  console.log(result)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
