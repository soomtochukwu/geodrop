import { NextResponse } from 'next/server';
import {
  createKeyPairSignerFromBytes,
  getBase64Decoder,
  getBase64Encoder,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  compileTransactionMessage,
  partiallySignTransactionMessageWithSigners,
  address,
} from '@solana/kit';
import { getClaimDropInstruction } from '@geodrop/client';

export async function POST(request: Request) {
  try {
    const { lat, long, hunterPubkey, dropPubkey, blockhash, lastValidBlockHeight } = await request.json();

    if (!lat || !long || !hunterPubkey || !dropPubkey || !blockhash || !lastValidBlockHeight) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // In a real app, this is where you'd query your database or an external API
    // to verify the hunter is actually at (lat, long) and it matches the drop's radius.
    // For this MVP, we log and proceed.
    console.log(`Verifying location for hunter ${hunterPubkey} at ${lat}, ${long}`);

    // Load backend authority private key from env (hex encoded for simplicity)
    const privateKeyHex = process.env.BACKEND_PRIVATE_KEY;
    if (!privateKeyHex) {
      // In hackathon dev mode, just return a success so the client knows it reached here,
      // but without the real signature it will fail on-chain unless we hardcode a test key.
      console.error("BACKEND_PRIVATE_KEY is not set.");
      return NextResponse.json({ error: 'Backend misconfigured' }, { status: 500 });
    }
    
    const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, 'hex'));
    const backendSigner = await createKeyPairSignerFromBytes(privateKeyBytes, false);

    // Create the instruction
    const claimIx = getClaimDropInstruction({
      hunter: address(hunterPubkey),
      backendAuthority: backendSigner,
      drop: address(dropPubkey),
      lat: BigInt(lat),
      long: BigInt(long),
    });

    // Build the transaction
    let txMessage = createTransactionMessage({ version: 0 });
    txMessage = setTransactionMessageFeePayer(address(hunterPubkey), txMessage);
    txMessage = setTransactionMessageLifetimeUsingBlockhash(
      { blockhash, lastValidBlockHeight },
      txMessage
    );
    txMessage = appendTransactionMessageInstruction(claimIx, txMessage);

    const compiledMessage = compileTransactionMessage(txMessage);
    
    // Partially sign with the backend authority
    const partiallySignedTx = await partiallySignTransactionMessageWithSigners(compiledMessage);

    // We can return the transaction bytes directly
    // Using an internal Solana Kit utility or simply returning the signatures and compiled message
    const base64Encoder = getBase64Encoder();
    
    // Encode the fully assembled transaction (it has signatures record but missing hunter's)
    // To send it back to the client, we can send the signatures and the message bytes
    const signatures = partiallySignedTx.signatures;
    const serializedSignatures = Object.fromEntries(
      Object.entries(signatures).map(([key, sig]) => [key, base64Encoder.encode(sig)])
    );

    return NextResponse.json({
      messageBase64: base64Encoder.encode(compiledMessage.bytes),
      signatures: serializedSignatures,
    });

  } catch (error) {
    console.error('Error signing claim:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
