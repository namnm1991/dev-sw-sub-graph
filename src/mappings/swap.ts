import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import {
  KyberTrade,
  KyberTradeAndDeposit,
  KyberTradeAndRepay,
  UniswapTrade,
  UniswapTradeAndDeposit,
  UniswapTradeAndRepay,
  WithdrawFromLending
} from "./../types/Swap/Swap"
import { Swap, ExampleEntity, FeeDistributed, Token } from "./../types/schema"
import {
  convertTokenToDecimal,
  convertEthToDecimal,
  convertEthToGwei,
  ONE_BI,
  ZERO_BI
} from './helpers'
import { getToken } from './token'
import { getUser } from './user'
import { getCounter } from './counter'
import { getEthPriceInUSD, getTokenInEth, getTokenPriceInEthKN } from './pricing'
import { getDayData, getTokenDayData } from "./stats"


export function handleKyberTrade(event: KyberTrade): void {
  let src = getToken(event.params.src)
  let dst = getToken(event.params.dest)

  let srcAmount = convertTokenToDecimal(event.params.srcAmount, src.decimals)
  let srcAmountInEth = getTokenPriceInEthKN(src, event.params.srcAmount).times(srcAmount)

  let dstAmount = convertTokenToDecimal(event.params.destAmount, dst.decimals)
  let dstAmountInEth = getTokenPriceInEthKN(dst, event.params.destAmount).times(dstAmount)

  let amountETH = srcAmountInEth.plus(dstAmountInEth).div(BigDecimal.fromString('2'))
  let ethPrice = getEthPriceInUSD();

  let swap = new Swap(event.transaction.hash.toHex())
  swap.user = event.params.trader.toHex()
  swap.timestamp = event.block.timestamp
  swap.trader = event.params.trader
  swap.src = src.id
  swap.srcAmount = srcAmount
  swap.dst = dst.id
  swap.dstAmount = dstAmount
  swap.amountETH = amountETH
  swap.amountUSD = amountETH.times(ethPrice)
  swap.recipient = event.params.recipient
  swap.gasPrice = convertEthToGwei(event.transaction.gasPrice)
  swap.gasUsed = convertEthToDecimal(event.transaction.gasUsed)
  swap.platform = "KyberNetwork"
  swap.platformFeeBps = event.params.platformFeeBps
  swap.platformFeeWallet = event.params.platformWallet

  let feeDistributed = FeeDistributed.load(event.transaction.hash.toHex())
  if (feeDistributed != null) {
    let feeToken = getToken(Address.fromString(feeDistributed.token))
    swap.feeToken = feeToken.id
    swap.feeAmount = convertTokenToDecimal(feeDistributed.platformFeeWei, feeToken.decimals)
    swap.feeAmountInETH = swap.feeAmount
  }

  swap.save()

  handleSwap(swap)
}

export function handleUniswapTrade(event: UniswapTrade): void {
  let tradePath = event.params.tradePath;
  let src = getToken(tradePath[0]);
  let dst = getToken(tradePath[tradePath.length - 1]);

  let srcAmountInEth = getTokenInEth(src, event.params.srcAmount);
  let dstAmountInEth = getTokenInEth(dst, event.params.destAmount);
  let amountETH = srcAmountInEth.plus(dstAmountInEth).div(BigDecimal.fromString('2'));
  let ethPrice = getEthPriceInUSD();

  let swap = new Swap(event.transaction.hash.toHex());
  swap.user = event.params.trader.toHex();
  swap.timestamp = event.block.timestamp;
  swap.trader = event.params.trader;
  swap.src = src.id;
  swap.srcAmount = convertTokenToDecimal(event.params.srcAmount, src.decimals);
  swap.dst = dst.id;
  swap.dstAmount = convertTokenToDecimal(event.params.destAmount, dst.decimals);
  swap.amountETH = amountETH;
  swap.amountUSD = amountETH.times(ethPrice);
  swap.recipient = event.params.recipient;
  swap.gasPrice = convertEthToGwei(event.transaction.gasPrice);
  swap.gasUsed = convertEthToDecimal(event.transaction.gasUsed);
  swap.platform = "Uniswap"
  swap.platformFeeBps = event.params.platformFeeBps
  swap.platformFeeWallet = event.params.platformWallet

  // because the amount in event is fee deducted 
  let feeRatio = swap.platformFeeBps.toBigDecimal().div(
    BigInt.fromI32(10000).minus(swap.platformFeeBps).toBigDecimal()
  )

  if (event.params.feeInSrc) {
    swap.feeToken = src.id
    swap.feeAmount = swap.srcAmount.times(feeRatio)
    swap.feeAmountInETH = srcAmountInEth.times(feeRatio)
  } else {
    swap.feeToken = dst.id
    swap.feeAmount = swap.dstAmount.times(feeRatio)
    swap.feeAmountInETH = dstAmountInEth.times(feeRatio)
  }

  swap.save()

  handleSwap(swap)
}

