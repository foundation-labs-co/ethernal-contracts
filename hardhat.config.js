require('dotenv').config()
require('@nomicfoundation/hardhat-verify')
require('@nomiclabs/hardhat-waffle')
require('solidity-coverage')
require('@nomiclabs/hardhat-web3')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://data-seed-prebsc-1-s2.bnbchain.org:8545`,
      },
    },
    bsc: {
      url: `https://bsc-dataseed1.binance.org`,
      chainId: 56,
      gasPrice: 3 * 10 ** 9,
      // accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s2.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 10 * 10**9,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    develop: {
      url: `https://develop-chain.0xnode.cloud/`,
      chainId: 1112,
      gasPrice: 1 * 10 ** 9,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    holesky: {
      url: `https://ethereum-holesky.publicnode.com`,
      chainId: 17000,
      gasPrice: 3 * 10 ** 9,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      develop: `${process.env.DEVELOP_APIKEY}`,
    },
    customChains: [
      {
        network: 'develop',
        chainId: 1112,
        urls: {
          apiURL: 'https://develop-chain-explorer.0xnode.cloud/api',
          browserURL: 'https://develop-chain-explorer.0xnode.cloud/',
        },
      },
    ],
  },
  sourcify: {
    enabled: false
  },
  mocha: {
    timeout: 500000,
  },
}
