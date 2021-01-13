import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import {
  KyberTrade,
  KyberTradeAndDeposit,
  KyberTradeAndRepay,
  UniswapTrade,
  UniswapTradeAndDeposit,
  UniswapTradeAndRepay,
  WithdrawFromLending
} from "./../types/Swap/Swap"
import { Swap, ExampleEntity } from "./../types/schema"
import {
  convertTokenToDecimal,
  convertEthToDecimal,
  convertEthToGwei,
} from './helpers'
import { getToken } from './token'
import { getUser } from './user'
import { getCounter } from './counter'
import { getEthPriceInUSD, getTokenPriceInEth, getTokenPriceInEthKN } from './pricing'


export function handleKyberTrade(event: KyberTrade): void {
  let user = getUser(event.params.trader);

  // create the tokens
  let src = getToken(event.params.src);
  let dst = getToken(event.params.dest);

  let srcAmountInEth = getTokenPriceInEthKN(src, event.params.srcAmount);
  let dstAmountInEth = getTokenPriceInEthKN(dst, event.params.destAmount);
  let amountETH = srcAmountInEth.plus(dstAmountInEth).div(BigDecimal.fromString('2'));
  let ethPrice = getEthPriceInUSD();

  let counter = getCounter();
  counter.txCount = counter.txCount.plus(BigInt.fromI32(1));
  counter.totalVolumeETH = counter.totalVolumeETH.plus(amountETH);
  counter.totalVolumeUSD = counter.totalVolumeUSD.plus(amountETH.times(ethPrice));
  counter.save()

  let swap = new Swap(event.transaction.hash.toHexString());
  swap.user = user.id;
  swap.timestamp = event.block.timestamp;
  swap.trader = event.params.trader;
  swap.src = src.id;
  swap.srcAmount = convertTokenToDecimal(event.params.srcAmount, src.decimals);
  swap.dst = dst.id;
  swap.dstAmout = convertTokenToDecimal(event.params.destAmount, dst.decimals);
  swap.amountETH = amountETH
  swap.amountUSD = amountETH.times(ethPrice);
  swap.recipient = event.params.recipient;
  swap.gasPrice = convertEthToGwei(event.transaction.gasPrice);
  swap.gasUsed = convertEthToDecimal(event.transaction.gasUsed);
  swap.save();
}

export function handleUniswapTrade(event: UniswapTrade): void {
  let user = getUser(event.params.trader);

  // create the tokens
  let tradePath = event.params.tradePath;
  let src = getToken(tradePath[0]);
  let dst = getToken(tradePath[tradePath.length - 1]);

  let srcAmountInEth = getTokenPriceInEth(src, event.params.srcAmount);
  let dstAmountInEth = getTokenPriceInEth(dst, event.params.destAmount);
  let amountETH = srcAmountInEth.plus(dstAmountInEth).div(BigDecimal.fromString('2'));
  let ethPrice = getEthPriceInUSD();

  let counter = getCounter();
  counter.txCount = counter.txCount.plus(BigInt.fromI32(1));
  counter.totalVolumeETH = counter.totalVolumeETH.plus(amountETH);
  counter.totalVolumeUSD = counter.totalVolumeUSD.plus(amountETH.times(ethPrice));
  counter.save()

  let swap = new Swap(event.transaction.hash.toHexString());
  swap.user = user.id;
  swap.timestamp = event.block.timestamp;
  swap.trader = event.params.trader;
  swap.src = src.id;
  swap.srcAmount = convertTokenToDecimal(event.params.srcAmount, src.decimals);
  swap.dst = dst.id;
  swap.dstAmout = convertTokenToDecimal(event.params.destAmount, dst.decimals);
  swap.amountETH = amountETH;
  swap.amountUSD = amountETH.times(ethPrice);
  swap.recipient = event.params.recipient;
  swap.gasPrice = convertEthToGwei(event.transaction.gasPrice);
  swap.gasUsed = convertEthToDecimal(event.transaction.gasUsed);
  swap.save()
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

export function handleKyberTradeAndDeposit(event: KyberTradeAndDeposit): void { }

export function handleKyberTradeAndRepay(event: KyberTradeAndRepay): void { }

export function handleUniswapTradeAndDeposit(
  event: UniswapTradeAndDeposit
): void { }

export function handleUniswapTradeAndRepay(event: UniswapTradeAndRepay): void { }

export function handleWithdrawFromLending(event: WithdrawFromLending): void { }
