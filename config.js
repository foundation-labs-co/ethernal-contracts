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

  // Ethernal Wrap Yield Token
  EBTC: 100,
  EETH: 101,
  EBNB: 102,
  EUSDT: 103,
  EUSDC: 105,
}

const config = {
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
