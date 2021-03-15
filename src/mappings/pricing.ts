import { BigDecimal, Address, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { UniswapRouter } from '../types/Swap/UniswapRouter';
import { KyberNetwork } from '../types/Swap/KyberNetwork';

import { ZERO_BD, ONE_BD, ZERO_BI, convertTokenToDecimal, convertEthToDecimal } from './helpers';
import { Token } from "../types/schema"
import { getToken } from './token';

let addresses = new Map<string, string>();
if (dataSource.network() == 'ropsten') {
  addresses.set('kn', '0xd719c34261e099Fdb33030ac8909d5788D3039C4')
  addresses.set('weth', '0xd719c34261e099Fdb33030ac8909d5788D3039C4')
  addresses.set('dai', '0xd719c34261e099Fdb33030ac8909d5788D3039C4')
  addresses.set('usdc', '0x0d9c8723b343a8368bebe0b5e89273ff8d712e3c')
  addresses.set('usdt', '0x516de3a7a567d81737e3a46ec4ff9cfd1fcb0136')
} else {
  addresses.set('kn', '0x9AAb3f75489902f3a48495025729a0AF77d4b11e')
  addresses.set('weth', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
  addresses.set('dai', '0x6b175474e89094c44da98b954eedeac495271d0f')
  addresses.set('usdc', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
  addresses.set('usdt', '0xdac17f958d2ee523a2206206994597c13d831ec7')
}

const ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const KYBER_NETWORK_ADDRESS = addresses.get('kn');

const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const WETH_ADDRESS = addresses.get('weth')
const DAI_ADDRESS = addresses.get('dai')
const USDC_ADDRESS = addresses.get('usdc')
const USDT_ADDRESS = addresses.get('usdt')

// const USDC_ADDRESS = '0x0d9c8723b343a8368bebe0b5e89273ff8d712e3c'
// const USDT_ADDRESS = '0x516de3a7a567d81737e3a46ec4ff9cfd1fcb0136'

// const USDC_WETH_PAIR = '0xbc30aaa8e99d0f0e435fc938034850c2fc77f753' // ropsten: created 8387856, 102 txs
// const DAI_WETH_PAIR = '0x1c5dee94a34d795f9eeef830b68b80e44868d316' // ropsten: created block 8061295, 819 txs
// const USDT_WETH_PAIR = '0x230c4c6de893f369920a94bd354589ea1a8bcafd' // ropsten: created block 8188096, 283 txs

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  WETH_ADDRESS, // WETH
  DAI_ADDRESS, // DAI
  USDC_ADDRESS, // USDC
  USDT_ADDRESS, // USDT
]

let uniswapRouter = UniswapRouter.bind(Address.fromString(ROUTER_ADDRESS))
let kyberNetwork = KyberNetwork.bind(Address.fromString(KYBER_NETWORK_ADDRESS));

export function getTokenPriceInEthKN(token: Token, amount: BigInt): BigDecimal {
  if (token.id == WETH_ADDRESS || token.id == ETH_ADDRESS) {
    return ONE_BD
  }
  let rates = kyberNetwork.getExpectedRate(Address.fromString(token.id), Address.fromString(ETH_ADDRESS), amount)
  return convertEthToDecimal(rates.value0)
}

function getAmountOut(amountIn: BigInt, path: Array<Address>): BigInt {
  let amountsOut = uniswapRouter.try_getAmountsOut(amountIn, path);
  if (amountsOut.reverted) {
    return ZERO_BI
  }
  let amounts = amountsOut.value;
  return amounts[amounts.length - 1];
}

// TODO: combine eth price with stable coin (DAI, USDC, USDT)
export function getEthPriceInUSD(): BigDecimal {
  let ethAmount = BigInt.fromI32(10).pow(18);
  let dai = getToken(Address.fromString(DAI_ADDRESS));
  let daiPath: Array<Address> = [Address.fromString(WETH_ADDRESS), Address.fromString(DAI_ADDRESS)];
  let daiAmount = getAmountOut(ethAmount, daiPath);
  return convertTokenToDecimal(daiAmount, dai.decimals);
}

export function getTokenInEth(token: Token, amount: BigInt): BigDecimal {
  if (token.id == WETH_ADDRESS || token.id == ETH_ADDRESS) {
    return convertEthToDecimal(amount)
  }

  let path: Array<Address> = [Address.fromString(token.id), Address.fromString(WETH_ADDRESS)];
  let amountOut = getAmountOut(amount, path);

  if (amountOut != ZERO_BI) {
    return convertEthToDecimal(amountOut);
  }

  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    path = [Address.fromString(token.id), Address.fromString(WHITELIST[i]), Address.fromString(WETH_ADDRESS)]
    amountOut = getAmountOut(amount, path);

    if (amountOut != ZERO_BI) {
      return convertEthToDecimal(amountOut);
    }
  }

  return ZERO_BD
}
