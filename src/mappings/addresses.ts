import { dataSource } from '@graphprotocol/graph-ts';

let addresses = new Map<string, string>();
if (dataSource.network() == 'ropsten') {
  addresses.set('kn', '0xd719c34261e099Fdb33030ac8909d5788D3039C4')
  addresses.set('weth', '0xc778417E063141139Fce010982780140Aa0cD5Ab')
  addresses.set('dai', '0xad6d458402f60fd3bd25163575031acdce07538d')
  addresses.set('usdc', '0x851def71f0e6a903375c1e536bd9ff1684bad802')
  addresses.set('usdt', '0x2a555b1cb74025c3decccedaa9b469ff7efe60d3')
} else {
  addresses.set('kn', '0x9AAb3f75489902f3a48495025729a0AF77d4b11e')
  addresses.set('weth', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
  addresses.set('dai', '0x6b175474e89094c44da98b954eedeac495271d0f')
  addresses.set('usdc', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
  addresses.set('usdt', '0xdac17f958d2ee523a2206206994597c13d831ec7')
}

export const ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
export const KYBER_NETWORK_ADDRESS = addresses.get('kn');

export const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const WETH_ADDRESS = addresses.get('weth')
export const DAI_ADDRESS = addresses.get('dai')
export const USDC_ADDRESS = addresses.get('usdc')
export const USDT_ADDRESS = addresses.get('usdt')