import { useState } from "react";
import { Platform } from "react-native";

type ClaimStatus = "idle" | "claiming" | "success" | "error" | "unavailable";

export const useClaimBounty = () => {
  const [status, setStatus] = useState<ClaimStatus>("idle");

  const claimBounty = async (...args: [string, number, number]) => {
    void args;
    setStatus("unavailable");
    console.warn(
      `[GeoDrop] Claiming is unavailable on ${Platform.OS}; Mobile Wallet Adapter is Android-only.`
    );
  };

  return { claimBounty, status, isWalletAvailable: false };
};
