const { toWei } = require('./scripts/lib/helper')

const networkId = {
  bscTestnet: 97,
  develop: 1112,
}

const tokenIndexes = {
  BTC: 0,
  ETH: 1,
  BNB: 2,
  USDT: 3,
  // BUSD: 4,
  USDC: 5,
  // DAI: 6,
  // XRP: 10,
  // DOGE: 11,
  // TRX: 12,
  // ADA: 20,
  // MATIC: 21,
  // SOL: 22,
  // DOT: 23,
  // AVAX: 24,
  // FTM: 25,
  // NEAR: 26,
  // ATOM: 27,
  // OP: 28,
  // ARB: 29,

  // Ethernal Passive Yield Token
  EBTC: 100,
  EETH: 101,
  EBNB: 102,
  EUSDT: 103,
  EUSDC: 105,
}

const config = {
  chains: {},
}

config.chains[networkId.bscTestnet] = {
  xOracleMessage: '0xf533C443902dDb3a385c81aC2dC199B1c612FD0c',
  ethernalBridge: '0xb6f122919E09849a55fb5ab7977d6078cC749bF3',
  vaultTokens: [
    {
      type: 'VaultVenus',
      name: 'BTC',
      tokenIndex: tokenIndexes.BTC,
      tokenName: 'btc',
      minDeposit: toWei(`0.00005`),
      ibToken: '0x5BbDF7bf9e62d0A2E3e23d1828e2559A371612d1',
    },
    {
      type: 'VaultVenus',
      name: 'ETH',
      tokenIndex: tokenIndexes.ETH,
      tokenName: 'eth',
      minDeposit: toWei(`0.001`),
      ibToken: '0xD8F80AbeA5F19b67f7BA092E4968728f965CCB72',
    },
    {
      type: 'VaultVenusBNB',
      name: 'BNB',
      tokenIndex: tokenIndexes.BNB,
      tokenName: 'bnb',
      minDeposit: toWei(`0.008`),
      ibToken: '0x1Dd62a284c7eFb92873EC47696Fd4402037b8817',
    },
    {
      type: 'VaultVenus',
      name: 'USDT',
      tokenIndex: tokenIndexes.USDT,
      tokenName: 'usdt',
      minDeposit: toWei(`1`),
      ibToken: '0x5438490cedE2D3a1b20646b9F42925bf9BB20C71',
    },
    {
      type: 'VaultVenus',
      name: 'USDC',
      tokenIndex: tokenIndexes.USDC,
      tokenName: 'usdc',
      minDeposit: toWei(`1`),
      ibToken: '0xdAbe894f8A61e16330fb77D803A25F49A20b271E',
    },
  ],
}

config.chains[networkId.develop] = {
  xOracleMessage: '0xccCd5c5D4e3d2F85d07f041759B96f8b8A622056',
  ethernalBridge: '0xc2a79b020243Ce9E57CC05453D9EFE99F645F61E',
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
