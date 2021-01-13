import { Counter } from "../types/schema"
import { ZERO_BD, ZERO_BI } from "./helpers"

export function getCounter(): Counter {
  let counter = Counter.load('1')

  if (counter === null) {
    counter = new Counter('1')
    counter.txCount = ZERO_BI
    counter.totalVolumeETH = ZERO_BD
    counter.totalVolumeUSD = ZERO_BD
    counter.save()
  }

  return counter as Counter
}