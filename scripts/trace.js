const { contractAt } = require('./lib/deploy')
const { networkId, config } = require('../config')
const abiCoder = new ethers.utils.AbiCoder()

async function main() {
  const chain = config.chains[networkId.bscTestnet]
  const deployer = await impersonateAddress('0xFaDe1f9ba6906e0cdf84De1aFBCeDc6a01Bbd00d')

  const ethernalBridge = await contractAt('EthernalBridge', chain.ethernalBridge, deployer)
  await ethernalBridge.setXOracleMessage(deployer.address)

  const payload = encodePayload(
    7, // uid
    3, // srcTokenIndex
    3, // dstTokenIndex
    '11000000000000000000', // amount
    1112, // srcChainId
    97, // dstChainId
    '0x867825386e8286e953c3761d6e87c745d8da839b', // from
    '0x867825386e8286e953c3761d6e87c745d8da839b' // receiver
  )
  console.log(payload)
  await ethernalBridge.xOracleCall(payload)

  const result = await ethernalBridge.getIncomingBridge(1112, 7)
  console.log(result)
}

function encodePayload(uid, srcTokenIndex, dstTokenIndex, amount, srcChainId, dstChainId, from, receiver) {
    const encodedData = abiCoder.encode(
        ['uint256', 'uint256', 'uint256', 'uint256', 'uint64', 'uint64', 'address', 'address'],
        [uid, srcTokenIndex, dstTokenIndex, amount, srcChainId, dstChainId, from, receiver]
    )
    return encodedData;
}

const impersonateAddress = async (address) => {
  const hre = require('hardhat')
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  })
  const signer = await ethers.provider.getSigner(address)
  signer.address = signer._address
  return signer
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
