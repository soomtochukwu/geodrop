"use client";

import { useState } from "react";
import { useWallet } from "./wallet-context";
import { CLAIM_API_URL } from "./config";

export type ClaimStatus = "idle" | "claiming" | "success" | "error";

/**
 * Port of the mobile app's hooks/useClaimBounty.android.ts. Same backend
 * contract: POST the claim to the oracle, get back a partially signed
 * transaction ({ messageBase64, signatures }), then have the user's wallet
 * co-sign as fee payer and submit. The only difference is the signer: the
 * browser Wallet Standard instead of Solana Mobile Wallet Adapter.
 */
export function useClaimBounty() {
  const { wallet } = useWallet();
  const [status, setStatus] = useState<ClaimStatus>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const claimBounty = async (dropAddress: string, lat: number, lng: number) => {
    if (!wallet) {
      setErrorMessage("Wallet not connected");
      setStatus("error");
      return;
    }

    try {
      setStatus("claiming");
      setErrorMessage(null);
      setTxSignature(null);

      // Convert float coordinates to i64 micro-degrees (matching the Anchor program).
      const latMicro = Math.round(lat * 1_000_000);
      const longMicro = Math.round(lng * 1_000_000);

      // Ask the backend oracle to verify location + humanity, sign and broadcast.
      const response = await fetch(CLAIM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latMicro,
          long: longMicro,
          hunterPubkey: wallet.address,
          dropPubkey: dropAddress,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Claim failed");
      }

      const { signature } = await response.json();

      console.log("[GeoDrop] Claim Success:", signature);
      setTxSignature(signature);
      setStatus("success");
    } catch (e) {
      console.error("[GeoDrop] Claim Error:", e);
      setErrorMessage(e instanceof Error ? e.message : "Claim failed");
      setStatus("error");
    }
  };

  return {
    claimBounty,
    status,
    txSignature,
    errorMessage,
    isWalletAvailable: wallet !== null,
  };
}
