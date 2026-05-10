# [GeoDrop](https://original-geodrop.vercel.app/): Cross-Chain Physical Bounties

**"GeoDrop: Gamifying real-world onboarding to the Solana ecosystem. It's Pokémon GO meets cross-chain yield—driving foot traffic for merchants and crypto adoption for the masses."**

## What is GeoDrop?

GeoDrop is a decentralized, location-based bounty platform that turns the real world into an interactive crypto playground.

- **For Brands & Sponsors:** A frictionless way to run scalable, geo-targeted marketing campaigns. Sponsors can deploy multiple concurrent bounty drops at specific physical coordinates, set a custom number of winners per drop, and fund rewards seamlessly from Ethereum, Base, or Arbitrum using our LiFi integration.
- **For Users (Hunters):** An engaging, native Android app where users explore their city to discover live rewards. By physically walking to a location, they generate cryptographic proofs of location to claim an instant share of the bounty pool on Solana using the Mobile Wallet Adapter (MWA).

## 📱 Get the App

Experience the hunt on your Android device:
[**Download Hunter v1.0 (APK)**](https://wf-artifacts.eascdn.net/builds/internal-st/074e2a04-0740-457b-bd5b-1e54049e04ea/87c9e5d0-1acb-4294-9308-4f2572e077da/019e1176-4e26-75fb-9fed-a07f45296657/application-87c9e5d0-1acb-4294-9308-4f2572e077da.apk?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=75d871a1a44e598975dd84fa2341c9b0%2F20260510%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260510T105530Z&X-Amz-Expires=900&X-Amz-Signature=01d668553b37e1b7a0fa4015185b28dc5d3c51dcc21fa42a2fc47893ade7431f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

## User Flow

### 1. Web Portal (The Sponsor)

- **Campaign Creation:** A brand representative visits the GeoDrop web portal and selects a physical location on an interactive map using the integrated **Location Search** and **Locate Me** features.
- **Bounty Scaling:** The sponsor defines the **number of possible winners** and the **reward per claim** (e.g., 50 winners at 0.1 SOL each).
- **Flexible Funding:** Sponsors choose their preferred funding path:
  - **Direct Solana Pay:** Fund the bounty pool instantly using SOL from their connected Solana wallet.
  - **Cross-Chain Bridge:** Use the integrated **LiFi widget** to bridge and swap assets from EVM mainnets (Base, Ethereum, etc.) directly into the campaign escrow.
- **Initialization:** The portal generates a unique **Campaign ID** and initializes the drop on the Solana Anchor program, locking in the territory and rewards.
- **Sponsor Dashboard:** Track all active campaigns in real-time with **live progress bars** showing claim status and remaining pool balances fetched directly from the blockchain.

### 2. Mobile App (The Hunter)

- **Discovery:** A user opens the GeoDrop app and sees a real-time "Pokémon GO" style map populated with active bounty markers. Markers explicitly display the **number of remaining winner slots**.
- **The Hunt:** The user physically walks toward a bounty marker. The app uses the Haversine formula to calculate and display the live distance to the target in real-time.
- **Verification:** When the user enters the drop radius (e.g., 50 meters), the "Claim" button becomes active.
- **Security & Anti-Bot:** Upon pressing "Claim", the app sends the device's actual GPS coordinates to the GeoDrop backend. The backend performs two checks:
  1.  **Sybil Resistance:** It verifies the wallet's humanity using the **Proof of Human (POH) API** to block bot farms.
  2.  **Oracle Signature:** It confirms the coordinates are within the target radius and returns a cryptographic **ed25519 signature**.
- **On-Chain Claim:** The app triggers the **Mobile Wallet Adapter (MWA)**. The user signs a transaction that includes the backend's proof. The Solana program verifies the signature and transfers a portion of the bounty pool directly to the user. The campaign remains active for others until the maximum number of claims is reached.

## Technical Architecture

GeoDrop bridges the physical and digital worlds using a high-performance stack optimized for the Solana Mobile ecosystem.

### Monorepo Structure

The project is a PNPM workspace monorepo:

- **`app/`**: Next.js 15 (Turbopack) frontend for the Sponsor Dashboard.
- **`apps/mobile/`**: React Native (Expo) Android application.
- **`anchor/`**: Rust-based Solana smart contracts.
- **`packages/geodrop-client/`**: Shared TypeScript SDK generated via **Codama**, ensuring type-safe program interactions across web and mobile.

### Tech Stack & Integrations

- **Solana:** The core ledger for low-latency, high-volume physical bounties.
- **Anchor (Rust):** Secure program framework for managing Escrow PDAs and signature verification.
- **Next.js & Tailwind CSS:** Premium cyber-fintech UI for sponsors.
- **React Native (Expo):** Cross-platform mobile development with native Android GPS access.
- **@solana/kit (v2):** The next-generation Solana JavaScript library for lightweight, high-performance clients.
- **Mobile Wallet Adapter (MWA):** Industry-standard protocol for secure on-device transaction signing.
- **LiFi Protocol:** Cross-chain bridge and DEX aggregator powering frictionless campaign funding.
- **Proof of Human (POH):** AI-powered sybil resistance to prevent location-spoofing bot farms.
- **react-native-maps:** Immersive UI for real-world exploration.

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
