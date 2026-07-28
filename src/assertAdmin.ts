import { thirdwebAccountAbi, type AssertIsAdminParams } from './types.js'

/**
 * Fail-closed check that the given address is an admin of the smart account.
 * Throws if the call reverts or returns false.
 *
 * Use before any write path so a mismatched key never produces a silent
 * failed UserOp / execute.
 */
export async function assertIsAdmin(params: AssertIsAdminParams): Promise<void> {
  const { account, admin, publicClient } = params

  let isAdmin: boolean
  try {
    isAdmin = await publicClient.readContract({
      address: account,
      abi: thirdwebAccountAbi,
      functionName: 'isAdmin',
      args: [admin],
    })
  } catch (err) {
    throw new Error(
      `assertIsAdmin: failed to read isAdmin on ${account}. ` +
      `Is this a thirdweb Account (or compatible) contract? Original: ${String(err)}`,
    )
  }

  if (!isAdmin) {
    throw new Error(
      `assertIsAdmin: ${admin} is not an admin of smart account ${account}. ` +
      `Refusing to proceed (fail-closed).`,
    )
  }
}

/**
 * Non-throwing variant for UI / polling.
 */
export async function isAdmin(params: AssertIsAdminParams): Promise<boolean> {
  const { account, admin, publicClient } = params
  try {
    return await publicClient.readContract({
      address: account,
      abi: thirdwebAccountAbi,
      functionName: 'isAdmin',
      args: [admin],
    })
  } catch {
    return false
  }
}
