"use client";

import { useState } from "react";
import {
  createSolanaRpc,
  getBase58Decoder,
  getBase64Decoder,
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  getTransactionEncoder,
  type Base64EncodedWireTransaction,
  type SignatureBytes,
  type SignaturesMap,
  type Transaction,
  type TransactionMessageBytes,
} from "@solana/kit";
import { useWallet } from "./wallet-context";
import { CLAIM_API_URL, RPC_URL } from "./config";

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

      // 1. Fetch a fresh blockhash for the transaction lifetime.
      const rpc = createSolanaRpc(RPC_URL);
      const {
        value: { blockhash, lastValidBlockHeight },
      } = await rpc.getLatestBlockhash().send();

      // Convert float coordinates to i64 micro-degrees (matching the Anchor program).
      const latMicro = Math.round(lat * 1_000_000);
      const longMicro = Math.round(lng * 1_000_000);

      // 2. Ask the backend oracle to verify location + humanity and partially sign.
      const response = await fetch(CLAIM_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latMicro,
          long: longMicro,
          hunterPubkey: wallet.address,
          dropPubkey: dropAddress,
          blockhash,
          lastValidBlockHeight: Number(lastValidBlockHeight),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Backend verification failed");
      }

      const { messageBase64, signatures } = (await response.json()) as {
        messageBase64: string;
        signatures: Record<string, string | null>;
      };

      const base64 = getBase64Encoder();
      const messageBytes = base64.encode(
        messageBase64
      ) as unknown as TransactionMessageBytes;

      // 3. Rebuild the signatures map in signer order (the wire format
      // requires one 64-byte slot per required signer, in the order they
      // appear in the compiled message). The hunter's slot stays null and
      // is zero-filled by the encoder until the wallet signs.
      const compiledMessage =
        getCompiledTransactionMessageDecoder().decode(messageBytes);
      const signerAddresses = compiledMessage.staticAccounts.slice(
        0,
        compiledMessage.header.numSignerAccounts
      );

      const orderedSignatures: SignaturesMap = {};
      for (const signerAddress of signerAddresses) {
        const sig = signatures[signerAddress];
        orderedSignatures[signerAddress] = sig
          ? (base64.encode(sig) as SignatureBytes)
          : null;
      }

      const transaction: Transaction = {
        messageBytes,
        signatures: orderedSignatures,
      };
      const wireTransaction = new Uint8Array(
        getTransactionEncoder().encode(transaction)
      );

      // 4. Have the user's wallet co-sign as fee payer and submit.
      let signatureBase58: string;
      if (wallet.signTransaction) {
        const signedWire = await wallet.signTransaction(wireTransaction);
        signatureBase58 = await rpc
          .sendTransaction(
            getBase64Decoder().decode(
              signedWire
            ) as Base64EncodedWireTransaction,
            { encoding: "base64", preflightCommitment: "confirmed" }
          )
          .send();
      } else if (wallet.signAndSendTransaction) {
        const sigBytes = await wallet.signAndSendTransaction(wireTransaction);
        signatureBase58 = getBase58Decoder().decode(sigBytes);
      } else {
        throw new Error("Wallet cannot sign transactions");
      }

      console.log("[GeoDrop] Claim Success:", signatureBase58);
      setTxSignature(signatureBase58);
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
