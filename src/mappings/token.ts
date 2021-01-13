import { Address } from '@graphprotocol/graph-ts'
import { Token } from "./../types/schema"
import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  ZERO_BD,
  ZERO_BI
} from './helpers'

export function getToken(address: Address): Token {
  let token = Token.load(address.toHex())

  if (token === null) {
    token = new Token(address.toHex())
    token.symbol = fetchTokenSymbol(address)
    token.name = fetchTokenName(address)
    token.decimals = fetchTokenDecimals(address)
    token.volume = ZERO_BD
    token.volumeUSD = ZERO_BD
    token.txCount = ZERO_BI
    token.save()
  }

  return token as Token
}