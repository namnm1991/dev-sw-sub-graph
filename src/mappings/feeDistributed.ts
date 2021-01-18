import {
  FeeDistributed as FeeDistributedEvent
} from "./../types/FeeHandler/FeeHandler"
import { FeeDistributed } from "./../types/schema"
import { getToken } from "./token"

export function handleFeeDistributed(event: FeeDistributedEvent): void {
  let id = event.transaction.hash.toHex()
  let feeDistributed = FeeDistributed.load(id)

  // ignore if multiple FeeDistributed events founded in 1 tx
  // it could be bot trading, not Krystal Smart Wallet
  if (feeDistributed === null) {
    let feeDistributed = new FeeDistributed(id)
    let token = getToken(event.params.token)
    feeDistributed.platformFeeWei = event.params.platformFeeWei
    feeDistributed.platformWallet = event.params.platformWallet
    feeDistributed.token = token.id
    feeDistributed.save()
  }
}