# GeoDrop Hunter PWA

Installable web version of the mobile hunter app (`apps/mobile`). Shows a live
radar map of on-chain bounty drops, tracks your GPS position, and lets you
claim a share of a drop's SOL pool when you are physically inside its radius.

Feature parity with the Android app, with browser-native replacements:

| Mobile (`apps/mobile`)                    | PWA (`apps/pwa`)                          |
| ----------------------------------------- | ----------------------------------------- |
| `react-native-maps` (Google provider)     | Leaflet + CARTO dark tiles                |
| `expo-location` watcher                   | `navigator.geolocation.watchPosition`     |
| Solana Mobile Wallet Adapter (Android)    | Wallet Standard (Phantom, Solflare, ...)  |
| Hardcoded `http://10.0.2.2:3000/api/claim`| Own `/api/claim` route (or env override)  |

## Develop

```sh
pnpm install
pnpm --filter @geodrop/pwa dev   # http://localhost:3001
```

Claiming needs the oracle key in the environment (same as the sponsor app):

```sh
# apps/pwa/.env.local
BACKEND_PRIVATE_KEY=<hex-encoded ed25519 private key>
```

## Configuration

All optional, with devnet defaults:

- `NEXT_PUBLIC_RPC_URL` — Solana RPC (default `https://api.devnet.solana.com`)
- `NEXT_PUBLIC_SOLANA_CHAIN` — Wallet Standard chain id (default `solana:devnet`)
- `NEXT_PUBLIC_CLAIM_API_URL` — claim oracle endpoint (default `/api/claim`,
  the bundled route; point it at the deployed sponsor dashboard's
  `/api/claim` to avoid distributing the backend key twice)

## PWA notes

- `public/manifest.webmanifest` + `public/sw.js` make the app installable with
  an offline app shell. The service worker only registers in production
  builds and never caches `/api/*`, the RPC, or map tiles.
- Geolocation requires a secure context: HTTPS in production, `localhost` in dev.
- iOS Safari has no `beforeinstallprompt`; install via Share → Add to Home Screen.
