import { BigInt } from "@graphprotocol/graph-ts"
import {
  SWSwap,
  KyberTrade,
  KyberTradeAndDeposit,
  KyberTradeAndRepay,
  UniswapTrade,
  UniswapTradeAndDeposit,
  UniswapTradeAndRepay,
  WithdrawFromLending
} from "../generated/SWSwap/SWSwap"
import { ExampleEntity } from "../generated/schema"

export function handleKyberTrade(event: KyberTrade): void {
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
  entity.count = entity.count + BigInt.fromI32(1)

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

export function handleKyberTradeAndDeposit(event: KyberTradeAndDeposit): void {}

export function handleKyberTradeAndRepay(event: KyberTradeAndRepay): void {}

export function handleUniswapTrade(event: UniswapTrade): void {}

export function handleUniswapTradeAndDeposit(
  event: UniswapTradeAndDeposit
): void {}

export function handleUniswapTradeAndRepay(event: UniswapTradeAndRepay): void {}

export function handleWithdrawFromLending(event: WithdrawFromLending): void {}