function handleSwap(swap: Swap): void {
  let user = getUser(Address.fromString(swap.user))
  let counter = getCounter()
  counter.txCount = counter.txCount.plus(ONE_BI)
  counter.totalVolumeETH = counter.totalVolumeETH.plus(swap.amountETH as BigDecimal)
  counter.totalVolumeUSD = counter.totalVolumeUSD.plus(swap.amountUSD as BigDecimal)
  if (user.txCount.equals(ZERO_BI)) {
    counter.totalUser = counter.totalUser.plus(ONE_BI)
  }
  counter.save()

  user.txCount = user.txCount.plus(ONE_BI)
  user.save()

  let dayData = getDayData(swap.timestamp)
  dayData.txCount = dayData.txCount.plus(ONE_BI)
  dayData.volumeETH = dayData.volumeETH.plus(swap.amountETH as BigDecimal)
  dayData.volumeUSD = dayData.volumeUSD.plus(swap.amountUSD as BigDecimal)
  dayData.save()

  let src = getToken(Address.fromString(swap.src))
  src.txCount = src.txCount.plus(ONE_BI)
  src.volume = src.volume.plus(swap.srcAmount)
  src.volumeETH = src.volumeETH.plus(swap.amountETH as BigDecimal)
  src.volumeUSD = src.volumeUSD.plus(swap.amountUSD as BigDecimal)
  src.save()

  let srcDayData = getTokenDayData(src, swap.timestamp)
  srcDayData.txCount = srcDayData.txCount.plus(ONE_BI)
  srcDayData.volumeToken = srcDayData.volumeToken.plus(swap.srcAmount)
  srcDayData.volumeETH = srcDayData.volumeETH.plus(swap.amountETH as BigDecimal)
  srcDayData.volumeUSD = srcDayData.volumeUSD.plus(swap.amountUSD as BigDecimal)
  srcDayData.save()

  let dst = getToken(Address.fromString(swap.dst))
  dst.txCount = dst.txCount.plus(ONE_BI)
  dst.volume = dst.volume.plus(swap.dstAmount)
  dst.volumeETH = dst.volumeETH.plus(swap.amountETH as BigDecimal)
  dst.volumeUSD = dst.volumeUSD.plus(swap.amountUSD as BigDecimal)
  dst.save()

  let dstDayData = getTokenDayData(dst, swap.timestamp)
  dstDayData.txCount = dstDayData.txCount.plus(ONE_BI)
  dstDayData.volumeToken = dstDayData.volumeToken.plus(swap.srcAmount)
  dstDayData.volumeETH = dstDayData.volumeETH.plus(swap.amountETH as BigDecimal)
  dstDayData.volumeUSD = dstDayData.volumeUSD.plus(swap.amountUSD as BigDecimal)
  dstDayData.save()
}

export function handleKyberTradeTmpl(event: KyberTrade): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.trader = event.params.trader
  entity.src = event.params.src

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.getExpectedReturnKyber(...)
  // - contract.getExpectedReturnUniswap(...)
  // - contract.withdrawFromLendingPlatform(...)
}

