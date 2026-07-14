# GeoDrop Hunter (Android)

React Native (Expo) hunter app: live map of bounty drops, GPS, and on-device claim signing via **Mobile Wallet Adapter**.

Package id: `com.geodrop.hunter` · Expo project under EAS (`app.json` / `eas.json`).

> Prefer the [Hunter PWA](https://geodrop-hunter.vercel.app/) for the most up-to-date claim path. This app still targets Android MWA and may expect an older claim API response shape—align with `app/api/claim` before production use.

## Features

- Dark map with drop markers, claim radius circles, and nearest-drop distance (Haversine)
- `expo-location` for continuous position
- Fetches all `Drop` accounts from the vault program via `@geodrop/client`
- Android: `@wallet-ui/react-native-kit` + MWA for wallet connect / send
- Non-Android platforms: claim hook reports unavailable (MWA is Android-only)

## Develop

From monorepo root (workspace package `mobile`):

```sh
pnpm install
cd apps/mobile
npx expo start
```

| Script | Action |
|--------|--------|
| `npx expo start` | Metro bundler |
| `pnpm android` / `npx expo run:android` | Native Android run |
| `npx expo start --web` | Web preview (limited) |

### Android emulator claim URL

`hooks/useClaimBounty.android.ts` posts to:

```
http://10.0.2.2:3000/api/claim
```

`10.0.2.2` is the emulator alias for the host machine’s localhost. Run the **sponsor portal** (`pnpm run dev` at repo root) so the claim oracle is on port 3000 with `BACKEND_PRIVATE_KEY` set.

On a **physical device**, change that host to a LAN or public HTTPS URL that reaches the same oracle.

### Dependencies

- `@geodrop/client` — `workspace:*` (built from `packages/geodrop-client`)
- `@solana/kit` — RPC + transaction types
- `react-native-maps`, `expo-location`, `expo-dev-client`

After program changes:

```sh
# repo root
pnpm run setup
```

## EAS builds

```sh
# profiles in eas.json: development | staging | preview | production
eas build --platform android --profile preview
```

Staging/preview produce **APK** for internal distribution.

## Project layout

```
apps/mobile/
├── App.tsx                 # Hunter map UI
├── components/
│   ├── Map.tsx             # Native maps
│   ├── Map.web.tsx
│   ├── WalletProvider.android.tsx
│   └── WalletProvider.tsx
├── hooks/
│   ├── useLocation.ts
│   ├── useDrops.ts
│   ├── useClaimBounty.ts          # non-Android stub
│   └── useClaimBounty.android.ts  # MWA + claim API
└── android/                # Prebuild / native project
```

## Related

- Root [README.md](../../README.md)
- PWA counterpart [../pwa/README.md](../pwa/README.md)
- Program [../../anchor/README.md](../../anchor/README.md)
