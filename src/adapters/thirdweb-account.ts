/**
 * thirdweb Account adapter (v0.1).
 *
 * This is the only concrete adapter for the first release.
 * Future adapters (Kernel, Safe, etc.) can live alongside this file
 * and be selected via a factory registry if needed.
 *
 * Important product decision:
 * - We never hard-code a specific factory address as a library default.
 * - Callers pass `factory` (or the already-known account address).
 * - The known thirdweb / P2P.me factory on Base is documented only in README
 *   as an example, never as a magic constant inside the package.
 */

import { EMPTY_DATA, thirdwebAccountAbi, thirdwebFactoryAbi } from '../types.js'

export {
  EMPTY_DATA,
  thirdwebAccountAbi,
  thirdwebFactoryAbi,
}

/**
 * Example factory address observed for standard thirdweb Account deployments
 * on Base mainnet (and the same CREATE2 address on Base Sepolia).
 *
 * This is exported only for documentation / tests. Application code should
 * still pass the factory explicitly so the library stays app-agnostic.
 */
export const EXAMPLE_THIRDWEB_FACTORY_BASE =
  '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as const
