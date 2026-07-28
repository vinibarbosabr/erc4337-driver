import type {
  Address,
  Chain,
  Hex,
  PublicClient,
  Transport,
  WalletClient,
  Account,
  EIP1193Provider,
} from 'viem'

/**
 * Minimal thirdweb Account surface used by erc4337-driver v0.1.
 * Admin can call execute / executeBatch directly (onlyAdminOrEntrypoint).
 */
export const thirdwebAccountAbi = [
  {
    type: 'function',
    name: 'factory',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'isAdmin',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'execute',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeBatch',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address[]' },
      { name: 'value', type: 'uint256[]' },
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [],
  },
] as const

/**
 * Minimal factory surface for address prediction.
 */
export const thirdwebFactoryAbi = [
  {
    type: 'function',
    name: 'getAddress',
    stateMutability: 'view',
    inputs: [
      { name: 'adminSigner', type: 'address' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

/** Empty data used by standard thirdweb accounts (verified on Base). */
export const EMPTY_DATA = '0x' as const satisfies Hex

export type PredictAddressParams = {
  /** Account factory address (e.g. thirdweb BaseAccountFactory). */
  factory: Address
  /** Admin EOA that owns the smart account. */
  admin: Address
  /** Initialization data / salt material. Defaults to empty bytes `0x`. */
  data?: Hex
  /** Public client used to call factory.getAddress. */
  publicClient: PublicClient
}

export type AssertIsAdminParams = {
  /** Smart account address. */
  account: Address
  /** Candidate admin EOA. */
  admin: Address
  publicClient: PublicClient
}

export type AttachParams = {
  /**
   * EIP-1193 provider (window.ethereum, Rabby, etc.).
   * Used to create a WalletClient that signs as the admin EOA.
   */
  provider: EIP1193Provider
  /**
   * Known smart account address. If omitted, predicted via factory + connected admin.
   */
  account?: Address
  /**
   * Factory used for prediction when `account` is not supplied.
   * Required if `account` is omitted.
   */
  factory?: Address
  /**
   * Salt / init data for prediction. Defaults to `0x`.
   */
  data?: Hex
  /**
   * Chain the smart account lives on.
   */
  chain: Chain
  /**
   * Optional public client. If omitted one is created from the provider.
   */
  publicClient?: PublicClient
}

export type ExecuteParams = {
  to: Address
  value?: bigint
  data?: Hex
}

export type ExecuteBatchItem = {
  to: Address
  value?: bigint
  data?: Hex
}

/**
 * Active session after successful attach + isAdmin check.
 * All writes go through the smart account's execute / executeBatch.
 */
export type DriverSession = {
  /** Smart account address. */
  address: Address
  /** Connected admin EOA. */
  admin: Address
  /** Chain the session is bound to. */
  chain: Chain
  /** Re-check isAdmin on-chain (fail-closed). */
  isAdmin: () => Promise<boolean>
  /** Call account.execute(to, value, data) from the admin. */
  execute: (params: ExecuteParams) => Promise<Hex>
  /** Call account.executeBatch(...) from the admin. */
  executeBatch: (calls: ExecuteBatchItem[]) => Promise<Hex>
  /** Underlying clients (advanced). */
  publicClient: PublicClient
  walletClient: WalletClient<Transport, Chain, Account>
}

export type { Address, Hex, Chain, PublicClient, WalletClient, EIP1193Provider }
