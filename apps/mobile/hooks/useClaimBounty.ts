import { useMobileWallet } from "@wallet-ui/react-native-kit";
import { useState } from "react";
import { address, createNoopSigner, type TransactionSigner } from "@solana/kit";
import { getClaimDropInstruction } from "@geodrop/client";

export const useClaimBounty = () => {
  const { sendTransaction, account, connect } = useMobileWallet();
  const [status, setStatus] = useState<
    "idle" | "claiming" | "success" | "error"
  >("idle");

  const claimBounty = async (dropAddress: string) => {
    try {
      let currentAccount = account;
      if (!currentAccount) {
        currentAccount = await connect();
      }

      setStatus("claiming");

      const instruction = getClaimDropInstruction({
        hunter: createNoopSigner(currentAccount.address) as TransactionSigner,
        drop: address(dropAddress),
        lat: 105000000n,
        long: 205000000n,
      });

      const signature = await sendTransaction([instruction]);
      console.log("[GeoDrop] Claim Success:", signature);
      setStatus("success");
    } catch (e) {
      console.error("[GeoDrop] Claim Error:", e);
      setStatus("error");
    }
  };

  return { claimBounty, status };
};
