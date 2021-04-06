import { Address } from '@graphprotocol/graph-ts'
import { Token } from "./../types/schema"
import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  ZERO_BD,
  ZERO_BI
} from './helpers'
import {
  WETH_ADDRESS, ETH_ADDRESS
} from './addresses'

export function getToken(address: Address): Token {
  let token = Token.load(address.toHex())

  if (token === null) {
    token = new Token(address.toHex())
    token.symbol = fetchTokenSymbol(address)
    token.name = fetchTokenName(address)
    token.decimals = fetchTokenDecimals(address)
    token.volume = ZERO_BD
    token.volumeETH = ZERO_BD
    token.volumeUSD = ZERO_BD
    token.txCount = ZERO_BI
    token.save()
  }

  return token as Token
}

export function isETH(token: Token): boolean {
  return token.id == WETH_ADDRESS || token.id == ETH_ADDRESS
}