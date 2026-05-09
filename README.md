# GeoDrop: Cross-Chain Physical Bounties

**"GeoDrop: Gamifying real-world onboarding to the Solana ecosystem. It's Pokémon GO meets cross-chain yield—driving foot traffic for merchants and crypto adoption for the masses."**

## What is GeoDrop?

GeoDrop is a decentralized, location-based bounty platform that turns the real world into an interactive crypto playground.

- **For Brands & Sponsors:** A frictionless way to run geo-targeted marketing campaigns. Sponsors can drop token bounties (e.g., USDC, SOL, or custom SPL tokens) at specific physical map coordinates, seamlessly funded from Ethereum, Base, or Arbitrum using our LiFi integration.
- **For Users (Hunters):** An engaging, native Android app where users explore their city to discover active drops. By physically walking to a location, they generate cryptographic proofs of location to claim rewards instantly on Solana using the Mobile Wallet Adapter (MWA).

## User Flow

### 1. Web Portal (The Sponsor)

- **Campaign Creation:** A brand representative visits the GeoDrop web portal and selects a physical location on an interactive map.
- **Funding (Cross-Chain):** The sponsor enters the total bounty amount (e.g., $1000). If their funds are on an EVM chain (like Base or Ethereum), they use the integrated **LiFi widget** to bridge and swap those assets directly into the campaign's Solana Escrow PDA in a single click.
- **Initialization:** Once funds arrive on Solana, the portal calls the `initialize_drop` instruction on the GeoDrop Anchor program, recording the coordinates, radius, and total bounty.

### 2. Mobile App (The Hunter)

- **Discovery:** A user opens the GeoDrop app and sees a real-time "Pokémon GO" style map populated with indigo-colored bounty markers in their city.
- **The Hunt:** The user physically walks toward a bounty marker. The app uses the Haversine formula to calculate and display the live distance to the target.
- **Verification:** When the user enters the drop radius (e.g., 50 meters), the "Claim" button becomes active.
- **Security & Anti-Bot:** Upon pressing "Claim", the app sends the device's GPS coordinates to the GeoDrop backend. The backend performs two checks:
  1.  **Sybil Resistance:** It verifies the wallet's humanity using the **Proof of Human (POH) API**.
  2.  **Oracle Signature:** It confirms the coordinates are within the target radius and returns a cryptographic **ed25519 signature**.
- **On-Chain Claim:** The app triggers the **Mobile Wallet Adapter (MWA)**. The user signs a transaction that includes the backend's proof. The Solana program verifies the signature and instantly transfers the SOL/SPL bounty to the user's wallet.

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
