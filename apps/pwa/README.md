# GeoDrop Hunter PWA

Installable web hunter for GeoDrop. Live map of on-chain bounty drops, GPS tracking, and claim flow when you are physically inside a drop’s radius.

**Production:** [geodrop-hunter.vercel.app](https://geodrop-hunter.vercel.app/)

Feature parity with the Android app (`apps/mobile`), using browser-native stacks:

| Mobile (`apps/mobile`) | PWA (`apps/pwa`) |
|------------------------|------------------|
| `react-native-maps` (Google) | Leaflet + CARTO dark tiles |
| `expo-location` watcher | `navigator.geolocation.watchPosition` |
| Solana Mobile Wallet Adapter | Wallet Standard (Phantom, Solflare, …) |
| Emulator claim host `10.0.2.2:3000` | Own `/api/claim` or `NEXT_PUBLIC_CLAIM_API_URL` |

## How claiming works

1. Drops are loaded from the vault program on the configured RPC.
2. Distance to nearest drop is shown; **Claim** unlocks inside the drop radius.
3. `POST` to the claim oracle with micro-degree lat/long, hunter pubkey, and drop address.
4. Oracle may run **Proof of Human**, then builds either:
   - `claim_drop` (base layer), or
   - `claim_and_commit` (if the drop account is MagicBlock-delegated),
   signs as the backend authority, and **broadcasts** the transaction.
5. UI shows signature / explorer link on success.

> Prefer a single oracle deployment: point `NEXT_PUBLIC_CLAIM_API_URL` at the sponsor portal’s `/api/claim` so `BACKEND_PRIVATE_KEY` is not duplicated.

## Develop

This app is **not** in the root pnpm workspace (standalone deploy with its own lockfile). From this directory:

```sh
cp .env.example .env.local
npm install
npm run dev    # http://localhost:3001
```

From monorepo root (if workspace filter is wired later):

```sh
# optional pattern once workspace includes pwa
pnpm --filter @geodrop/pwa dev
```

`@geodrop/client` is vendored as `geodrop-client.tgz` (or a file path) for Vercel; regenerate the package from the root after program changes (`pnpm run setup`) and refresh the tarball if your deploy uses it.

## Environment

| Variable | Required | Default / notes |
|----------|----------|-----------------|
| `BACKEND_PRIVATE_KEY` | If using local `/api/claim` | Hex ed25519 (64-byte keypair or 32-byte seed as hex) |
| `NEXT_PUBLIC_RPC_URL` | No | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_CHAIN` | No | `solana:devnet` |
| `NEXT_PUBLIC_CLAIM_API_URL` | No | `/api/claim` — set to portal URL to share oracle |

See `.env.example`.

## PWA notes

- `public/manifest.webmanifest` + `public/sw.js` — installable shell; SW registers in production only and does not cache `/api/*`, RPC, or map tiles.
- Geolocation needs a **secure context** (HTTPS or `localhost`).
- iOS Safari: no `beforeinstallprompt`; use Share → Add to Home Screen.
- Dev builds may include a mock GPS toggle for demos—do not treat mock coords as production-grade location proof (see root [AUDIT.md](../../AUDIT.md)).

## Scripts

| Script | Action |
|--------|--------|
| `npm run dev` | Next dev server on port **3001** |
| `npm run build` | Production build |
| `npm run start` | Serve production build on 3001 |

## Related

- Sponsor portal: [../../README.md](../../README.md)
- Program: [../../anchor/README.md](../../anchor/README.md)
- Client SDK: [../../packages/geodrop-client/README.md](../../packages/geodrop-client/README.md)
