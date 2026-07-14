# GeoDrop Security & Product Audit — Remediation Plan

| Field | Value |
|-------|--------|
| **Document** | `AUDIT.md` |
| **Project** | GeoDrop — cross-chain physical bounties on Solana |
| **Version** | 1.0 |
| **Date** | 2026-07-14 |
| **Scope** | Web portal (`app/`), Hunter PWA (`apps/pwa/`), Android app (`apps/mobile/`), Anchor program (`anchor/`), claim oracle APIs, shared client (`packages/geodrop-client/`) |
| **Method** | Static architecture and code-path review (claim flow, account constraints, POH, GPS, admin, funding lifecycle) |
| **Status** | Findings documented; fixes not yet implemented |

This document is the engineering handoff for remediating all issues identified in the GeoDrop audit. It is intentionally detailed: each finding has evidence, impact, and a linked work package with files, tasks, acceptance criteria, and tests.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Scope and methodology](#2-scope-and-methodology)
3. [System map and trust boundaries](#3-system-map-and-trust-boundaries)
4. [Finding catalog](#4-finding-catalog)
5. [Target architecture](#5-target-architecture)
6. [Cross-cutting standards](#6-cross-cutting-standards)
7. [Phased remediation plan](#7-phased-remediation-plan)
8. [Work packages (detailed)](#8-work-packages-detailed)
9. [Dependency order and sequencing](#9-dependency-order-and-sequencing)
10. [Test and verification matrix](#10-test-and-verification-matrix)
11. [Rollout and mainnet checklist](#11-rollout-and-mainnet-checklist)
12. [Open decisions and non-goals](#12-open-decisions-and-non-goals)
13. [Appendix A — Current vs target claim flow](#appendix-a--current-vs-target-claim-flow)
14. [Appendix B — Critical file inventory](#appendix-b--critical-file-inventory)
15. [Appendix C — Finding → work package index](#appendix-c--finding--work-package-index)

---

## 1. Executive summary

### 1.1 What GeoDrop is

GeoDrop is a location-based bounty platform:

- **Sponsors** create and fund geo-fenced campaigns via a Next.js web portal (SOL escrow on Solana; optional LiFi bridge funding).
- **Hunters** discover drops on a map (PWA or Android), walk to a location, and claim a share of the bounty pool.
- **On-chain program** (`vault`) holds drop PDAs, enforces range checks, tracks claims, and pays SOL.
- **Backend claim oracle** co-signs/broadcasts claims and runs Proof-of-Human (POH) checks.
- **Optional MagicBlock** ephemeral-rollup path (`delegate_drop` / `claim_and_commit` / `payout_claim`) for low-latency claims.

### 1.2 Strengths

| Area | Strength |
|------|----------|
| Architecture | Clear sponsor vs hunter split; PNPM monorepo; Codama-generated `@geodrop/client` |
| Sponsor UX | Multi-step campaign create, map picker, LiFi widget, dashboard progress bars |
| Hunter PWA | Installable shell, radar map, nearest-drop UX, claimed/exhausted filtering, service worker hygiene |
| Program core | Drop PDA escrow, claim counters, integer range check, claim-record PDA pattern |
| Stack | Anchor, `@solana/kit`, Next.js, Expo — modern and maintainable |

### 1.3 Critical gaps

The product thesis (“physical presence + sybil resistance + on-chain payout”) is only partially enforced:

1. **Location is client-trusted.** Clients send `lat`/`long`; the backend and program never verify GPS authenticity. The PWA even exposes a **Mock GPS** toggle.
2. **Claim API fails open on POH errors** and does not require a hunter cryptographic commitment in the current web path.
3. **On-chain authorization holes:** hardcoded multi-claim tester bypass; `claim_and_commit` lacks `backend_authority` binding; `payout_claim` is unconstrained; `init_if_needed` can rewrite drop fields.
4. **No sponsor refund/close** for unclaimed funds.
5. **Android and claim API are out of sync** (partial-sign vs fully signed broadcast; emulator-only claim URL).

### 1.4 Risk posture

| Surface | Maturity | Production readiness |
|---------|----------|----------------------|
| Marketing / landing | B | Demo-grade; metrics oversell |
| Sponsor portal | B− | Create/fund works; lifecycle incomplete |
| PWA hunter | B | Best hunter client; trust model weak |
| Android hunter | C | Broken vs current API |
| Claim backend | C− | Demo-functional; spoofable; centralized key |
| Anchor program | C+ | Core idea sound; auth/money edge cases unsafe |
| Tests / ops | C | LiteSVM partial; no e2e claim path |

**Verdict:** Strong hackathon/MVP. **Do not run mainnet value** until Phase **P0** is complete. Prefer honest “devnet demo” labeling until P1 money lifecycle ships.

---

## 2. Scope and methodology

### 2.1 In scope

| Area | Paths |
|------|--------|
| Program | `anchor/programs/vault/src/lib.rs`, `anchor/programs/vault/src/tests.rs` |
| Client SDK | `packages/geodrop-client/` (Codama-generated; regenerate after program changes via `pnpm run setup`) |
| Portal | `app/**` — landing, dashboard, campaign create, admin, APIs |
| Claim oracle | `app/api/claim/route.ts`, `apps/pwa/app/api/claim/route.ts` |
| PWA | `apps/pwa/**` |
| Mobile | `apps/mobile/**` |
| Config / docs | `.env.example`, `README.md`, `apps/pwa/README.md`, `vercel.json` |

### 2.2 Out of scope (this plan)

- External third-party security firm audit engagement (recommended after P0/P1)
- Mainnet deploy execution and key ceremony operations
- Net-new product features beyond what is required to close trust and money gaps (except minimal UX needed for safe claims)
- Legal/compliance review of location tracking / POH data processing

### 2.3 Method

Static review of:

- Instruction account constraints and state transitions
- Claim HTTP contract and POH behavior
- Client GPS → API → chain path
- Sponsor funding and lack of reverse path
- Admin and metrics authenticity
- Client contract drift (PWA vs Android vs API)

Severity levels used:

| Severity | Meaning |
|----------|---------|
| **Critical** | Direct fund loss, trivial abuse, or total break of product trust model |
| **High** | Significant abuse path, broken production path, or serious auth gap |
| **Medium** | Integrity, ops, or product correctness issues with clear exploit or user harm |
| **Low** | Polish, debt, misleading UX, or maintainability |

---

## 3. System map and trust boundaries

### 3.1 Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SPONSOR SURFACE                                  │
│  app/ (Next.js)  →  wallet + initialize_drop  →  Drop PDA (SOL pool)     │
│  LiFi widget     →  bridge funds into drop address                       │
│  dashboard       →  getProgramAccounts + decodeDrop                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ANCHOR PROGRAM  vault  (6mEc28x37u7281vSXg5CwcVtj2qKVX4dX1vwrQYG1RNv) │
│  initialize_drop │ claim_drop │ claim_and_commit │ payout_claim          │
│  delegate_drop   │ undelegate_drop │ deposit/withdraw (legacy vault)   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ signed txs
┌─────────────────────────────────────────────────────────────────────────┐
│  CLAIM ORACLE  POST /api/claim                                           │
│  BACKEND_PRIVATE_KEY  →  backend_authority signer + fee payer            │
│  POH (proofofhuman.ge)  →  currently fail-open                           │
│  Magic Router RPC if drop owner = DELeG...                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
              ┌─────────────────────┴─────────────────────┐
              │                                           │
┌─────────────────────────────┐             ┌─────────────────────────────┐
│  apps/pwa  (Hunter PWA)     │             │  apps/mobile (Android)        │
│  geolocation / Mock GPS     │             │  expo-location + MWA          │
│  use-claim-bounty → {sig}   │             │  useClaimBounty → partial tx  │
│  own /api/claim (duplicate) │             │  hardcoded 10.0.2.2:3000      │
└─────────────────────────────┘             └─────────────────────────────┘
```

### 3.2 Current claim control flow (as implemented)

```
Hunter client
  1. Read device GPS (or mock)
  2. POST /api/claim {
       lat, long,           // micro-degrees from client — UNTRUSTED
       hunterPubkey,        // not proven owned on web path
       dropPubkey,
       optional blockhash
     }

Claim oracle
  3. isHuman(hunterPubkey)  // fail-open on error/timeout
  4. Load BACKEND_PRIVATE_KEY
  5. Detect delegated drop → claim_and_commit else claim_drop
  6. Fully sign as backend (fee payer + authority)
  7. sendTransaction → return { signature }

Program (claim_drop)
  8. backend_authority must sign and match drop.backend_authority
  9. hunter is UncheckedAccount (no signature required)
 10. Range check using client-supplied lat/long
 11. Create claim_record PDA (except hardcoded tester)
 12. Transfer reward (or full remaining on last claim) to hunter
```

### 3.3 Trust anchors and secrets

| Asset | Location | Who controls | Risk if compromised / misused |
|-------|----------|--------------|-------------------------------|
| `BACKEND_PRIVATE_KEY` | Server env (portal + optionally PWA) | Operators | Full claim authority; can drain all drops that set this authority |
| `drop.backend_authority` | On-chain at init | Set by sponsor UI (hardcoded today) | Wrong key → unclaimable or attacker-controlled claims |
| Hardcoded tester pubkey | Program source | Deployed bytecode | Infinite multi-claim for that wallet |
| Admin wallet check | Client-only (`app/admin/page.tsx`) | Anyone who opens tools | Not a real control plane |
| Hunter GPS | Device / browser | User or attacker | Spoofable; no attestation |
| POH API | Third party `proofofhuman.ge` | External | Fail-open nullifies gate |

### 3.4 Trust boundary diagram (desired after P0)

```
Untrusted:  browser/app GPS, user-supplied lat/long, public RPC
Semi-trust: POH (best-effort sybil signal; fail-closed when required)
Trusted:    hunter wallet signature, backend_authority signature, program constraints
```

Coordinates remain **untrusted inputs** forever unless a future attestation system is added. Marketing and UX must not claim “cryptographic proof of physical location” until that exists. On-chain range checks only prove: *“the coordinates that the authorized backend agreed to put in the tx fall inside the circle.”*

---

## 4. Finding catalog

### 4.1 Critical and High

---

#### F-01 — Client-supplied coordinates accepted as location proof

| | |
|--|--|
| **Severity** | Critical |
| **Component** | Claim oracle, PWA, mobile, program (by design) |
| **Evidence** | `app/api/claim/route.ts` accepts `lat`/`long` from JSON body with no authenticity check; program `claim_drop` only validates distance to stored center; README markets “cryptographic proofs of location” |
| **Impact** | Anyone who can call the claim API can claim from anywhere by submitting in-range coordinates. Breaks physical-presence product thesis and enables remote bounty farming. |
| **Remediation** | Short term: honest labeling + rate limits + hunter signature + no mock GPS in prod. Medium term: multi-sample location, motion heuristics, optional merchant QR / second factor. Long term: device attestation or third-party location proof (P3). |
| **Work packages** | WP-P0-01, WP-P0-04, WP-P2-05, WP-P3-01 |

---

#### F-02 — POH fails open on error and timeout

| | |
|--|--|
| **Severity** | High |
| **Component** | Claim oracle |
| **Evidence** | `app/api/claim/route.ts` / `apps/pwa/app/api/claim/route.ts` — `return true` on non-OK POH, missing `brainKey`, poll timeout, and catch blocks (fail open) |
| **Impact** | When POH is down, slow, or returns unexpected payloads, **all wallets pass**. Sybil resistance vanishes under the conditions where it is most needed. |
| **Remediation** | `POH_MODE=strict` (default in production): fail closed on error/timeout. Optional `permissive` for local demos only. Log metrics for POH failure rate. |
| **Work packages** | WP-P0-01 |

---

#### F-03 — No hunter signature; claims can target any pubkey

| | |
|--|--|
| **Severity** | Critical |
| **Component** | Claim oracle + program `ClaimDrop` |
| **Evidence** | Program: `hunter: UncheckedAccount` with comment that hunter need not sign. API fully signs and broadcasts with only `hunterPubkey` string from client. PWA sends `wallet.address` but server does not verify possession of that key. |
| **Impact** | Attacker can force claims (and SOL) to any hunter address once they pass backend gates, or grief by consuming claim slots for victims. Combined with F-01, remote complete drain of campaign slots is feasible. |
| **Remediation** | Require hunter as on-chain `Signer` **and/or** require wallet-signed claim intent verified by backend before signing. Prefer partial-sign + hunter co-sign (align with original Android flow). |
| **Work packages** | WP-P0-01, WP-P0-02, WP-P0-03 |

---

#### F-04 — Hardcoded tester multi-claim bypass

| | |
|--|--|
| **Severity** | Critical |
| **Component** | Program |
| **Evidence** | `anchor/programs/vault/src/lib.rs` in `claim_drop` and `claim_and_commit`: pubkey `552usXzVzcLnZJCzyhokzWxmJpmVsZAV8pRywgShzj1u` skips `AlreadyClaimed` check |
| **Impact** | That wallet can claim the same drop repeatedly (within `max_claims` global counter), draining the pool unfairly. Permanent backdoor if deployed as-is to mainnet. |
| **Remediation** | Remove bypass entirely for production builds. If needed for internal testing, gate with `#[cfg(feature = "testing")]` and never enable on mainnet deploy artifacts. |
| **Work packages** | WP-P0-03 |

---

#### F-05 — `claim_and_commit` missing backend_authority constraint

| | |
|--|--|
| **Severity** | Critical |
| **Component** | Program `ClaimAndCommit` |
| **Evidence** | Accounts: `payer: Signer`, `hunter: UncheckedAccount`, `drop: Account<Drop>` without `has_one = backend_authority` or seeds binding to drop authority. Contrast with `ClaimDrop` which has `has_one = backend_authority`. |
| **Impact** | On delegated drops, any fee-paying signer may be able to advance claims and queue payouts if MagicBlock path allows the instruction, bypassing the oracle key model. |
| **Remediation** | Require `backend_authority` (or `payer` must equal `drop.backend_authority`) and seed constraints on `drop`. Mirror `ClaimDrop` security properties. |
| **Work packages** | WP-P0-03 |

---

#### F-06 — `payout_claim` unconstrained

| | |
|--|--|
| **Severity** | High (Critical if callable as normal instruction outside MagicBlock gate) |
| **Component** | Program `PayoutClaim` |
| **Evidence** | `#[action] struct PayoutClaim` — only `drop` and `hunter` accounts; no authority, no claim_record check, no verification that a claim was just committed |
| **Impact** | If invokable outside intended post-commit action context, arbitrary payouts from drop to hunter. Even if MagicBlock restricts call path, defense-in-depth is missing. |
| **Remediation** | Add authority / action-only constraints per MagicBlock docs; verify claim state; ensure amount and recipient consistency with claim_record and counters. Add adversarial tests. |
| **Work packages** | WP-P0-03 |

---

#### F-07 — `init_if_needed` allows drop field rewrite

| | |
|--|--|
| **Severity** | High |
| **Component** | Program `InitializeDrop` |
| **Evidence** | `init_if_needed` on drop PDA; instruction body always writes sponsor fields, name, authority, lat/long, radius, rewards, max_claims without checking prior initialization |
| **Impact** | Re-initialization with same `campaign_id` may overwrite campaign parameters (radius, reward, authority) and top-up logic may behave unexpectedly. Risk of malicious reconfig or accidental overwrite. |
| **Remediation** | Use `init` only, or `init_if_needed` + explicit “already initialized” error unless a dedicated `update_drop` with sponsor signer and safe field rules exists. |
| **Work packages** | WP-P0-03 |

---

#### F-08 — No sponsor close / refund of unclaimed funds

| | |
|--|--|
| **Severity** | High |
| **Component** | Program + portal |
| **Evidence** | No `close_drop` / `withdraw_remaining` instruction. Last claim path drains **all** remaining lamports to the last hunter (including surplus). Unfinished campaigns with no further claims leave SOL locked in PDA (minus any future claims). |
| **Impact** | Sponsors can permanently lose access to unclaimed budget; last hunter may receive unintended surplus; no operational recovery path. |
| **Remediation** | Add sponsor-authorized close/refund; fix last-claim to pay at most `reward_per_claim` (or remaining **reward budget**, not all lamports by accident). Dashboard CTA for close. |
| **Work packages** | WP-P1-01, WP-P1-02 |

---

#### F-09 — Android claim contract ≠ current API

| | |
|--|--|
| **Severity** | High |
| **Component** | Mobile + claim API |
| **Evidence** | `apps/mobile/hooks/useClaimBounty.android.ts` expects `{ messageBase64, signatures }` then MWA `signAndSendTransaction`. `app/api/claim/route.ts` returns `{ signature }` after server broadcast. PWA matches the new API only. |
| **Impact** | Production Android claim path is broken against the current backend. Feature parity claims are false. |
| **Remediation** | Unify on one contract (preferred: partial sign + hunter co-sign). Update all three sides together; document OpenAPI-style schema in this repo. |
| **Work packages** | WP-P0-02 |

---

#### F-10 — Mobile claim URL hardcoded to emulator localhost

| | |
|--|--|
| **Severity** | High |
| **Component** | Mobile |
| **Evidence** | `useClaimBounty.android.ts`: `fetch("http://10.0.2.2:3000/api/claim", ...)` |
| **Impact** | Physical devices and production builds cannot reach the oracle without code change. Cleartext HTTP. |
| **Remediation** | `EXPO_PUBLIC_CLAIM_API_URL` (or `app.config.ts` extra); HTTPS production endpoint; document in mobile README. |
| **Work packages** | WP-P0-02 |

---

#### F-11 — Production Mock GPS on PWA

| | |
|--|--|
| **Severity** | High |
| **Component** | PWA |
| **Evidence** | `apps/pwa/app/components/hunter-app.tsx` — always-visible “MOCK GPS” toggle; `use-geolocation` mock mode |
| **Impact** | One-click location spoofing for any end user; legitimizes F-01 abuse. |
| **Remediation** | Gate behind `NEXT_PUBLIC_ALLOW_MOCK_GPS=true` and/or `process.env.NODE_ENV === "development"`. Strip from production builds. |
| **Work packages** | WP-P0-04 |

---

### 4.2 Medium

---

#### F-12 — Client Haversine vs on-chain approximate distance mismatch

| | |
|--|--|
| **Severity** | Medium |
| **Component** | PWA/mobile vs program |
| **Evidence** | Clients: Haversine meters (`geo.ts`, mobile `App.tsx`). Program: micro-degree deltas with polynomial cos approximation and decimeter squared compare. |
| **Impact** | UI shows IN_RANGE while chain returns `OutOfRange` (or reverse). Support friction and false “bug” reports. |
| **Remediation** | Document on-chain formula; share constants; optionally slightly shrink client radius; add unit tests comparing boundary samples. |
| **Work packages** | WP-P1-03 |

---

#### F-13 — Last-claim remainder accounting unfair / risky

| | |
|--|--|
| **Severity** | Medium |
| **Component** | Program |
| **Evidence** | On last claim, all drop lamports transferred to hunter (not just `reward_per_claim`). Partial claims use unchecked lamport arithmetic. |
| **Impact** | Overfunded drops give last hunter surplus; underfunded drops may panic/underflow; rent accounting unclear. |
| **Remediation** | Invariant: remaining reward budget = `reward_per_claim * (max_claims - current_claims)` (pre-increment). Last claim pays min(reward, remaining budget); sponsor closes rent/dust via WP-P1-01. |
| **Work packages** | WP-P1-02 |

---

#### F-14 — SPL campaign type is UI-only

| | |
|--|--|
| **Severity** | Medium |
| **Component** | Portal |
| **Evidence** | `app/campaign/create/page.tsx` state `type: "SOL" | "SPL"`; program and `initialize_drop` are SOL lamports only. |
| **Impact** | Misleading sponsor UX; failed expectations for brand campaigns. |
| **Remediation** | Hide SPL until Token-2022 path exists (preferred for P1). Full SPL is a larger P3 feature. |
| **Work packages** | WP-P1-05 |

---

#### F-15 — Hardcoded backend authority in create flow

| | |
|--|--|
| **Severity** | Medium |
| **Component** | Portal |
| **Evidence** | `app/campaign/create/page.tsx`: `BACKEND_AUTHORITY = "FcimNGtwn1ygJa8ZL3E2JAydruAihNWDdc9zPypNUGNg"` |
| **Impact** | Cannot rotate keys or use env-specific oracles without code change; mismatch with `BACKEND_PRIVATE_KEY` silently breaks claims. |
| **Remediation** | `NEXT_PUBLIC_BACKEND_AUTHORITY` required; document pairing with server private key; fail launch if unset. |
| **Work packages** | WP-P0-05 |

---

#### F-16 — Dual claim API doubles secret surface

| | |
|--|--|
| **Severity** | Medium |
| **Component** | Portal + PWA |
| **Evidence** | Identical routes in `app/api/claim` and `apps/pwa/app/api/claim`; PWA README suggests either local key or pointing at sponsor API. |
| **Impact** | Two deployments may hold `BACKEND_PRIVATE_KEY`; drift risk; larger blast radius. |
| **Remediation** | Single canonical oracle (portal or dedicated service). PWA uses `NEXT_PUBLIC_CLAIM_API_URL` only; remove PWA private key requirement. |
| **Work packages** | WP-P0-01, WP-P0-02 |

---

#### F-17 — Dashboard stale and inefficient account fetch

| | |
|--|--|
| **Severity** | Medium |
| **Component** | Portal dashboard |
| **Evidence** | `app/dashboard/page.tsx`: fetch once on mount; bare `getProgramAccounts` then filter sponsor in JS. Mobile `useDrops.ts` already uses `memcmp` filters. |
| **Impact** | Stale claim progress; high RPC cost as program accounts grow. |
| **Remediation** | SWR/React Query interval; memcmp on sponsor field; optional accountSubscribe later. |
| **Work packages** | WP-P1-04 |

---

#### F-18 — Admin is client-only with mock data

| | |
|--|--|
| **Severity** | Medium |
| **Component** | Portal admin |
| **Evidence** | `AUTHORIZED_ADMIN_WALLET` checked only in client; `app/api/admin/responses/route.ts` returns mock waitlist/beta even when Sheets env vars are set (fetch not implemented); hardcoded MAU/CTR. |
| **Impact** | False operational confidence; unauthenticated data API; not suitable for real CRM. |
| **Remediation** | Server-side auth (signed message/session) **or** strip admin until real. Implement Sheets/DB or label “demo mock” permanently. |
| **Work packages** | WP-P2-01 |

---

#### F-19 — README APK link is short-lived signed URL

| | |
|--|--|
| **Severity** | Medium |
| **Component** | Docs / distribution |
| **Evidence** | `README.md` EAS CDN URL with `X-Amz-Expires=900` |
| **Impact** | Broken download for users and investors within minutes of link generation. |
| **Remediation** | Stable download page, EAS Update, or Play internal track; link PWA as primary hunter surface. |
| **Work packages** | WP-P1-06 |

---

### 4.3 Low

| ID | Title | Evidence | Work package |
|----|--------|----------|--------------|
| F-20 | Legacy `deposit`/`withdraw` vault paths add audit surface | `lib.rs` VaultAction | WP-P3-02 |
| F-21 | Dual program IDs in landing/admin metrics | `PROGRAM_IDS` arrays in `app/page.tsx`, `app/admin/page.tsx` | WP-P2-02 |
| F-22 | Debug logs in dashboard / mobile render | dashboard `debugLog`; mobile `console.log` on render | WP-P1-04, WP-P2-05 |
| F-23 | Landing full-page scroll hijack hurts a11y | `app/page.tsx` wheel/touch preventDefault section snap | WP-P3-03 |
| F-24 | Unused/noise dependencies (e.g. `@mysten/sui`) | root `package.json` | WP-P3-02 |
| F-25 | No e2e; incomplete rollup path tests | tests.rs focuses on base vault/drop; no full ER e2e | WP-P3-04 |

---

## 5. Target architecture

### 5.1 Claim model (recommended)

**Partial-sign + hunter co-sign** (restores Android intent; proves key possession):

1. **Client** obtains GPS (real device; mock only when explicitly allowed in non-prod).
2. **Client** connects wallet; hunter will be a **required signer** on the claim transaction.
3. **Client** → `POST /api/claim` with:
   - `lat`, `long` (micro-degrees)
   - `hunterPubkey`
   - `dropPubkey`
   - optional recent blockhash from client RPC
   - optional wallet-signed **claim intent** message (recommended even if hunter co-signs the tx)
4. **Oracle**:
   - Validate inputs and rate-limit (IP + wallet).
   - Verify intent signature if required.
   - Run POH in **strict** mode in production.
   - Build `claim_drop` or `claim_and_commit` with accounts:
     - `hunter` as signer (fee payer may be hunter or backend — pick one model and stick to it)
     - `backend_authority` as co-signer
   - Prefer: backend partial-signs → return `{ messageBase64, signatures }` → client co-signs and submits.
   - Alternative (gasless): backend is fee payer, still requires hunter signature on the same tx before broadcast.
5. **Single oracle origin** for all clients (`NEXT_PUBLIC_CLAIM_API_URL` / `EXPO_PUBLIC_CLAIM_API_URL`).

**On-chain invariants (target):**

- `backend_authority` must sign and match `drop.backend_authority` on every claim path.
- `hunter` must sign.
- One claim-record PDA per `(drop, hunter)`; no production tester bypass.
- `current_claims < max_claims` before increment.
- Distance check on coordinates supplied in instruction (still not GPS proof — see F-01).
- Payout amount ≤ configured reward; last claim does not silently gift surplus without policy.

### 5.2 Location honesty policy

| Tier | Environment | GPS | Mock GPS | Marketing language |
|------|-------------|-----|----------|--------------------|
| **Demo** | local / devnet | Client self-report | Allowed only if `ALLOW_MOCK_GPS` / dev | “Demo location; coordinates are self-reported” |
| **Production** | mainnet / public beta | Client self-report + mitigations (rate limit, hunter sign, multi-sample optional) | **Forbidden** | Do **not** claim cryptographic physical proof until attestation exists |

Mitigations that improve (but do not solve) spoofing:

- Multiple location samples over N seconds with max jump speed
- Reject impossible accuracy / mocked provider flags where available
- Server-side velocity checks across claims
- Optional merchant QR / geofence second factor (P3)

### 5.3 Money lifecycle (target)

```
Sponsor initialize_drop
  → funds drop PDA with at least reward_per_claim * max_claims (+ rent)
  → optional LiFi pre-fund then init tops up remainder

Hunters claim_drop / claim_and_commit
  → current_claims += 1
  → transfer reward_per_claim to hunter (last claim: same rule, not full drain of surplus)
  → claim_record PDA marks hunter

Sponsor close_drop / withdraw_remaining  (new)
  → allowed when: current_claims == max_claims OR expiry reached OR sponsor cancel policy
  → remaining lamports (unclaimed rewards + surplus + reclaimable rent) → sponsor
  → optionally close account
```

### 5.4 Configuration standard

| Variable | Surface | Purpose |
|----------|---------|---------|
| `BACKEND_PRIVATE_KEY` | **Server only** (canonical oracle) | ed25519 keypair hex for claim authority |
| `NEXT_PUBLIC_BACKEND_AUTHORITY` | Portal (and any create UI) | Pubkey written into drops; must match private key |
| `NEXT_PUBLIC_RPC_URL` | Portal, PWA | Solana RPC |
| `NEXT_PUBLIC_SOLANA_CHAIN` | PWA wallets | e.g. `solana:devnet` |
| `NEXT_PUBLIC_CLAIM_API_URL` | PWA | Absolute or path to oracle |
| `EXPO_PUBLIC_CLAIM_API_URL` | Mobile | Oracle URL |
| `EXPO_PUBLIC_RPC_URL` | Mobile | RPC |
| `POH_MODE` | Server | `strict` \| `permissive` (default `strict` when `NODE_ENV=production`) |
| `NEXT_PUBLIC_ALLOW_MOCK_GPS` | PWA | `true` only for demos |
| `CLAIM_RATE_LIMIT_WINDOW_MS` / `CLAIM_RATE_LIMIT_MAX` | Server | Abuse control |
| `MAGICBLOCK_ROUTER_URL` | Server | Delegated claim RPC (env, not hardcode only) |

Update `.env.example` and `apps/pwa` env docs to match. Never commit real keys.

---

## 6. Cross-cutting standards

### 6.1 Claim API contract (target v1)

**Request** `POST /api/claim`  
`Content-Type: application/json`

```json
{
  "lat": 37774890,
  "long": -122419400,
  "hunterPubkey": "<base58>",
  "dropPubkey": "<base58>",
  "blockhash": "<optional base58>",
  "lastValidBlockHeight": 0
}
```

Coordinates are **i64 micro-degrees** (degrees × 1e6), matching the program.

**Success response (preferred partial-sign mode)**

```json
{
  "mode": "partial",
  "messageBase64": "...",
  "signatures": {
    "<backendPubkey>": "<base64 sig>"
  },
  "minContextSlot": 0
}
```

**Success response (gasless broadcast mode — only if hunter already co-signed via alternate path)**

```json
{
  "mode": "broadcast",
  "signature": "<base58 tx sig>"
}
```

**Error response**

```json
{
  "error": "human-readable message",
  "code": "POH_REJECTED | POH_UNAVAILABLE | RATE_LIMITED | VALIDATION | BACKEND_MISCONFIGURED | CHAIN_ERROR"
}
```

HTTP: `400` validation, `403` POH/auth, `429` rate limit, `500` misconfig/chain, `503` POH unavailable in strict mode.

### 6.2 Distance math

| Layer | Algorithm | Unit |
|-------|-----------|------|
| UI distance display | Haversine | meters |
| UI “in range” gate | Haversine ≤ `radius * CLIENT_RANGE_FACTOR` | `CLIENT_RANGE_FACTOR` default `0.95` to reduce false positives |
| On-chain | Existing integer approx (document constants in program comments) | decimeters² |

Long-term: consider moving to a single well-tested integer Haversine in the program if CU allows.

### 6.3 Codama / client regeneration

After any program IDL change:

```bash
pnpm run setup
# or: pnpm run anchor-build && pnpm run codama:js
```

Do not hand-edit files under `packages/geodrop-client/src` that are marked AUTOGENERATED.

### 6.4 Error handling UX

| Condition | User-facing copy |
|-----------|------------------|
| Out of range | “Move closer to the drop (within X m).” |
| Already claimed | “You already claimed this drop.” |
| Campaign finished | “This bounty is exhausted.” |
| POH rejected | “Claim blocked: wallet failed humanity check.” |
| POH unavailable (strict) | “Verification service unavailable. Try again later.” |
| Rate limited | “Too many attempts. Wait and try again.” |

---

## 7. Phased remediation plan

| Phase | Name | Goal | Exit criteria |
|-------|------|------|----------------|
| **P0** | Trust & safety | Stop trivial abuse; fix auth; unify clients | No tester bypass; hunter proves key; POH strict; no prod mock GPS; one claim contract; env authority |
| **P1** | Money & product completeness | Sponsors can recover funds; accounting correct; dashboard reliable | close/refund live; reward invariants tested; dashboard polls; SPL hidden; stable download docs |
| **P2** | Ops & scale | Honest admin/metrics; observability | Admin real or removed; metrics labeled; claim metrics; PWA permission UX |
| **P3** | Hardening & differentiation | Attestation research, cleanup, e2e, external audit | Roadmap items delivered as prioritized |

Estimated sequencing (calendar depends on team size):

- **P0:** 3–7 engineering days (program + API + clients)
- **P1:** 3–6 days
- **P2:** 2–5 days
- **P3:** ongoing

---

## 8. Work packages (detailed)

### Phase P0 — Trust & safety

---

### WP-P0-01 — Claim API hardening (canonical oracle)

**Goal:** Make the claim oracle safe for public devnet demos and ready for stricter production modes.

**Finds addressed:** F-01 (partial), F-02, F-03 (partial), F-16

**Files**

| Action | Path |
|--------|------|
| Harden | `app/api/claim/route.ts` |
| Remove or thin-proxy | `apps/pwa/app/api/claim/route.ts` |
| Optional extract | `app/lib/claim/poh.ts`, `app/lib/claim/rate-limit.ts`, `app/lib/claim/schema.ts` |
| Docs | `.env.example`, `apps/pwa/README.md` |

**Tasks**

1. **POH modes**
   - `POH_MODE=strict`: any POH failure/timeout/non-done → `403` or `503` with code `POH_UNAVAILABLE` / `POH_REJECTED`.
   - `POH_MODE=permissive`: current fail-open behavior; log warning; allow only when not production.
   - Production default: `strict`.
2. **Input validation**
   - Require finite integers for lat/long in micro-degree range.
   - Validate base58 pubkeys.
   - Reject missing fields with `400` + `VALIDATION`.
3. **Rate limiting**
   - In-memory (single instance) or Upstash/Vercel KV for multi-instance.
   - Key by IP and by `hunterPubkey`.
   - Return `429` + `RATE_LIMITED`.
4. **Hunter possession proof** (coordinate with WP-P0-02/03)
   - Minimum: hunter must be a signer on the transaction the backend signs.
   - Recommended: also verify a short-lived signed message: `geodrop-claim:${drop}:${lat}:${long}:${expiry}`.
5. **Single secret surface**
   - Only portal (or dedicated service) loads `BACKEND_PRIVATE_KEY`.
   - PWA points `NEXT_PUBLIC_CLAIM_API_URL` at that origin; delete duplicate private-key deployment.
6. **Observability**
   - Structured logs: claim attempt, POH outcome, delegated vs L1, error codes (no secrets).
7. **Never** log `BACKEND_PRIVATE_KEY` or full key material.

**Reuse**

- Existing Kit imports in claim route: `createKeyPairSignerFromBytes`, tx message builders, `getClaimDropInstruction`, `findClaimRecordPda`.
- Delegation detection pattern (`DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`).

**Acceptance criteria**

- [ ] With `POH_MODE=strict`, forced POH failure yields non-2xx and no chain tx.
- [ ] Invalid body → 400.
- [ ] Burst requests → 429 after threshold.
- [ ] PWA production deploy does not require `BACKEND_PRIVATE_KEY`.
- [ ] Error JSON includes stable `code` field.

**Tests**

- Manual or automated route tests for validation/POH/rate limit.
- Staging: claim happy path still works with strict POH for a known-good wallet (or test double for POH in CI).

---

### WP-P0-02 — Unify claim API contract (PWA + Android + oracle)

**Goal:** One request/response schema; both hunter clients work against one backend.

**Finds addressed:** F-09, F-10, F-16, F-03 (client half)

**Files**

| Action | Path |
|--------|------|
| API | `app/api/claim/route.ts` |
| PWA client | `apps/pwa/app/lib/use-claim-bounty.ts` |
| PWA config | `apps/pwa/app/lib/config.ts` |
| Android | `apps/mobile/hooks/useClaimBounty.android.ts` |
| Fallback | `apps/mobile/hooks/useClaimBounty.ts` |
| Mobile config | `apps/mobile/app.config.ts`, `apps/mobile/package.json` env |
| Docs | `apps/pwa/README.md`, root `README.md` |

**Recommended decision (lock this in implementation PR):**

| Mode | Description | When |
|------|-------------|------|
| **A — Partial sign (preferred)** | Backend returns partially signed tx; hunter wallet co-signs and sends | Matches historical Android; proves hunter key |
| **B — Full broadcast** | Backend broadcasts only after verifying hunter signature on message/tx | Gasless UX if backend pays fees |

Implement **Mode A** unless product explicitly needs gasless; if gasless, still require hunter signature on the claim instruction.

**Tasks**

1. Document contract in code comment + this file’s §6.1.
2. Implement Mode A in API (or Mode B with explicit hunter sign verification).
3. Update PWA `use-claim-bounty` to match (today assumes `{ signature }` only).
4. Update Android hook to:
   - Use `EXPO_PUBLIC_CLAIM_API_URL` (fallback documented for emulator: `http://10.0.2.2:3000/api/claim` only in dev).
   - Parse the unified response.
   - Use HTTPS in production.
5. Remove cleartext production endpoints.
6. Align blockhash handling (client-provided vs server-fetched for MagicBlock).

**Reuse**

- Android partial-sign assembly already sketched in `useClaimBounty.android.ts` (base64 message + signatures map).
- PWA wallet context for signing if Mode A needs browser Wallet Standard sign-and-send.

**Acceptance criteria**

- [ ] Same drop can be claimed successfully from PWA and Android against one oracle URL.
- [ ] No hardcoded `10.0.2.2` in production builds.
- [ ] Response `mode` field discriminates partial vs broadcast if both exist temporarily during migration.

**Tests**

- Manual device: Android dev client + staging oracle.
- Manual browser: Phantom/Solflare on PWA.
- Regression: delegated vs non-delegated drop if MagicBlock used.

---

### WP-P0-03 — Program authorization and init safety

**Goal:** On-chain constraints match the threat model; remove backdoors; prepare safe IDL for clients.

**Finds addressed:** F-03, F-04, F-05, F-06, F-07

**Files**

| Action | Path |
|--------|------|
| Program | `anchor/programs/vault/src/lib.rs` |
| Tests | `anchor/programs/vault/src/tests.rs` |
| Regenerated client | `packages/geodrop-client/**` via Codama |
| Callers | claim API, any instruction builders |

**Tasks**

1. **Remove tester bypass** from `claim_drop` and `claim_and_commit` (or `#[cfg(feature = "testing")]` only; default features exclude it).
2. **`ClaimDrop`**
   - Change `hunter` to `Signer<'info>` (or equivalent that requires signature).
   - Keep `backend_authority` with `has_one = backend_authority`.
   - Keep claim_record seeds `[b"claim", drop.key(), hunter.key()]`.
3. **`ClaimAndCommit`**
   - Add `backend_authority: Signer` with `has_one` on drop **or** constrain `payer.key() == drop.backend_authority`.
   - Bind `drop` with seeds `[b"drop", sponsor, campaign_id]` if possible from stored fields.
   - Require hunter signer if CU/account model allows on rollup path.
4. **`PayoutClaim`**
   - Research MagicBlock `#[action]` invocation guarantees.
   - Add maximum possible constraints: amount checks, hunter match, remaining budget, optional authority PDA.
   - Fail closed if called outside intended context (if detectable).
5. **`InitializeDrop`**
   - Prefer `init` instead of `init_if_needed`.
   - If re-init needed for LiFi pre-create empty account edge cases, branch:
     - empty account / system-owned → init
     - already `Drop` → error `DropAlreadyInitialized` unless explicit update ix
6. **Events (optional but recommended)**
   - `DropInitialized`, `DropClaimed`, `DropClosed` for indexers.
7. **Regenerate** Codama client; fix TypeScript call sites for new account metas (hunter signer).
8. **Expand LiteSVM tests** (see acceptance).

**Reuse**

- Existing test helpers in `tests.rs`: `get_drop_pda`, `get_claim_pda`, `create_initialize_drop_ix`, `create_claim_drop_ix`, `sighash`.
- Error enum `VaultError` — extend with new codes as needed.

**Acceptance criteria**

- [ ] Tester pubkey cannot multi-claim on default build.
- [ ] Claim without hunter signature fails.
- [ ] Claim with wrong backend authority fails on L1 and rollup paths.
- [ ] Second `initialize_drop` on same PDA fails (or safe update only).
- [ ] Unauthorized `payout_claim` fails in tests (to the extent harness can invoke it).
- [ ] `pnpm run anchor-test` (or `anchor test --skip-deploy`) green.
- [ ] `pnpm run setup` regenerates client; portal/PWA typecheck.

**Tests (minimum)**

| Test | Expected |
|------|----------|
| init + claim in range | success, current_claims=1, hunter balance += reward |
| claim out of range | `OutOfRange` |
| double claim same hunter | `AlreadyClaimed` |
| wrong backend | `InvalidAuthority` |
| claim without hunter sig | fail |
| reinit same campaign_id | fail |
| exhaust max_claims | further claims `CampaignFinished` |

---

### WP-P0-04 — Hide mock GPS in production

**Goal:** No end-user spoofing control in production PWA builds.

**Finds addressed:** F-11, F-01 (mitigation)

**Files**

- `apps/pwa/app/components/hunter-app.tsx`
- `apps/pwa/app/lib/use-geolocation.ts`
- `apps/pwa/README.md` (document dev-only mock)

**Tasks**

1. Define `const allowMock = process.env.NEXT_PUBLIC_ALLOW_MOCK_GPS === "true"`.
2. Render mock toggle only if `allowMock`.
3. Ensure mock mode cannot be enabled via localStorage alone in production without the flag.
4. Optionally watermark UI “DEMO LOCATION” when mock active.

**Acceptance criteria**

- [ ] Production build without flag: no mock button; geolocation is real API only.
- [ ] Local dev with flag: mock still available for demos.

**Tests**

- Build-time grep/CI check: fail if mock toggle rendered without env gate (optional).
- Manual: prod preview URL.

---

### WP-P0-05 — Env-driven backend authority

**Goal:** No hardcoded oracle pubkey in sponsor create flow.

**Finds addressed:** F-15

**Files**

- `app/campaign/create/page.tsx`
- `.env.example`
- Root README setup section
- Optional: small `app/lib/config.ts` for public env

**Tasks**

1. Read `process.env.NEXT_PUBLIC_BACKEND_AUTHORITY`.
2. If missing, disable Launch and toast clear error.
3. Document that pubkey must match `BACKEND_PRIVATE_KEY` public key.
4. Add setup note: how to derive pubkey from keypair hex.

**Acceptance criteria**

- [ ] No authority base58 string literal in `create/page.tsx`.
- [ ] `.env.example` lists `NEXT_PUBLIC_BACKEND_AUTHORITY`.
- [ ] Launch with matching env works end-to-end on devnet.

---

### Phase P1 — Money and product completeness

---

### WP-P1-01 — Sponsor close / refund

**Goal:** Sponsors can recover unclaimed SOL and reclaim rent.

**Finds addressed:** F-08

**Files**

- `anchor/programs/vault/src/lib.rs` — new instruction e.g. `close_drop` / `withdraw_remaining`
- `tests.rs`
- Codama client regen
- `app/components/campaign/campaign-card.tsx` — Close / Refund CTA
- `app/dashboard/page.tsx` — wire send transaction
- `packages/geodrop-client` instructions

**Design sketch**

```text
close_drop(ctx):
  require signer == drop.sponsor
  require current_claims == max_claims  OR  now >= expires_at  OR  cancel_enabled
  transfer all remaining lamports from drop PDA to sponsor (via system transfer with seeds)
  optionally zero account / close
```

If no `expires_at` field exists today, options:

1. Add `expires_at: i64` to `Drop` (IDL break — version carefully), or
2. Allow sponsor close anytime while accepting griefing of active campaigns (document risk), or
3. Allow close only when `current_claims == max_claims` first; add expiry in a follow-up.

**Recommended for P1:** sponsor may close if `current_claims == max_claims` **or** remaining reward budget is withdrawable after a new `cancel_drop` that sets `max_claims = current_claims` (freeze) then withdraw.

**Acceptance criteria**

- [ ] Sponsor recovers unclaimed funds in test.
- [ ] Non-sponsor cannot close.
- [ ] UI shows refund for eligible campaigns with explorer link.

**Tests**

- close after partial claims → sponsor gets remainder
- close by non-sponsor → fail
- claim after cancel/close → fail

---

### WP-P1-02 — Reward accounting invariants

**Goal:** Predictable payout math; no accidental surplus gift; no underfunded panics.

**Finds addressed:** F-13, F-08 (related)

**Files**

- `lib.rs` claim_drop / payout_claim transfer branches
- `tests.rs`

**Tasks**

1. Define invariant comments in program.
2. On each non-final claim: transfer exactly `reward_per_claim` if lamports sufficient; else error `InsufficientVaultBalance`.
3. On final claim: transfer `reward_per_claim` only (or min(reward, remaining budget)); leave surplus for sponsor close.
4. Check balances before raw lamport mutation; prefer checked arithmetic.
5. Ensure rent-exempt minimum policy is explicit (either keep account open until close ix or document).

**Acceptance criteria**

- [ ] Overfunded campaign: last hunter gets one reward; sponsor closes surplus.
- [ ] Underfunded campaign: claim fails cleanly, not panic.
- [ ] Tests cover both.

---

### WP-P1-03 — Shared distance math and UX alignment

**Goal:** Reduce in-range UI vs chain mismatches.

**Finds addressed:** F-12

**Files**

- `apps/pwa/app/lib/geo.ts` (extend)
- `apps/mobile/App.tsx` (or extract shared util if package allows)
- Program comments in `lib.rs` for on-chain formula
- Optional: `packages/geodrop-client` or new `packages/geodrop-geo` if workspace should share pure TS

**Tasks**

1. Document on-chain formula in `lib.rs` module docs.
2. Export `CLIENT_RANGE_FACTOR = 0.95` for UI gate.
3. Add unit tests for boundary points near radius.
4. Display “approximate; chain verifies” helper text near claim button if space allows.

**Acceptance criteria**

- [ ] Documented formula.
- [ ] Client uses factor; fewer false IN_RANGE claims.
- [ ] Tests for geo helpers.

---

### WP-P1-04 — Dashboard reliability

**Goal:** Fresh campaign state; cheaper RPC; less debug noise.

**Finds addressed:** F-17, F-22 (portal)

**Files**

- `app/dashboard/page.tsx`
- Possibly extract `app/lib/hooks/use-sponsor-drops.ts`
- Reuse memcmp pattern from `apps/mobile/hooks/useDrops.ts`

**Tasks**

1. Filter `getProgramAccounts` with memcmp on sponsor (offset after discriminator).
2. Poll every N seconds with SWR or React Query (already have `@tanstack/react-query` and `swr` in root deps — pick one).
3. Gate debug log UI to development only.
4. Loading and error empty states already partially present — keep consistent.

**Acceptance criteria**

- [ ] New claims reflect on dashboard without full page reload within poll interval.
- [ ] RPC payload smaller for multi-sponsor program.
- [ ] No debug strip in production UI.

---

### WP-P1-05 — SPL honesty

**Goal:** Do not advertise unimplemented reward types.

**Finds addressed:** F-14

**Files**

- `app/components/campaign/step-type.tsx`
- `app/campaign/create/page.tsx`

**Tasks**

1. Remove or disable SPL option with “Coming soon”.
2. Keep SOL path only in launch instruction.

**Acceptance criteria**

- [ ] Sponsors cannot select a non-functional SPL path that still launches a SOL drop under false label.

---

### WP-P1-06 — Distribution and README fixes

**Goal:** Working hunter acquisition links.

**Finds addressed:** F-19

**Files**

- `README.md`
- Optional `app/media` or download section on landing

**Tasks**

1. Replace expiring APK URL with:
   - Primary: PWA URL (`https://geodrop-hunter.vercel.app/` or current), and/or
   - Stable APK/EAS link process documented for maintainers.
2. Note Android MWA requirements.
3. Align README claim flow description with honest location trust (no “cryptographic GPS proof” until true).

**Acceptance criteria**

- [ ] README links resolve for >24h.
- [ ] Location trust language matches §5.2.

---

### Phase P2 — Ops and scale

---

### WP-P2-01 — Admin: real or removed

**Finds:** F-18

**Tasks**

1. Choose: **implement** server-verified admin session (wallet signature challenge) + real data source, **or** **remove** `/admin` from production nav and mark API demo-only.
2. If implement Sheets: complete Google API fetch using existing env vars; never return mock when `configured: true` without labeling.
3. Remove hardcoded MAU/CTR or wire to analytics API.

**Acceptance criteria**

- [ ] Unauthenticated clients cannot read private waitlist data if real data exists.
- [ ] No fake metrics presented as live without label.

---

### WP-P2-02 — Metrics honesty

**Finds:** F-21

**Tasks**

1. Single program id for metrics (current `VAULT_PROGRAM_ADDRESS`).
2. Label “devnet” / “demo” on landing stats.
3. Do not present `getSignaturesForAddress(limit:100)` as lifetime tx count without “last 100” caveat.

---

### WP-P2-03 — Claim observability

**Tasks**

1. Log/metric counters: attempts, POH reject, success, chain error.
2. Optional Vercel Analytics custom events for claim funnel (PWA + portal).
3. Alert if backend wallet SOL low (rent + fees).

---

### WP-P2-04 — Indexer path (design)

**Tasks**

1. Document when `getProgramAccounts` becomes untenable.
2. Sketch Helius/LaserStream/custom indexer for drops and claims (use program events if added in P0/P1).
3. No mandatory implementation in P2 if volume low — design note only is acceptable.

---

### WP-P2-05 — PWA UX polish for trust and permissions

**Finds:** F-01 (UX), F-22 (mobile logs optional)

**Tasks**

1. Location permission denied / insecure context messaging.
2. POH wait state (can take 10–20s with polling).
3. Success: explorer link (ensure wired).
4. iOS Add to Home Screen help.
5. Reduce noisy `console.log` in mobile `App.tsx` render path.

---

### Phase P3 — Hardening and differentiation

---

### WP-P3-01 — Location attestation roadmap

Research and spike (not necessarily ship):

- Device Play Integrity / app attestation
- Continuous location sampling + server velocity checks
- Merchant QR / NFC second factor at venue
- Third-party location oracles if any mature on Solana

Deliverable: short design note in repo or section update to this file.

---

### WP-P3-02 — Program and dependency cleanup

**Finds:** F-20, F-24

- Remove unused `deposit`/`withdraw` if product does not need personal vaults, **or** isolate in separate program.
- Remove unused npm deps (`@mysten/sui` if unused).
- Shrink audit surface.

---

### WP-P3-03 — Landing accessibility

**Finds:** F-23

- Replace forced scroll hijack with CSS scroll-snap optional or normal scroll.
- Respect `prefers-reduced-motion`.
- Keyboard users can navigate without trap.

---

### WP-P3-04 — E2E and external audit

**Finds:** F-25

- Playwright/Cypress: sponsor create → hunter claim (devnet).
- Expand LiteSVM for close/refund and auth cases if not already in P0/P1.
- MagicBlock path integration test in staging.
- Engage external Solana auditor before mainnet TVL.

---

## 9. Dependency order and sequencing

```
WP-P0-03  Program auth + tests
    │
    ▼
pnpm run setup  (anchor build + codama)
    │
    ▼
WP-P0-01  Claim API hardening  ──┬──► WP-P0-02  Unify clients (PWA + Android)
    │                            │
    ├──► WP-P0-05  Env authority (portal create)
    └──► WP-P0-04  Mock GPS gate

Then:
WP-P1-02  Accounting  ──► WP-P1-01  Close/refund  ──► portal UI
WP-P1-03  Distance
WP-P1-04  Dashboard
WP-P1-05  SPL hide
WP-P1-06  README/distribution

Then P2 → P3 as capacity allows.
```

**Rule:** Do not deploy client changes that require hunter signatures before the program upgrade is deployed on the target cluster.

**Migration note:** Existing drops on old program id remain under old rules. Prefer new deploy + new `VAULT_PROGRAM_ADDRESS` for P0-breaking changes; update all env and dual-id metrics (F-21).

---

## 10. Test and verification matrix

### 10.1 Program

```bash
pnpm run anchor-test
# equivalent: cd anchor && anchor test --skip-deploy
```

| Case | Phase |
|------|-------|
| deposit/withdraw legacy (if kept) | existing |
| initialize_drop funds PDA | P0 |
| claim in range | P0 |
| claim out of range | P0 |
| double claim | P0 |
| wrong authority | P0 |
| hunter missing signature | P0 |
| reinitialize rejected | P0 |
| accounting overfund/underfund | P1 |
| close/refund | P1 |

### 10.2 Claim API

| Case | Expected |
|------|----------|
| missing fields | 400 VALIDATION |
| POH AI / reject | 403 POH_REJECTED |
| POH down + strict | 403/503 POH_UNAVAILABLE |
| rate limit | 429 |
| happy path Mode A | 200 + partial signatures |
| misconfigured key | 500 BACKEND_MISCONFIGURED |

### 10.3 PWA

```bash
pnpm --filter @geodrop/pwa build
pnpm --filter @geodrop/pwa dev
```

- Mock GPS absent without flag.
- Claim with wallet against staging oracle.
- Permission denied UI.

### 10.4 Mobile

```bash
cd apps/mobile && npx expo start
```

- Configured claim URL reachable from device.
- MWA co-sign path succeeds on Android.

### 10.5 Portal

```bash
pnpm run dev
pnpm run ci   # build + lint + format check
```

- Create campaign with env authority.
- Dashboard refresh shows claims.
- Close/refund (after P1).

### 10.6 End-to-end (P3)

1. Sponsor connects wallet on devnet.
2. Creates drop with known lat/long/radius.
3. Hunter (second wallet) claims in range.
4. Second claim same hunter fails.
5. Exhaust or cancel; sponsor recovers remainder.
6. Explorer shows all txs.

---

## 11. Rollout and mainnet checklist

### 11.1 Devnet validation

- [ ] P0 program deployed to devnet; IDL published; client regenerated
- [ ] Canonical claim oracle deployed once; private key only there
- [ ] PWA + Android pointed at oracle
- [ ] POH_MODE=strict soak test (monitor false reject rate)
- [ ] No mock GPS on public URLs
- [ ] Sponsor create uses `NEXT_PUBLIC_BACKEND_AUTHORITY`
- [ ] P1 close/refund tested with real wallets

### 11.2 Pre-mainnet

- [ ] External audit or at least independent internal review of `lib.rs` + claim route
- [ ] Key ceremony: backend authority in KMS/HSM if possible; monitoring + top-up process
- [ ] Upgrade authority and freeze policy documented
- [ ] Incident runbook: pause claims (oracle down), rotate authority (requires new drops or update ix)
- [ ] Legal review of location + POH data if required in target markets
- [ ] Honest marketing copy (no false “proof of location”)
- [ ] Paid RPC; GPA/indexer plan
- [ ] Bug bounty optional

### 11.3 Mainnet launch gates

| Gate | Requirement |
|------|-------------|
| G1 | All P0 acceptance criteria met on mainnet program build |
| G2 | P1 refund path live |
| G3 | Oracle rate limits + strict POH + monitoring |
| G4 | No dual private key deploys |
| G5 | Runbook + on-call for backend SOL balance |

---

## 12. Open decisions and non-goals

### 12.1 Decisions to lock during implementation

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Claim signing mode | A partial-sign / B gasless broadcast | **A** unless gasless is launch-critical |
| Hunter as fee payer | Hunter pays vs backend pays | Backend pays only if hunter still signs ix |
| Drop reinit | forbid vs update ix | **Forbid** reinit; separate update later |
| Cancel policy | anytime vs expiry vs freeze | **Freeze + withdraw** or expiry field |
| Admin | implement vs remove | **Remove or demo-label** until CRM needed |
| SPL rewards | hide vs build | **Hide** until dedicated milestone |
| MagicBlock | keep vs defer | Keep codepaths but **same auth bar** as L1 |

### 12.2 Non-goals of this remediation program

- Building a full Pokémon-GO-scale social layer
- Multi-chain claim settlement (Solana payout remains source of truth)
- Perfect GPS anti-spoof (industry-hard); only honest mitigations + labeling
- Rewriting the entire UI design system

---

## Appendix A — Current vs target claim flow

### A.1 Current (insecure / inconsistent)

```
[PWA] GPS → POST {lat,long,hunter,drop} → oracle POH fail-open
    → backend full sign + broadcast → {signature}
    → hunter never signs

[Android] GPS → POST same → expects {messageBase64,signatures}
    → MWA co-sign  ❌ broken against current API
    → URL 10.0.2.2 only
```

### A.2 Target

```
[Any client] GPS (no prod mock) → wallet connected
    → POST /api/claim (canonical HTTPS oracle)
    → POH strict + rate limit
    → program: backend_authority + hunter both sign; claim_record; range check
    → Mode A: partial sigs → client co-sign → send
    → UI: explorer link + clear errors
```

---

## Appendix B — Critical file inventory

| File | Role in remediation |
|------|---------------------|
| `anchor/programs/vault/src/lib.rs` | Auth, accounting, close, tester removal |
| `anchor/programs/vault/src/tests.rs` | LiteSVM coverage |
| `app/api/claim/route.ts` | Canonical oracle |
| `apps/pwa/app/api/claim/route.ts` | Remove or proxy |
| `apps/pwa/app/lib/use-claim-bounty.ts` | PWA claim client |
| `apps/pwa/app/lib/use-geolocation.ts` | Mock GPS gate |
| `apps/pwa/app/components/hunter-app.tsx` | Mock toggle, claim UX |
| `apps/pwa/app/lib/config.ts` | CLAIM_API_URL |
| `apps/mobile/hooks/useClaimBounty.android.ts` | Android claim + URL |
| `apps/mobile/hooks/useDrops.ts` | memcmp pattern to reuse |
| `app/campaign/create/page.tsx` | Backend authority env |
| `app/dashboard/page.tsx` | Poll + memcmp |
| `app/components/campaign/campaign-card.tsx` | Close CTA |
| `app/admin/page.tsx` | Auth theater |
| `app/api/admin/responses/route.ts` | Mock admin API |
| `packages/geodrop-client/**` | Regenerated SDK |
| `.env.example` | Config template |
| `README.md` | Distribution + honesty |

**Reuse checklist**

- `@geodrop/client`: `findDropPda`, `findClaimRecordPda`, `getInitializeDropInstruction`, `getClaimDropInstruction`, `getClaimAndCommitInstruction`, `decodeDrop`, `VAULT_PROGRAM_ADDRESS`
- `apps/pwa/app/lib/geo.ts`: `calculateDistance`, `decodeDropName`, `formatLamportsToSol`, `microDegreesToDegrees`
- `app/lib/hooks/use-send-transaction.ts`: portal tx sending
- `tests.rs` PDA and instruction builders

---

## Appendix C — Finding → work package index

| Finding | Severity | Work packages |
|---------|----------|---------------|
| F-01 | Critical | WP-P0-01, WP-P0-04, WP-P2-05, WP-P3-01 |
| F-02 | High | WP-P0-01 |
| F-03 | Critical | WP-P0-01, WP-P0-02, WP-P0-03 |
| F-04 | Critical | WP-P0-03 |
| F-05 | Critical | WP-P0-03 |
| F-06 | High | WP-P0-03 |
| F-07 | High | WP-P0-03 |
| F-08 | High | WP-P1-01, WP-P1-02 |
| F-09 | High | WP-P0-02 |
| F-10 | High | WP-P0-02 |
| F-11 | High | WP-P0-04 |
| F-12 | Medium | WP-P1-03 |
| F-13 | Medium | WP-P1-02 |
| F-14 | Medium | WP-P1-05 |
| F-15 | Medium | WP-P0-05 |
| F-16 | Medium | WP-P0-01, WP-P0-02 |
| F-17 | Medium | WP-P1-04 |
| F-18 | Medium | WP-P2-01 |
| F-19 | Medium | WP-P1-06 |
| F-20 | Low | WP-P3-02 |
| F-21 | Low | WP-P2-02 |
| F-22 | Low | WP-P1-04, WP-P2-05 |
| F-23 | Low | WP-P3-03 |
| F-24 | Low | WP-P3-02 |
| F-25 | Low | WP-P3-04 |

---

## Document maintenance

| Event | Update |
|-------|--------|
| Work package completed | Check acceptance boxes; mark finding status (Open → Fixed) in a short changelog section if desired |
| Program redeploy | Record program id, cluster, commit SHA |
| External audit | Link report; map auditor findings to F-IDs or new IDs |

**Changelog**

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-07-14 | Initial audit remediation plan from full-stack review |

---

*End of AUDIT.md — execute Phase P0 before any mainnet value is at risk.*
