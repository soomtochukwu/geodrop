# [GeoDrop](https://original-geodrop.vercel.app/): Cross-Chain Physical Bounties

![GeoDrop](https://hidden-labrador-133.convex.cloud/api/storage/5c7647f4-e71b-4882-9830-d5921d6b09b5)

**GeoDrop gamifies real-world onboarding to Solana.** Pokémon GO meets geo-targeted bounties—sponsors fund location-locked SOL pools; hunters walk there and claim on-chain.

| Role         | Surface                                    | Live URL                                           |
| ------------ | ------------------------------------------ | -------------------------------------------------- |
| **Sponsors** | Web portal (create, fund, track campaigns) | [geodrop.online](https://www.geodrop.online/)      |
| **Hunters**  | Installable PWA (map + claim)              | [gdhunter.online](https://http://gdhunter.online/) |
| **Hunters**  | Android (Expo / MWA)                       | `apps/mobile` (devnet)                             |

> **Network:** Devnet demo. Program ID `6mEc28x37u7281vSXg5CwcVtj2qKVX4dX1vwrQYG1RNv`. See [AUDIT.md](./AUDIT.md) before putting real value on mainnet.

---

## What is GeoDrop?

- **For brands & sponsors:** Geo-targeted marketing with concurrent bounty drops. Pick coordinates on a map, set winners and reward-per-claim, fund with SOL or bridge from EVM chains via **LiFi**.
- **For hunters:** Discover live drops on a radar map, walk into the radius, and claim a share of the pool. Location is checked on-chain (integer Haversine-style range); the claim oracle co-signs and can run **Proof of Human (POH)** sybil checks.

---

## User flows

### 1. Sponsor portal (`app/`)

1. Connect a Solana wallet (Wallet Standard).
2. **Create campaign** — location (search / locate me), campaign name, `max_claims`, `reward_per_claim`, radius.
3. **Fund** — top up the drop PDA with SOL directly, or bridge/swap via the **LiFi** widget (Ethereum, Base, Arbitrum, …).
4. **Initialize** — `initialize_drop` locks metadata + escrow on the drop PDA (`seeds = ["drop", sponsor, campaign_id]`).
5. **Dashboard** — live claim progress and remaining pool balance from chain.

Also: landing, waitlist, beta signup, media kit, and admin views under `app/`.

### 2. Hunter clients

| Capability | PWA (`apps/pwa`)                       | Android (`apps/mobile`)                            |
| ---------- | -------------------------------------- | -------------------------------------------------- |
| Map        | Leaflet + dark tiles                   | `react-native-maps` (Google)                       |
| GPS        | `navigator.geolocation`                | `expo-location`                                    |
| Wallet     | Wallet Standard (Phantom, Solflare, …) | Mobile Wallet Adapter (Android)                    |
| Claim API  | Own `/api/claim` or env override       | Expects host claim API (emulator: `10.0.2.2:3000`) |

**Claim path (simplified):**

1. Hunter is inside the drop radius (client UI gates on distance).
2. Client posts GPS + wallet + drop address to the claim oracle (`POST /api/claim`).
3. Oracle optionally runs **POH**, builds `claim_drop` (or `claim_and_commit` if the drop is MagicBlock-delegated), signs as `backend_authority`, and broadcasts.
4. Program verifies authority, range, claim counter, and one-claim-per-hunter (`claim` PDA), then pays SOL.

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │  Sponsor Portal (Next.js)   │
                    │  create · fund · dashboard  │
                    └─────────────┬───────────────┘
                                  │ initialize_drop / LiFi
                                  ▼
┌──────────────┐    drop PDA escrow     ┌──────────────────────────┐
│ Hunter PWA / │ ─────────────────────► │  Anchor vault program    │
│ Android app  │    claim via oracle    │  + optional MagicBlock   │
└──────┬───────┘                        └──────────────────────────┘
       │ POST /api/claim
       ▼
┌──────────────────┐     POH (optional)
│ Claim oracle     │ ──► proofofhuman.ge
│ BACKEND_PRIVATE  │
└──────────────────┘
```

### Monorepo layout

| Path                       | Role                                                |
| -------------------------- | --------------------------------------------------- |
| `app/`                     | Next.js sponsor portal + landing + claim API        |
| `apps/pwa/`                | Next.js hunter PWA (installable, port 3001)         |
| `apps/mobile/`             | Expo React Native hunter app (Android-first)        |
| `anchor/`                  | Anchor program (`vault`) + LiteSVM tests            |
| `packages/geodrop-client/` | Codama-generated TypeScript SDK (`@geodrop/client`) |
| `video/`                   | Remotion / demo video assets                        |

Workspace: **pnpm** (`pnpm-workspace.yaml` includes `apps/mobile` and `packages/*`). The PWA is a sibling Next app with its own lockfile for Vercel deploy.

### On-chain program (`vault`)

Deployed on **devnet**:

```
6mEc28x37u7281vSXg5CwcVtj2qKVX4dX1vwrQYG1RNv
```

| Instruction            | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `initialize_drop`      | Create/fund drop PDA (geo, reward, max claims, backend authority) |
| `claim_drop`           | Oracle-signed claim on L1; range check + payout                   |
| `delegate_drop`        | Delegate drop PDA to MagicBlock ephemeral rollup                  |
| `claim_and_commit`     | Claim on rollup + commit + post-commit payout                     |
| `payout_claim`         | Post-commit SOL transfer (rollup path)                            |
| `undelegate_drop`      | Commit and undelegate drop PDA                                    |
| `deposit` / `withdraw` | Legacy personal vault helpers                                     |

Shared client: regenerate with `pnpm run setup` (Anchor build + Codama → `packages/geodrop-client/src`).

### Stack

- **Solana** + **Anchor 0.32** — drop escrow PDAs, integer geo checks, claim records
- **MagicBlock ephemeral rollups** — optional low-latency claim path
- **@solana/kit** — modern JS client
- **Codama** — typed instructions / PDAs / accounts
- **Next.js 16** + **Tailwind 4** — portal & PWA
- **Expo / React Native** — mobile hunter
- **LiFi** — cross-chain campaign funding
- **Proof of Human** — best-effort sybil signal on claim

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (22.x for PWA deploy)
- [pnpm](https://pnpm.io/installation)
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) `0.32.x`
- Android Studio / device for mobile (optional)

---

## Local development

### 1. Install

```bash
pnpm install
```

### 2. Build program & regenerate client

```bash
pnpm run setup   # anchor build && codama run js
```

### 3. Environment (sponsor portal)

```bash
cp .env.example .env.local
```

| Variable                        | Where         | Notes                                                                         |
| ------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `BACKEND_PRIVATE_KEY`           | Server only   | Hex ed25519 key for claim oracle; pubkey must match authority stored on drops |
| `NEXT_PUBLIC_RPC_URL`           | Client/server | Default `https://api.devnet.solana.com`                                       |
| `NEXT_PUBLIC_WAITLIST_FORM_URL` | Client        | Optional Google Form embed                                                    |
| `NEXT_PUBLIC_BETA_FORM_URL`     | Client        | Optional Google Form embed                                                    |

The campaign create UI currently pins a backend authority pubkey; keep it paired with `BACKEND_PRIVATE_KEY`.

### 4. Sponsor portal

```bash
pnpm run dev          # http://localhost:3000
```

### 5. Hunter PWA

```bash
# From repo root, or work inside apps/pwa with npm
cd apps/pwa
cp .env.example .env.local   # set BACKEND_PRIVATE_KEY or CLAIM_API_URL
npm install
npm run dev                  # http://localhost:3001
```

Prefer pointing `NEXT_PUBLIC_CLAIM_API_URL` at the portal’s `/api/claim` so only one deployment holds the oracle key.

### 6. Mobile (Android)

```bash
cd apps/mobile
pnpm install   # or from root
npx expo start
# Android emulator: claim API defaults to http://10.0.2.2:3000/api/claim
# Run the portal (or another claim host) accordingly.
```

Physical devices need a reachable claim URL (not the emulator-only host). Claiming is Android-oriented (MWA).

### Useful scripts (root)

| Script                     | Action                                      |
| -------------------------- | ------------------------------------------- |
| `pnpm run dev`             | Next portal (3000)                          |
| `pnpm run build`           | Production portal build                     |
| `pnpm run setup`           | Anchor build + Codama client                |
| `pnpm run anchor-test`     | Program tests (`anchor test --skip-deploy`) |
| `pnpm run codama:js`       | Regenerate `@geodrop/client` only           |
| `pnpm run lint` / `format` | ESLint / Prettier                           |

---

## Documentation map

| Doc                                                                      | Contents                                  |
| ------------------------------------------------------------------------ | ----------------------------------------- |
| [anchor/README.md](./anchor/README.md)                                   | Program IDs, instructions, deploy, tests  |
| [apps/pwa/README.md](./apps/pwa/README.md)                               | Hunter PWA config & install notes         |
| [apps/mobile/README.md](./apps/mobile/README.md)                         | Expo Android hunter                       |
| [packages/geodrop-client/README.md](./packages/geodrop-client/README.md) | Shared TS SDK                             |
| [AUDIT.md](./AUDIT.md)                                                   | Security/product audit & remediation plan |

---

## Links

- Portal: https://original-geodrop.vercel.app/
- Hunter PWA: https://geodrop-hunter.vercel.app/
- GitHub: https://github.com/soomtochukwu/geodrop
- X: https://x.com/geodropng
