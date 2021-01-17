import { BigInt } from '@graphprotocol/graph-ts';
import { DayData, Token, TokenDayData } from './../types/schema'
import { ZERO_BD, ZERO_BI } from './helpers'

const SECONDS_IN_DAY = 86400

export function getDayData(timestamp: BigInt): DayData {
  let id = timestamp.toI32() / SECONDS_IN_DAY

  let dayData = DayData.load(id.toString())

  if (dayData === null) {
    dayData = new DayData(id.toString())
    dayData.volumeETH = ZERO_BD
    dayData.volumeUSD = ZERO_BD
    dayData.txCount = ZERO_BI
    dayData.date = id * SECONDS_IN_DAY
    dayData.save()
  }
  return dayData as DayData
}

export function getTokenDayData(token: Token, timestamp: BigInt): TokenDayData {
  let day = timestamp.toI32() / SECONDS_IN_DAY
  let id = token.id.concat('-').concat(day.toString())

  let tokenDayData = TokenDayData.load(id)

  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(id)
    tokenDayData.date = day * SECONDS_IN_DAY
    tokenDayData.token = token.id
    tokenDayData.volumeToken = ZERO_BD
    tokenDayData.volumeETH = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.txCount = ZERO_BI
    tokenDayData.save()
  }

  return tokenDayData as TokenDayData
}