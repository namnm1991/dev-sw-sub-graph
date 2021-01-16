import { Address, BigInt } from '@graphprotocol/graph-ts'
import { User } from "../types/schema"

export function getUser(address: Address): User {
  let user = User.load(address.toHex())

  if (user === null) {
    user = new User(address.toHex())
    user.txCount = BigInt.fromI32(0)
    user.save()
  }

  return user as User
}