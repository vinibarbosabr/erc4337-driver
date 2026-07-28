/**
 * erc4337-driver
 *
 * Drive an existing ERC-4337 smart account with its admin key.
 * Browser-first (Rabby / any EIP-1193) · first adapter: thirdweb Account.
 *
 * @example
 * ```ts
 * import { attach } from 'erc4337-driver'
 * import { base } from 'viem/chains'
 *
 * const session = await attach({
 *   provider: window.ethereum, // Rabby / MetaMask
 *   factory: '0xdE32…97D1',   // pass explicitly — no library defaults
 *   chain: base,
 * })
 *
 * console.log(session.address) // the smart account
 * await session.execute({ to: target, data: calldata })
 * ```
 */

// Core functions
export { predictAddress } from './predict.js'
export { assertIsAdmin, isAdmin } from './assertAdmin.js'
export { attach } from './session.js'
export { execute, executeBatch } from './execute.js'

// Types
export type {
  PredictAddressParams,
  AssertIsAdminParams,
  AttachParams,
  DriverSession,
  ExecuteParams,
  ExecuteBatchItem,
  Address,
  Hex,
  Chain,
  PublicClient,
  WalletClient,
  EIP1193Provider,
} from './types.js'

// ABI + constants (for advanced / testing)
export {
  thirdwebAccountAbi,
  thirdwebFactoryAbi,
  EMPTY_DATA,
} from './types.js'

// Adapter surface
export {
  EXAMPLE_THIRDWEB_FACTORY_BASE,
} from './adapters/thirdweb-account.js'
