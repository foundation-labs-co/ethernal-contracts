const { toWei } = require('./scripts/lib/helper')

const networkId = {
  lineaTestnet: 59140,
  develop: 1112,
}

const tokenIndexs = {
  BTC: 0,
  ETH: 1,
  BNB: 2,
  USDT: 3,
  BUSD: 4,
  USDC: 5,
  // DAI: 6,
  // XRP: 10,
  // DOGE: 11,
  // TRX: 12,
  // ADA: 20,
  MATIC: 21,
  // SOL: 22,
  // DOT: 23,
  // AVAX: 24,
  // FTM: 25,
  // NEAR: 26,
  // ATOM: 27,
  OP: 28,
  ARB: 29,

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
      tokenIndex: tokenIndexs.BTC,
      tokenName: 'btc',
      minDeposit: toWei(`0.00005`),
    },
    {
      type: 'VaultMintable',
      name: 'ETH',
      tokenIndex: tokenIndexs.ETH,
      tokenName: 'eth',
      minDeposit: toWei(`0.001`),
    },
    {
      type: 'VaultMintable',
      name: 'BNB',
      tokenIndex: tokenIndexs.BNB,
      tokenName: 'bnb',
      minDeposit: toWei(`0.008`),
    },
    {
      type: 'VaultMintable',
      name: 'USDT',
      tokenIndex: tokenIndexs.USDT,
      tokenName: 'usdt',
      minDeposit: toWei(`1`),
    },
    {
      type: 'VaultMintable',
      name: 'USDC',
      tokenIndex: tokenIndexs.USDC,
      tokenName: 'usdc',
      minDeposit: toWei(`1`),
    },
    {
      type: 'VaultEthernal',
      name: 'EBTC',
      tokenIndex: tokenIndexs.EBTC,
      tokenName: 'btc',
      minDeposit: toWei(`0.00005`),
      reserveTokenIndex: tokenIndexs.BTC,
      ethernalTokenName: 'ebtc',
    },
    {
      type: 'VaultEthernal',
      name: 'EETH',
      tokenIndex: tokenIndexs.EETH,
      tokenName: 'eth',
      minDeposit: toWei(`0.001`),
      reserveTokenIndex: tokenIndexs.ETH,
      ethernalTokenName: 'eusdt',
    },
    {
      type: 'VaultEthernal',
      name: 'EBNB',
      tokenIndex: tokenIndexs.EBNB,
      tokenName: 'bnb',
      minDeposit: toWei(`0.008`),
      reserveTokenIndex: tokenIndexs.BNB,
      ethernalTokenName: 'ebnb',
    },
    {
      type: 'VaultEthernal',
      name: 'EUSDT',
      tokenIndex: tokenIndexs.EUSDT,
      tokenName: 'usdt',
      minDeposit: toWei(`1`),
      reserveTokenIndex: tokenIndexs.USDT,
      ethernalTokenName: 'eusdt',
    },
    {
      type: 'VaultEthernal',
      name: 'EUSDC',
      tokenIndex: tokenIndexs.EUSDC,
      tokenName: 'usdc',
      minDeposit: toWei(`1`),
      reserveTokenIndex: tokenIndexs.USDC,
      ethernalTokenName: 'eusdc',
    },
  ],
}

module.exports = { networkId, config }
