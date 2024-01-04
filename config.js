const { toWei } = require('./scripts/lib/helper')

const networkId = {
  bscTestnet: 97,
  develop: 1112,
}

const tokenIndexes = {
  // Default xOracle Pricefeed
  BTC: 0,
  ETH: 1,
  BNB: 2,
  USDT: 3,
  USDC: 5,

  // Additional for Ethernal Passive Yield Token
  EBTC: 100,
  EETH: 101,
  EBNB: 102,
  EUSDT: 103,
  EUSDC: 105,
}

const config = {
  chains: {},
  pairTokenIndexes: [
    [tokenIndexes.BTC, tokenIndexes.BTC],
    [tokenIndexes.BTC, tokenIndexes.EBTC],
    [tokenIndexes.ETH, tokenIndexes.ETH],
    [tokenIndexes.ETH, tokenIndexes.EETH],
    [tokenIndexes.BNB, tokenIndexes.BNB],
    [tokenIndexes.BNB, tokenIndexes.EBNB],
    [tokenIndexes.USDT, tokenIndexes.USDT],
    [tokenIndexes.USDT, tokenIndexes.EUSDT],
    [tokenIndexes.USDC, tokenIndexes.USDC],
    [tokenIndexes.USDC, tokenIndexes.EUSDC],
  ]
}

config.chains[networkId.bscTestnet] = {
  xOracleMessage: '0xf533C443902dDb3a385c81aC2dC199B1c612FD0c',
  ethernalBridge: '0xacAB7bEF345c5ecA5377D522Dc8CC5bCD323c5fC',
  vaultTokens: [
    {
      type: 'VaultVenus',
      name: 'BTC',
      tokenIndex: tokenIndexes.BTC,
      tokenName: 'btc',
      minDeposit: toWei(`0.00005`),
      ibToken: '0xfBE6A47711Dbc631693471cDE3e9ee7665ED6381',
    },
    {
      type: 'VaultVenus',
      name: 'ETH',
      tokenIndex: tokenIndexes.ETH,
      tokenName: 'eth',
      minDeposit: toWei(`0.001`),
      ibToken: '0x601e29eD938f382c345A22f3F28196d633649E9c',
    },
    {
      type: 'VaultVenusBNB',
      name: 'BNB',
      tokenIndex: tokenIndexes.BNB,
      tokenName: 'bnb',
      minDeposit: toWei(`0.008`),
      ibToken: '0x8F55d2beFC176e69893b9B75AA360524AF514CD9',
    },
    {
      type: 'VaultVenus',
      name: 'USDT',
      tokenIndex: tokenIndexes.USDT,
      tokenName: 'usdt',
      minDeposit: toWei(`1`),
      ibToken: '0xd5310625A687c802f6247f605F8334C33BE499ea',
    },
    {
      type: 'VaultVenus',
      name: 'USDC',
      tokenIndex: tokenIndexes.USDC,
      tokenName: 'usdc',
      minDeposit: toWei(`1`),
      ibToken: '0x280DCe8413fE8986BD38C3f08f1883526E38B857',
    },
  ],
}

config.chains[networkId.develop] = {
  xOracleMessage: '0xccCd5c5D4e3d2F85d07f041759B96f8b8A622056',
  ethernalBridge: '0x60f10f8f8b36522E5E543d9D074280777F9e8061',
  vaultTokens: [
    {
      type: 'VaultMintable',
      name: 'BTC',
      tokenIndex: tokenIndexes.BTC,
      tokenName: 'btc',
      minDeposit: toWei(`0.00005`),
    },
    {
      type: 'VaultMintable',
      name: 'ETH',
      tokenIndex: tokenIndexes.ETH,
      tokenName: 'eth',
      minDeposit: toWei(`0.001`),
    },
    {
      type: 'VaultMintable',
      name: 'BNB',
      tokenIndex: tokenIndexes.BNB,
      tokenName: 'bnb',
      minDeposit: toWei(`0.008`),
    },
    {
      type: 'VaultMintable',
      name: 'USDT',
      tokenIndex: tokenIndexes.USDT,
      tokenName: 'usdt',
      minDeposit: toWei(`1`),
    },
    {
      type: 'VaultMintable',
      name: 'USDC',
      tokenIndex: tokenIndexes.USDC,
      tokenName: 'usdc',
      minDeposit: toWei(`1`),
    },
    {
      type: 'VaultEthernal',
      name: 'EBTC',
      tokenIndex: tokenIndexes.EBTC,
      tokenName: 'btc',
      minDeposit: toWei(`0.00005`),
      reserveTokenIndex: tokenIndexes.BTC,
      ethernalTokenName: 'ebtc',
    },
    {
      type: 'VaultEthernal',
      name: 'EETH',
      tokenIndex: tokenIndexes.EETH,
      tokenName: 'eth',
      minDeposit: toWei(`0.001`),
      reserveTokenIndex: tokenIndexes.ETH,
      ethernalTokenName: 'eeth',
    },
    {
      type: 'VaultEthernal',
      name: 'EBNB',
      tokenIndex: tokenIndexes.EBNB,
      tokenName: 'bnb',
      minDeposit: toWei(`0.008`),
      reserveTokenIndex: tokenIndexes.BNB,
      ethernalTokenName: 'ebnb',
    },
    {
      type: 'VaultEthernal',
      name: 'EUSDT',
      tokenIndex: tokenIndexes.EUSDT,
      tokenName: 'usdt',
      minDeposit: toWei(`1`),
      reserveTokenIndex: tokenIndexes.USDT,
      ethernalTokenName: 'eusdt',
    },
    {
      type: 'VaultEthernal',
      name: 'EUSDC',
      tokenIndex: tokenIndexes.EUSDC,
      tokenName: 'usdc',
      minDeposit: toWei(`1`),
      reserveTokenIndex: tokenIndexes.USDC,
      ethernalTokenName: 'eusdc',
    },
  ],
}

module.exports = { networkId, config, tokenIndexes }
