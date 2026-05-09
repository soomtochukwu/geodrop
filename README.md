# GeoDrop: Cross-Chain Physical Bounties

**"GeoDrop: Gamifying real-world onboarding to the Solana ecosystem. It's Pokémon GO meets cross-chain yield—driving foot traffic for merchants and crypto adoption for the masses."**

## What is GeoDrop?

GeoDrop is a decentralized, location-based bounty platform that turns the real world into an interactive crypto playground.

- **For Brands & Sponsors:** A frictionless way to run geo-targeted marketing campaigns. Sponsors can drop token bounties (e.g., USDC, SOL, or custom SPL tokens) at specific physical map coordinates, seamlessly funded from Ethereum, Base, or Arbitrum using our LiFi integration.
- **For Users (Hunters):** An engaging, native Android app where users explore their city to discover active drops. By physically walking to a location, they generate cryptographic proofs of location to claim rewards instantly on Solana using the Mobile Wallet Adapter (MWA).

## Architecture & Tech Stack

This repository is structured as a modern PNPM workspace monorepo.

- **Web Portal (Sponsor Dashboard):** Next.js app located at the project root (`app/`). Built with Tailwind CSS and `@solana/kit` for Wallet Standard integration and cross-chain LiFi funding UI.
- **Mobile App (Hunter - Android):** React Native (Expo) app located in `apps/mobile/`. Utilizes `@solana/kit`, Mobile Wallet Adapter (MWA), and device GPS for location verification.
- **Smart Contract (Solana):** Anchor (Rust) program located in `anchor/`. Manages the Escrow PDAs and signature-based claim logic.
- **Shared SDK:** A generated Codama client located in `packages/geodrop-client/`. It ensures strict type safety across both Web and Mobile apps by emitting typed instructions directly from the Anchor IDL.

## Prerequisites

Ensure you have the following installed on your system before proceeding:

- [Node.js](https://nodejs.org/en/) (v20+ recommended)
- [PNPM](https://pnpm.io/installation)
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Local Setup & Development

Follow these steps to run the complete GeoDrop stack locally.

### 1. Install Dependencies

Ensure you are in the `geodrop` directory and install all workspace dependencies using PNPM.

```bash
cd geodrop
pnpm install
```

### 2. Build the Anchor Program & Generate SDK

Compile the Solana smart contract and generate the strictly typed Codama client into the shared workspace package.

```bash
# Build the Rust contract and emit the IDL & TypeScript client
pnpm run setup
```

### 3. Start the Web Portal (Sponsor Dashboard)

Run the Next.js development server. The dashboard will be available at `http://localhost:3000`.

```bash
# From the root of the geodrop directory
pnpm run dev
```

### 4. Start the Mobile App (Hunter)

Run the React Native Expo bundler. You can open it on an Android emulator or a physical device using the Expo Go app or a custom development build.

```bash
# In a new terminal window
cd apps/mobile
npx expo start
```
