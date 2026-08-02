# erc4337-driver

**Drive an existing ERC-4337 smart account with its admin key — browser (Rabby) or CLI.**  
First adapter: **thirdweb Account**.

[![npm](https://img.shields.io/npm/v/erc4337-driver)](https://www.npmjs.com/package/erc4337-driver)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Background article:** [ERC-4337 smart accounts: When backing up your private key is not enough](https://thecoding.substack.com/p/erc-4337-smart-accounts-when-backing)

---

## Why this exists

Many apps (in-app wallets, thirdweb `clientId`-scoped accounts, etc.) create a smart account whose **admin** is an embedded EOA derived per app.

- Same human + same email on **another** app (different `clientId`) → **different** admin EOA → **different** smart-account address.
- Balances, protocol identity, and other arbitrary data (eg., Reputation Points) live on the **smart-account address**, not on the admin EOA.
- Exporting the admin key into Rabby or other EVM wallets still does not let you “act as” that smart account from another context without the original factory / salt wiring.

### Self-custody implications

This design has non-obvious consequences for user self-custody assumptions.

- Without the original app (or a tool that reconstructs the missing wiring), recovery is non-intuitive for most users.
- Result: the common mental model “I backed up my private key → I have self-custody” breaks for these deployments. The key is sufficient on-chain, but the recovery path is not.

**erc4337-driver** fills the gap:

> Drive an **already-deployed** ERC-4337 smart account, connect its **admin key** (browser via Rabby / any EIP-1193, or later CLI), and call `execute` / `executeBatch` **directly** on the account contract — no original dapp, no thirdweb `clientId`, no bundler required for the core path.

Closest neighbours do different jobs (full wallet UIs, in-stack create+operate SDKs, social recovery). This library is intentionally narrow.

---

## Install

```bash
npm install erc4337-driver viem
# or
pnpm add erc4337-driver viem
```

`viem` is a peer dependency.

---

## Quick start (browser + Rabby)

```ts
import { attach } from 'erc4337-driver'
import { base } from 'viem/chains'

// 1. User unlocks the admin key in Rabby (or any EIP-1193 wallet)
const provider = window.ethereum // Rabby injects here

// 2. Attach — either supply the known SA address or a factory for prediction
const session = await attach({
  provider,
  // Option A: you already know the smart-account address
  // account: '0xYourSmartAccount…',

  // Option B: predict from factory + connected admin (empty data = 0x)
  factory: '0xdE320c2E2b4953883f61774c006f9057A55B97D1', // example only — pass your own
  chain: base,
})

console.log('Smart account:', session.address)
console.log('Admin EOA:   ', session.admin)

// 3. Fail-closed isAdmin is already checked inside attach.
//    You can re-check later if needed:
const stillAdmin = await session.isAdmin()

// 4. Drive the account — calls go admin → SA.execute → target
const txHash = await session.execute({
  to: '0xTargetContract…',
  value: 0n,
  data: '0x…', // your calldata
})

// Or batch
const batchHash = await session.executeBatch([
  { to: '0x…', data: '0x…' },
  { to: '0x…', value: 1000000000000000n, data: '0x' },
])
```

No private keys ever touch your page. The wallet (Rabby) signs.

---

## Core API

### `predictAddress`

```ts
import { predictAddress } from 'erc4337-driver'

const sa = await predictAddress({
  factory: '0x…',
  admin: '0x…',
  data: '0x',           // default
  publicClient,         // viem PublicClient
})
```

Calls the factory’s `getAddress(admin, data)` view. Matches thirdweb’s CREATE2 formula:

```solidity
salt = keccak256(abi.encode(admin, data));
account = Clones.predictDeterministicAddress(implementation, salt);
```

### `assertIsAdmin` / `isAdmin`

```ts
import { assertIsAdmin, isAdmin } from 'erc4337-driver'

await assertIsAdmin({ account, admin, publicClient }) // throws if false
const ok = await isAdmin({ account, admin, publicClient })
```

### `attach` → `DriverSession`

See the quick-start example. The returned session exposes:

| Property / method | Description |
| ------------------- | ------------- |
| `address` | Smart-account address |
| `admin` | Connected admin EOA |
| `chain` | Bound chain |
| `isAdmin()` | Re-check on-chain |
| `execute({ to, value?, data? })` | Single call via SA |
| `executeBatch([{ to, value?, data? }, …])` | Batch via SA |
| `publicClient` / `walletClient` | Underlying viem clients |

---

## thirdweb Account notes

- Admin may call `execute` / `executeBatch` **directly** (modifier `onlyAdminOrEntrypoint`). No EntryPoint / UserOp required for this path.
- Standard accounts use **empty** `data` (`0x`) for the salt. Pass a different value only if you know the original init data.
- The library does **not** ship a default factory address. Always pass `factory` (or the known account). The address below is an **example** observed for many thirdweb deployments on Base:

  ```
  0xdE320c2E2b4953883f61774c006f9057A55B97D1
  ```

  (Same CREATE2 address on Base Sepolia in the cases @vinibarbosabr checked.)

---

## Threat model (v0.1)

| Risk | Mitigation |
| ------ | ------------ |
| Wrong admin key | `assertIsAdmin` is fail-closed; `attach` refuses to return a session |
| Malicious provider | You control the EIP-1193 provider; never accept an arbitrary one from untrusted input |
| Accidental execution | Caller must explicitly call `session.execute` / `executeBatch` |
| Private-key leakage | Browser path never handles raw keys; CLI (future) will accept PK only via env / prompt |
| Factory / salt mismatch | Predict via on-chain `getAddress`; document empty-salt convention clearly |

This is **not** a full wallet. It is a thin driver for an already-deployed account whose admin you control.

**USE IT CAREFULLY!**

---

## Out of scope (by design)

- Any specific protocol types or addresses
- Full wallet UI
- Social recovery / guardians
- Automatic multi-vendor detection (Kernel, Safe, …) — interface is ready for future adapters
- Bundler / UserOp path (optional later; admin-direct execute is preferred for v0.1)

---

## Architecture (v0.1)

```Text
src/
├── index.ts              # public API
├── types.ts              # ABIs + types
├── predict.ts            # factory.getAddress
├── assertAdmin.ts        # isAdmin fail-closed
├── session.ts            # attach + DriverSession
├── execute.ts            # execute / executeBatch encoding
└── adapters/
    └── thirdweb-account.ts
```

Single package until a second adapter appears.

---

## Development

```bash
pnpm install
pnpm build
pnpm test          # includes a live Base read for the known research account
```

---

## Roadmap

- [x] v0.1 — browser attach + thirdweb Account adapter + direct execute
- [ ] CLI (`predict`, `execute`) with env-only private key
- [ ] Optional UserOp / bundler path
- [ ] Additional adapters (Kernel, Safe, …) behind the same session interface

---

## License

MIT © Vini Barbosa

---

## Further reading

- [Full background article on thecoding](https://thecoding.substack.com/p/erc-4337-smart-accounts-when-backing)

---