export function handleKyberTradeAndDeposit(event: KyberTradeAndDeposit): void {
  let src = getToken(event.params.src)
  let dst = getToken(event.params.dest)
  // it's deposit only
  if (src.id == dst.id) {
    return
  }

  let srcAmount = convertTokenToDecimal(event.params.srcAmount, src.decimals)
  let srcAmountInEth = getTokenPriceInEthKN(src, event.params.srcAmount).times(srcAmount)

  let dstAmount = convertTokenToDecimal(event.params.destAmount, dst.decimals)
  let dstAmountInEth = getTokenPriceInEthKN(dst, event.params.destAmount).times(dstAmount)

  let amountETH = srcAmountInEth.plus(dstAmountInEth).div(BigDecimal.fromString('2'))
  let ethPrice = getEthPriceInUSD()

  let swap = new Swap(event.transaction.hash.toHex())
  swap.user = event.params.trader.toHex()
  swap.timestamp = event.block.timestamp
  swap.trader = event.params.trader
  swap.src = src.id;
  swap.srcAmount = convertTokenToDecimal(event.params.srcAmount, src.decimals);
  swap.dst = dst.id;
  swap.dstAmount = dstAmount
  swap.amountETH = amountETH
  swap.amountUSD = amountETH.times(ethPrice)
  swap.recipient = event.params.trader
  swap.gasPrice = convertEthToGwei(event.transaction.gasPrice)
  swap.gasUsed = convertEthToDecimal(event.transaction.gasUsed)
  swap.platform = "KyberNetwork"
  swap.platformFeeBps = event.params.platformFeeBps
  swap.platformFeeWallet = event.params.platformWallet


  let feeDistributed = FeeDistributed.load(event.transaction.hash.toHex())
  if (feeDistributed != null) {
    let feeToken = getToken(Address.fromString(feeDistributed.token))
    swap.feeToken = feeToken.id
    swap.feeAmount = convertTokenToDecimal(feeDistributed.platformFeeWei, feeToken.decimals)
    swap.feeAmountInETH = swap.feeAmount
  }

  swap.save()

  handleSwap(swap)
}

export function handleKyberTradeAndRepay(event: KyberTradeAndRepay): void { }

export function handleUniswapTradeAndDeposit(event: UniswapTradeAndDeposit): void {
  let tradePath = event.params.tradePath;
  let src = getToken(tradePath[0]);
  let dst = getToken(tradePath[tradePath.length - 1]);

  // it's deposit only
  if (src.id == dst.id) {
    return
  }

  let srcAmountInEth = getTokenInEth(src, event.params.srcAmount);
  let dstAmountInEth = getTokenInEth(dst, event.params.destAmount);
  let amountETH = srcAmountInEth.plus(dstAmountInEth).div(BigDecimal.fromString('2'));
  let ethPrice = getEthPriceInUSD();

  let swap = new Swap(event.transaction.hash.toHex());
  swap.user = event.params.trader.toHex();
  swap.timestamp = event.block.timestamp;
  swap.trader = event.params.trader;
  swap.src = src.id;
  swap.srcAmount = convertTokenToDecimal(event.params.srcAmount, src.decimals);
  swap.dst = dst.id;
  swap.dstAmount = convertTokenToDecimal(event.params.destAmount, dst.decimals);
  swap.amountETH = amountETH;
  swap.amountUSD = amountETH.times(ethPrice);
  swap.recipient = event.params.trader;
  swap.gasPrice = convertEthToGwei(event.transaction.gasPrice);
  swap.gasUsed = convertEthToDecimal(event.transaction.gasUsed);
  swap.platform = "Uniswap"
  swap.platformFeeBps = event.params.platformFeeBps
  swap.platformFeeWallet = event.params.platformWallet

  {
    swap.feeToken = dst.id
    let feeRatio = swap.platformFeeBps.toBigDecimal().div(
      BigInt.fromI32(10000).minus(swap.platformFeeBps).toBigDecimal()
    )
    // deposit take fee in dst token
    swap.feeAmount = swap.dstAmount.times(feeRatio)
    swap.feeAmountInETH = dstAmountInEth.times(feeRatio)
  }

  swap.save()

  handleSwap(swap)
}

export function handleUniswapTradeAndRepay(event: UniswapTradeAndRepay): void { }

export function handleWithdrawFromLending(event: WithdrawFromLending): void { }
