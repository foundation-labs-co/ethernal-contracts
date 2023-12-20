const network = process.env.HARDHAT_NETWORK || 'mainnet'
const { deployedAddress, getContractAddress } = require('./lib/deploy')
const { config } = require('../config')
const { exec } = require('child_process')

let isDone = false
let errors = []

function getVaultTokenByName(name) {
  for (let i = 0; i < config.vaultTokens.length; i++) {
    const vaultToken = config.vaultTokens[i]
    if (vaultToken.name == name) {
      return vaultToken
    }
  }
  return null
}

function makeParameter(name) {
  var param = []
  if (name == 'BTC') {
    param = ['Ethernal-Peg BTC Token', 'BTC']
  } else if (name == 'ETH') {
    param = ['Ethernal-Peg ETH Token', 'ETH']
  } else if (name == 'BNB') {
    param = ['Ethernal-Peg BNB Token', 'BNB']
  } else if (name == 'USDT') {
    param = ['Ethernal-Peg USDT Token', 'USDT']
  } else if (name == 'USDC') {
    param = ['Ethernal-Peg USDC Token', 'USDC']
  } else if (name == 'EBTC') {
    param = ['Ethernal Wrapped Yield BTC', 'EBTC', getContractAddress('btc')]
  } else if (name == 'EETH') {
    param = ['Ethernal Wrapped Yield ETH', 'EETH', getContractAddress('eth')]
  } else if (name == 'EBNB') {
    param = ['Ethernal Wrapped Yield BNB', 'EBNB', getContractAddress('bnb')]
  } else if (name == 'EUSDT') {
    param = ['Ethernal Wrapped Yield USDT', 'EUSDT', getContractAddress('usdt')]
  } else if (name == 'EUSDC') {
    param = ['Ethernal Wrapped Yield USDC', 'EUSDC', getContractAddress('usdc')]
  } else if (name == 'EthernalBridge') {
    param = []
  } else if (name == 'VaultMintable BTC') {
    vaultToken = getVaultTokenByName('BTC')
    param = [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit]
  } else if (name == 'VaultMintable ETH') {
    vaultToken = getVaultTokenByName('ETH')
    param = [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit]
  } else if (name == 'VaultMintable BNB') {
    vaultToken = getVaultTokenByName('BNB')
    param = [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit]
  } else if (name == 'VaultMintable USDT') {
    vaultToken = getVaultTokenByName('USDT')
    param = [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit]
  } else if (name == 'VaultMintable USDC') {
    vaultToken = getVaultTokenByName('USDC')
    param = [vaultToken.tokenIndex, getContractAddress(vaultToken.tokenName), vaultToken.minDeposit]
  } else if (name == 'VaultEthernal EBTC') {
    vaultToken = getVaultTokenByName('EBTC')
    param = [
      vaultToken.tokenIndex,
      getContractAddress(vaultToken.tokenName),
      vaultToken.minDeposit,
      vaultToken.reserveTokenIndex,
      getContractAddress(vaultToken.ethernalTokenName),
    ]
  } else if (name == 'VaultEthernal EETH') {
    vaultToken = getVaultTokenByName('EETH')
    param = [
      vaultToken.tokenIndex,
      getContractAddress(vaultToken.tokenName),
      vaultToken.minDeposit,
      vaultToken.reserveTokenIndex,
      getContractAddress(vaultToken.ethernalTokenName),
    ]
  } else if (name == 'VaultEthernal EBNB') {
    vaultToken = getVaultTokenByName('EBNB')
    param = [
      vaultToken.tokenIndex,
      getContractAddress(vaultToken.tokenName),
      vaultToken.minDeposit,
      vaultToken.reserveTokenIndex,
      getContractAddress(vaultToken.ethernalTokenName),
    ]
  } else if (name == 'VaultEthernal EUSDT') {
    vaultToken = getVaultTokenByName('EUSDT')
    param = [
      vaultToken.tokenIndex,
      getContractAddress(vaultToken.tokenName),
      vaultToken.minDeposit,
      vaultToken.reserveTokenIndex,
      getContractAddress(vaultToken.ethernalTokenName),
    ]
  } else if (name == 'VaultEthernal EUSDC') {
    vaultToken = getVaultTokenByName('EUSDC')
    param = [
      vaultToken.tokenIndex,
      getContractAddress(vaultToken.tokenName),
      vaultToken.minDeposit,
      vaultToken.reserveTokenIndex,
      getContractAddress(vaultToken.ethernalTokenName),
    ]
  } else if (name == 'EthernalReader') {
    param = []
  }

  if (param.length != 0) {
    return '"' + param.join('" "') + '"'
  }
  return ''
}

function verify(i, contractName, contractAddress) {
  const length = contractName.length
  if (i == length) {
    isDone = true
    return
  }

  const name = contractName[i]
  const address = contractAddress[i]

  const params = makeParameter(name)
  const cmd = `npx hardhat verify ${address} ${params} --network ${network}`
  console.log(`🚀 [${i + 1}/${length} ${name}] ${cmd}`)

  exec(cmd, (error, stdout, stderr) => {
    if (stdout.indexOf('Successfully submitted') != -1) {
      console.log(`✅ verified: ${stdout}`)
    } else {
      if (error || stderr) {
        const errMsg = error ? error.message : stderr ? stderr : ''
        if (errMsg.indexOf('Smart-contract already verified.') == -1) {
          console.log(`❌ error: ${errMsg}`)
          errors.push(`[${contractName[i]} - ${contractAddress[i]}]: ${errMsg}`)
        } else {
          console.log(`✅ skip verified: ${errMsg}`)
        }
      }
      console.log(`${stdout}`)
    }

    // recursive
    verify(i + 1, contractName, contractAddress)
  })
}

async function main() {
  const contractName = Object.keys(deployedAddress)
  const contractAddress = Object.values(deployedAddress)
  // recursive verify
  const start = 0
  verify(start, contractName, contractAddress)

  // wait for all done
  while (!isDone) {
    await sleep(1000)
  }

  console.log(`🌈 Done.`)
  if (errors.length > 0) {
    console.log(`❌ verify error: ${errors.length}`)
    errors.map((err) => console.log(err))
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
