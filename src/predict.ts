import { type Address, type Hex } from 'viem'
import { thirdwebFactoryAbi, EMPTY_DATA, type PredictAddressParams } from './types.js'

/**
 * Predict (or confirm) the smart account address for a given admin + data
 * by calling the factory's `getAddress` view.
 *
 * This matches thirdweb BaseAccountFactory / AccountFactory behaviour:
 *   salt = keccak256(abi.encode(admin, data))
 *   account = Clones.predictDeterministicAddress(implementation, salt)
 *
 * Prefer this on-chain call over pure CREATE2 so we never hard-code
 * implementation bytecode or factory-specific salt generation.
 *
 * @example
 * const sa = await predictAddress({
 *   factory: '0xdE320c2E2b4953883f61774c006f9057A55B97D1',
 *   admin: '0x5E835025357a59Ca2db2d20D9Df7284415c56D90',
 *   publicClient,
 * })
 */
export async function predictAddress(params: PredictAddressParams): Promise<Address> {
  const { factory, admin, data = EMPTY_DATA, publicClient } = params

  const predicted = await publicClient.readContract({
    address: factory,
    abi: thirdwebFactoryAbi,
    functionName: 'getAddress',
    args: [admin, data as Hex],
  })

  return predicted
}
