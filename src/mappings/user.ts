import { Address } from '@graphprotocol/graph-ts'
import { User } from "../types/schema"

export function getUser(address: Address): User {
  let user = User.load(address.toHex())

  if (user === null) {
    user = new User(address.toHex())
    user.save()
  }

  return user as User
}