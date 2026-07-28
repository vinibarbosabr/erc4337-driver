import {
  createPublicClient,
  createWalletClient,
  custom,
  type Address,
  type Hex,
} from 'viem'
import { predictAddress } from './predict.js'
import { assertIsAdmin, isAdmin as checkIsAdmin } from './assertAdmin.js'
import { execute as sendExecute, executeBatch as sendExecuteBatch } from './execute.js'
import {
  EMPTY_DATA,
  type AttachParams,
  type DriverSession,
  type ExecuteParams,
  type ExecuteBatchItem,
} from './types.js'

/**
 * Attach to an existing ERC-4337 smart account using its admin key
 * via any EIP-1193 provider (Rabby, MetaMask, injected, etc.).
 *
 * Flow:
 * 1. Resolve admin address from the provider.
 * 2. Resolve smart-account address (supplied or predicted via factory).
 * 3. Fail-closed `isAdmin` check.
 * 4. Return a DriverSession that routes all writes through SA.execute*.
 *
 * No thirdweb clientId, no bundler, no UserOp required for v0.1.
 */
export async function attach(params: AttachParams): Promise<DriverSession> {
  const {
    provider,
    account: knownAccount,
    factory,
    data = EMPTY_DATA,
    chain,
    publicClient: suppliedPublicClient,
  } = params

  if (!knownAccount && !factory) {
    throw new Error(
      'attach: either `account` (known SA address) or `factory` (for prediction) must be provided',
    )
  }

  // Public client for reads (factory.getAddress, isAdmin, …)
  const publicClient =
    suppliedPublicClient ??
    createPublicClient({
      chain,
      transport: custom(provider),
    })

  // Temporary wallet client only to discover the unlocked admin address
  const discoveryClient = createWalletClient({
    chain,
    transport: custom(provider),
  })

  const [admin] = await discoveryClient.getAddresses()
  if (!admin) {
    throw new Error(
      'attach: no accounts returned by the provider. Unlock the admin key in Rabby (or your wallet) first.',
    )
  }

  // Wallet client bound to the concrete admin EOA (required for typed writeContract)
  const walletClient = createWalletClient({
    account: admin,
    chain,
    transport: custom(provider),
  })

  // Resolve the smart account address
  let smartAccount: Address
  if (knownAccount) {
    smartAccount = knownAccount
  } else {
    // factory is guaranteed by the earlier guard
    smartAccount = await predictAddress({
      factory: factory!,
      admin,
      data: data as Hex,
      publicClient,
    })
  }

  // Fail-closed: refuse to proceed if this key is not an admin
  await assertIsAdmin({
    account: smartAccount,
    admin,
    publicClient,
  })

  // Build the session object
  const session: DriverSession = {
    address: smartAccount,
    admin,
    chain,
    publicClient,
    walletClient: walletClient as DriverSession['walletClient'],

    isAdmin: async () =>
      checkIsAdmin({
        account: smartAccount,
        admin,
        publicClient,
      }),

    execute: async (p: ExecuteParams) =>
      sendExecute(walletClient as DriverSession['walletClient'], smartAccount, p),

    executeBatch: async (calls: ExecuteBatchItem[]) =>
      sendExecuteBatch(walletClient as DriverSession['walletClient'], smartAccount, calls),
  }

  return session
}
