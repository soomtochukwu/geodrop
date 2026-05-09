import { NextResponse } from "next/server";
import {
  createKeyPairSignerFromBytes,
  getBase64Decoder,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  partiallySignTransactionMessageWithSigners,
  address,
} from "@solana/kit";
import { getClaimDropInstruction } from "@geodrop/client";

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
          // However, we don't want to block UNCERTAIN or users with low history in this MVP unless they are explicitly AI.
          if (verdict.verdict === "AI") return false;
          if (verdict.verdict === "HUMAN" && verdict.confidence < 0.7) {
            console.log("Human confidence too low, but passing for MVP.");
          }
          return true;
        }
      } catch (err) {
        console.warn("Error polling POH:", err);
      }
    }
    return true; // timeout — fail open (never block on infrastructure failure)
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
      blockhash,
      lastValidBlockHeight,
    } = await request.json();

    if (
      !lat ||
      !long ||
      !hunterPubkey ||
      !dropPubkey ||
      !blockhash ||
      !lastValidBlockHeight
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // --- Sybil Resistance Check (Proof of Human) ---
    console.log(`Checking humanity of ${hunterPubkey}...`);
    const humanCheck = await isHuman(hunterPubkey);
    if (!humanCheck) {
      console.log(`Bot detected: ${hunterPubkey}`);
      return NextResponse.json(
        { error: "Claim rejected: Bot behavior detected by POH." },
        { status: 403 }
      );
    }

    // In a real app, this is where you'd query your database or an external API
    // to verify the hunter is actually at (lat, long) and it matches the drop's radius.
    // For this MVP, we log and proceed.
    console.log(
      `Verifying location for hunter ${hunterPubkey} at ${lat}, ${long}`
    );

    // Load backend authority private key from env (hex encoded for simplicity)
    const privateKeyHex = process.env.BACKEND_PRIVATE_KEY;
    if (!privateKeyHex) {
      // In hackathon dev mode, just return a success so the client knows it reached here,
      // but without the real signature it will fail on-chain unless we hardcode a test key.
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

    // Create the instruction
    const claimIx = getClaimDropInstruction({
      hunter: address(hunterPubkey),
      backendAuthority: backendSigner,
      drop: address(dropPubkey),
      lat: BigInt(lat),
      long: BigInt(long),
    });

    // Build the transaction
    const baseMessage = createTransactionMessage({ version: 0 });
    const messageWithPayer = setTransactionMessageFeePayer(
      address(hunterPubkey),
      baseMessage
    );
    const messageWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
      { blockhash, lastValidBlockHeight },
      messageWithPayer
    );
    const txMessage = appendTransactionMessageInstruction(
      claimIx,
      messageWithLifetime
    );

    // Partially sign with the backend authority
    const partiallySignedTx =
      await partiallySignTransactionMessageWithSigners(txMessage);

    // We can return the transaction bytes directly
    // Using an internal Solana Kit utility or simply returning the signatures and compiled message
    const base64Decoder = getBase64Decoder();

    // Encode the fully assembled transaction (it has signatures record but missing hunter's)
    // To send it back to the client, we can send the signatures and the message bytes
    const signatures = partiallySignedTx.signatures;
    const serializedSignatures = Object.fromEntries(
      Object.entries(signatures).map(([key, sig]) => [
        key,
        base64Decoder.decode(sig as Uint8Array),
      ])
    );

    return NextResponse.json({
      messageBase64: base64Decoder.decode(partiallySignedTx.messageBytes),
      signatures: serializedSignatures,
    });
  } catch (error) {
    console.error("Error signing claim:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
