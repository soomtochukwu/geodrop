/**
 * Runtime configuration. Mirrors the mobile app's hardcoded devnet setup but
 * overridable per deployment via NEXT_PUBLIC_* env vars.
 */
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

/** Wallet Standard chain identifier used when asking the wallet to sign. */
export const SOLANA_CHAIN =
  process.env.NEXT_PUBLIC_SOLANA_CHAIN ?? "solana:devnet";

/**
 * The claim oracle endpoint. Defaults to this app's own /api/claim route;
 * point it at the deployed sponsor dashboard (e.g.
 * https://original-geodrop.vercel.app/api/claim) to reuse its backend key.
 */
export const CLAIM_API_URL =
  process.env.NEXT_PUBLIC_CLAIM_API_URL ?? "/api/claim";

export const EXPLORER_CLUSTER_SUFFIX =
  SOLANA_CHAIN === "solana:mainnet" ? "" : `?cluster=${SOLANA_CHAIN.slice(7)}`;

export function getExplorerTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}${EXPLORER_CLUSTER_SUFFIX}`;
}
