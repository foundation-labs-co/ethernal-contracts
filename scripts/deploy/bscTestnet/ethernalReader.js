const { deployContract, contractAt, getContractAddress, sendTxn, getFrameSigner } = require('../../lib/deploy')

async function main() {
  let deployer = await getFrameSigner()

  // deploy EthernalReader
  const ethernalReader = await deployContract('EthernalReader', [], 'EthernalReader', deployer)
  // const ethernalReader = await contractAt('EthernalReader', getContractAddress(`ethernalReader`), deployer)

  // test reader
  const tokens = [
    getContractAddress(`btc`),
    getContractAddress(`eth`),
    getContractAddress(`bnb`),
    getContractAddress(`usdt`),
    getContractAddress(`usdc`),
  ]

  let result = await ethernalReader.getUserTokenInfo(
    getContractAddress(`ethernalBridge`),
    '0x881D40237659C251811CEC9c364ef91dC08D300C', // account
    tokens
  )
  console.log(result)

  for (let i = 0; i < tokens.length; i++) {
    result = await ethernalReader.getTokenInfo(getContractAddress(`ethernalBridge`), tokens[i])
    console.log(result)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
