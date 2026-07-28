import type { Address, Hex, WalletClient, Account, Chain, Transport } from 'viem'
import { thirdwebAccountAbi, type ExecuteParams, type ExecuteBatchItem } from './types.js'

/**
 * Encode + send a single execute call through the smart account.
 * The walletClient must be the *admin* EOA; the call target is the SA.
 */
export async function execute(
  walletClient: WalletClient<Transport, Chain, Account>,
  smartAccount: Address,
  params: ExecuteParams,
): Promise<Hex> {
  const { to, value = 0n, data = '0x' as Hex } = params

  const hash = await walletClient.writeContract({
    address: smartAccount,
    abi: thirdwebAccountAbi,
    functionName: 'execute',
    args: [to, value, data],
  })

  return hash
}

/**
 * Encode + send an executeBatch call through the smart account.
 */
export async function executeBatch(
  walletClient: WalletClient<Transport, Chain, Account>,
  smartAccount: Address,
  calls: ExecuteBatchItem[],
): Promise<Hex> {
  if (calls.length === 0) {
    throw new Error('executeBatch: calls array must not be empty')
  }

  const targets: Address[] = []
  const values: bigint[] = []
  const datas: Hex[] = []

  for (const c of calls) {
    targets.push(c.to)
    values.push(c.value ?? 0n)
    datas.push(c.data ?? ('0x' as Hex))
  }

  const hash = await walletClient.writeContract({
    address: smartAccount,
    abi: thirdwebAccountAbi,
    functionName: 'executeBatch',
    args: [targets, values, datas],
  })

  return hash
}
