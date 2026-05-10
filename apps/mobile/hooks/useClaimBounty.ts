import { useMobileWallet } from "@wallet-ui/react-native-kit";
import { useState } from "react";
import {
  address,
  createSolanaRpc,
  getBase64Encoder,
  type Transaction,
  type SignatureBytes,
  type TransactionMessageBytes,
  type SignaturesMap,
  type Address,
} from "@solana/kit";

export const useClaimBounty = () => {
  const { signAndSendTransaction, account, connect } = useMobileWallet();
  const [status, setStatus] = useState<
    "idle" | "claiming" | "success" | "error"
  >("idle");

  const claimBounty = async (dropAddress: string, lat: number, lng: number) => {
    try {
      let currentAccount = account;
      if (!currentAccount) {
        currentAccount = await connect();
      }

      setStatus("claiming");

      // 1. Fetch latest blockhash
      const rpc = createSolanaRpc("https://api.devnet.solana.com");
      const {
        value: { blockhash, lastValidBlockHeight },
      } = await rpc.getLatestBlockhash().send();

      // Convert float coordinates to i64 micro-degrees (matching Anchor program)
      const latMicro = Math.round(lat * 1_000_000);
      const longMicro = Math.round(lng * 1_000_000);

      // 2. Call backend API to verify location and humanity, and get partial signature
      // Note: 10.0.2.2 is the localhost address for Android emulator to reach the host machine.
      const response = await fetch("http://10.0.2.2:3000/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latMicro,
          long: longMicro,
          hunterPubkey: currentAccount.address,
          dropPubkey: dropAddress,
          blockhash,
          lastValidBlockHeight,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("[GeoDrop] Backend Error:", errData);
        throw new Error(errData.error || "Backend verification failed");
      }

      const { messageBase64, signatures } = await response.json();

      const base64Encoder = getBase64Encoder();

      // Decode backend signatures back to Uint8Array
      const decodedSignatures: SignaturesMap = {};
      for (const [key, base64Sig] of Object.entries(signatures)) {
        decodedSignatures[address(key)] = base64Encoder.encode(
          base64Sig as string
        ) as SignatureBytes;
      }

      // Construct the @solana/kit Transaction object
      const transaction: Transaction = {
        messageBytes: base64Encoder.encode(
          messageBase64
        ) as TransactionMessageBytes,
        signatures: decodedSignatures,
      };

      // 3. Request MWA to sign and send the transaction
      const txSignatures = await signAndSendTransaction(
        transaction,
        BigInt(lastValidBlockHeight)
      );

      // The signature for the fee payer (hunter) is returned directly
      const hunterSignature = txSignatures;
      console.log("[GeoDrop] Claim Success:", hunterSignature);
      setStatus("success");
    } catch (e) {
      console.error("[GeoDrop] Claim Error:", e);
      setStatus("error");
    }
  };

  return { claimBounty, status };
};
