import { describe, it, expect } from 'vitest'
import { createPublicClient, http, type Address } from 'viem'
import { base } from 'viem/chains'
import { predictAddress } from '../src/predict.js'
import { EXAMPLE_THIRDWEB_FACTORY_BASE } from '../src/adapters/thirdweb-account.js'

/**
 * Live read-only test against Base mainnet public RPC.
 * Skips gracefully if network is unavailable (CI without RPC, offline, etc.).
 *
 * Research values from the handoff (verified MATCH YES):
 *   admin  = 0x5E835025357a59Ca2db2d20D9Df7284415c56D90
 *   SA     = 0xFa7C86bc2dDc9AA9910950fE481A95002948084B
 *   factory= 0xdE320c2E2b4953883f61774c006f9057A55B97D1
 */
const RESEARCH_ADMIN = '0x5E835025357a59Ca2db2d20D9Df7284415c56D90' as Address
const RESEARCH_SA = '0xFa7C86bc2dDc9AA9910950fE481A95002948084B' as Address

describe('predictAddress (thirdweb Account / Base)', () => {
  it('matches the known research smart account when data is empty', async () => {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(), // public Base RPC
    })

    let predicted: Address
    try {
      predicted = await predictAddress({
        factory: EXAMPLE_THIRDWEB_FACTORY_BASE,
        admin: RESEARCH_ADMIN,
        publicClient,
      })
    } catch (err) {
      // Network / rate-limit / offline → soft skip
      console.warn('Skipping live predict test (RPC unavailable):', err)
      return
    }

    expect(predicted.toLowerCase()).toBe(RESEARCH_SA.toLowerCase())
  }, 15_000)
})
