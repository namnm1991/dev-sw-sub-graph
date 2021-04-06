import { BigDecimal, Address, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { UniswapRouter } from '../types/Swap/UniswapRouter';
import { KyberNetwork } from '../types/Swap/KyberNetwork';

import { ZERO_BD, ONE_BD, ZERO_BI, convertTokenToDecimal, convertEthToDecimal } from './helpers';
import { Token } from "../types/schema"
import { getToken, isETH } from './token';
import { ROUTER_ADDRESS, KYBER_NETWORK_ADDRESS, ETH_ADDRESS, WETH_ADDRESS, DAI_ADDRESS, USDC_ADDRESS, USDT_ADDRESS } from './addresses'

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
  if (isETH(token)) {
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