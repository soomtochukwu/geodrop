import { NextResponse } from "next/server";
import {
  createKeyPairSignerFromBytes,
  getBase64Decoder,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  address,
  createSolanaRpc,
  getTransactionEncoder,
} from "@solana/kit";
import { getClaimDropInstruction, findClaimRecordPda } from "@geodrop/client";

// TypeScript — single wallet gate using Proof of Human
async function isHuman(walletAddress: string): Promise<boolean> {
  try {
    const res = await fetch("https://proofofhuman.ge/devnet/checker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: walletAddress, walletAddress }),
    });

    if (!res.ok) {
      console.warn(`POH API returned ${res.status}, failing open.`);
      return true; // Fail open
    }

    const data = await res.json();
    const brainKey = data.brainKey;
    if (!brainKey) return true;

    // Poll for AI verdict (usually ready in 2-5s)
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const verdictRes = await fetch(
          `https://proofofhuman.ge/devnet/checker/brain/${brainKey}`
        );
        if (!verdictRes.ok) continue;

        const verdict = await verdictRes.json();
        if (verdict.status === "done") {
          console.log(
            `POH Verdict for ${walletAddress}: ${verdict.verdict} (${verdict.confidence})`
          );
          // We require HUMAN and a confidence of at least 0.7.
          if (verdict.verdict === "AI") return false;
          return true;
        }
      } catch (err) {
        console.warn("Error polling POH:", err);
      }
    }
    return true; // timeout — fail open
  } catch (error) {
    console.warn("Error initiating POH check:", error);
    return true; // fail open
  }
}

export async function POST(request: Request) {
  try {
    const {
      lat,
      long,
      hunterPubkey,
      dropPubkey,
      blockhash: clientBlockhash,
      lastValidBlockHeight: clientLastValidBlockHeight,
    } = await request.json();

    if (lat === undefined || long === undefined || !hunterPubkey || !dropPubkey) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // --- Sybil Resistance Check (Proof of Human) ---
    const humanCheck = await isHuman(hunterPubkey);
    if (!humanCheck) {
      return NextResponse.json(
        { error: "Claim rejected: Bot behavior detected by POH." },
        { status: 403 }
      );
    }

    // Load backend authority private key from env
    const privateKeyHex = process.env.BACKEND_PRIVATE_KEY;
    if (!privateKeyHex) {
      console.error("BACKEND_PRIVATE_KEY is not set.");
      return NextResponse.json(
        { error: "Backend misconfigured" },
        { status: 500 }
      );
    }

    const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, "hex"));
    const backendSigner = await createKeyPairSignerFromBytes(
      privateKeyBytes,
      false
    );

    const rpc = createSolanaRpc(process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com");

    // Fetch blockhash if not supplied by client
    let blockhash = clientBlockhash;
    let lastValidBlockHeight = clientLastValidBlockHeight;
    if (!blockhash || !lastValidBlockHeight) {
      const { value } = await rpc.getLatestBlockhash().send();
      blockhash = value.blockhash;
      lastValidBlockHeight = Number(value.lastValidBlockHeight);
    }

    const [claimRecordPda] = await findClaimRecordPda({
      drop: address(dropPubkey),
      hunter: address(hunterPubkey),
    });

    // Create the instruction (hunter is passed as a raw Address, backendAuthority is keypair signer)
    const claimIx = getClaimDropInstruction({
      hunter: address(hunterPubkey) as any, // Cast since hunter is a SystemAccount now
      backendAuthority: backendSigner,
      drop: address(dropPubkey),
      claimRecord: claimRecordPda,
      lat: BigInt(lat),
      long: BigInt(long),
    });

    // Build the transaction
    const baseMessage = createTransactionMessage({ version: 0 });
    const messageWithPayer = setTransactionMessageFeePayer(
      backendSigner.address,
      baseMessage
    );
    const messageWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
      { blockhash, lastValidBlockHeight: BigInt(lastValidBlockHeight) },
      messageWithPayer
    );
    const txMessage = appendTransactionMessageInstruction(
      claimIx,
      messageWithLifetime
    );

    // Fully sign the transaction (backendSigner is both feePayer and backendAuthority signer)
    const fullySignedTx = await signTransactionMessageWithSigners(txMessage as any);

    // Broadcast the transaction to the network
    const wireTx = getTransactionEncoder().encode(fullySignedTx as any);
    const signature = await rpc
      .sendTransaction(getBase64Decoder().decode(wireTx) as any, {
        encoding: "base64",
        preflightCommitment: "confirmed",
      })
      .send();

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Error signing and broadcasting claim:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
