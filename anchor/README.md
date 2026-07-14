# Anchor program: `vault`

Solana program for GeoDrop geo-bounties. Despite the historical crate name, the product surface is **location-locked drop PDAs** with claim records, an oracle authority, and optional **MagicBlock** ephemeral-rollup delegation.

Built with [Anchor](https://www.anchor-lang.com/) `0.32.1` and [`ephemeral-rollups-sdk`](https://docs.magicblock.gg/).

## Devnet deployment

| Field | Value |
|-------|--------|
| Program ID | `6mEc28x37u7281vSXg5CwcVtj2qKVX4dX1vwrQYG1RNv` |
| Cluster | `devnet` (see `Anchor.toml`) |
| IDL / types | `target/idl/vault.json`, `target/types/vault.ts` |

Wire the TypeScript SDK from the monorepo root:

```bash
pnpm run setup   # anchor build && codama → packages/geodrop-client
```

---

## Accounts

### `Drop` PDA

```
seeds = ["drop", sponsor, campaign_id]
```

| Field | Type | Notes |
|-------|------|--------|
| `sponsor` | `Pubkey` | Campaign creator |
| `campaign_id` | `[u8; 8]` | Unique per sponsor |
| `name` | `[u8; 32]` | Display name |
| `backend_authority` | `Pubkey` | Must sign `claim_drop` |
| `latitude` / `longitude` | `i64` | Micro-degrees |
| `radius` | `u64` | Meters |
| `reward_per_claim` | `u64` | Lamports |
| `max_claims` / `current_claims` | `u64` | Pool lifecycle |

Escrow = SOL held on the drop account. Total intended funding ≈ `reward_per_claim * max_claims` (with LiFi top-ups allowed before init).

### Claim record PDA

```
seeds = ["claim", drop, hunter]
```

Empty → hunter has not claimed. Created during claim to enforce one claim per hunter (except a hardcoded tester key in current code—see AUDIT.md).

### Legacy vault PDA

```
seeds = ["vault", signer]
```

Used only by `deposit` / `withdraw`.

---

## Instructions

| Instruction | Who | Behavior |
|-------------|-----|----------|
| **`initialize_drop`** | Sponsor | Create drop PDA; transfer remaining SOL so escrow covers `reward × max_claims` if needed |
| **`claim_drop`** | Backend authority (signer); hunter receives funds | Range check (integer approx. of Haversine in decimeters), increment claims, pay `reward_per_claim` (or rest on last claim) |
| **`delegate_drop`** | Payer | Delegate drop PDA to MagicBlock for rollup execution |
| **`claim_and_commit`** | Payer on rollup | Same geo/claim logic on ephemeral state; commits drop + claim record; queues **`payout_claim`** post-commit |
| **`payout_claim`** | Post-commit action | Transfers SOL from drop to hunter on base layer after commit |
| **`undelegate_drop`** | Payer | Commit + undelegate drop PDA |
| **`deposit` / `withdraw`** | User | Legacy personal vault |

Claim oracle (Next.js `POST /api/claim`) detects MagicBlock delegation via account owner and routes to `claim_and_commit` vs `claim_drop`.

---

## Build, test, deploy

### Build

```bash
cd anchor
anchor build
```

### Tests

LiteSVM unit tests live in `programs/vault/src/tests.rs`:

```bash
# from monorepo root
pnpm run anchor-test
# or
cd anchor && anchor test --skip-deploy
```

### Deploy your own program

1. **New keypair**

   ```bash
   solana-keygen new -o target/deploy/vault-keypair.json
   solana address -k target/deploy/vault-keypair.json
   ```

2. **Update program ID** in:

   - `Anchor.toml` → `[programs.devnet] vault = "..."`
   - `programs/vault/src/lib.rs` → `declare_id!("...")`

3. **Build & deploy**

   ```bash
   anchor build
   solana airdrop 2 --url devnet   # ~2 SOL for deploy
   anchor deploy --provider.cluster devnet
   ```

4. **Regenerate client** (from repo root)

   ```bash
   pnpm run codama:js
   ```

   Output: `packages/geodrop-client/src` (instructions, PDAs, errors, `VAULT_PROGRAM_ADDRESS`).

---

## Related docs

- Root [README.md](../README.md) — full product stack
- [AUDIT.md](../AUDIT.md) — auth, money, and claim-path findings
- [packages/geodrop-client/README.md](../packages/geodrop-client/README.md) — consuming the IDL client
