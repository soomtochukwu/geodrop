import { useState, useEffect } from "react";
import {
  createSolanaRpc,
  type Account,
  getBase58Encoder,
  address,
  getBase64Encoder,
  type ReadonlyUint8Array,
} from "@solana/kit";
import { VAULT_PROGRAM_ADDRESS } from "@geodrop/client";
import { decodeDrop, type Drop, DROP_DISCRIMINATOR } from "@geodrop/client";

export function useDrops() {
  const [drops, setDrops] = useState<Account<Drop>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAllDrops() {
      setLoading(true);
      try {
        const rpc = createSolanaRpc("https://api.devnet.solana.com");
        const base64 = getBase64Encoder();

        // 1. Convert discriminator to base58 for the filter
        // Note: DROP_DISCRIMINATOR is already a Uint8Array, we just need to base58 encode it.
        const discBase58 = getBase58Encoder().encode(
          new TextDecoder().decode(DROP_DISCRIMINATOR)
        );

        // 2. Fetch all accounts owned by our program
        const programAccounts = await rpc
          .getProgramAccounts(address(VAULT_PROGRAM_ADDRESS), {
            encoding: "base64",
            filters: [
              {
                memcmp: {
                  offset: 0n,
                  bytes: discBase58 as any,
                  encoding: "base58",
                },
              },
            ],
          })
          .send();

        const decodedDrops: Account<Drop>[] = (programAccounts as any[])
          .map((acc) => {
            try {
              // Standardize data decoding for Mobile environment (Expo/Android)
              const rawData = acc.account.data;
              let data: ReadonlyUint8Array;

              if (Array.isArray(rawData)) {
                data = base64.encode(
                  rawData[0] as string
                ) as unknown as ReadonlyUint8Array;
              } else if (typeof rawData === "string") {
                data = base64.encode(rawData) as unknown as ReadonlyUint8Array;
              } else {
                data = rawData as ReadonlyUint8Array;
              }

              return decodeDrop({
                address: acc.pubkey,
                data: data,
              } as any);
            } catch (err) {
              console.warn(
                `[GeoDrop] Mobile: Failed to decode drop ${acc.pubkey}. Likely stale structure.`
              );
              return null;
            }
          })
          .filter(Boolean) as Account<Drop>[];

        // Filter out finished campaigns
        const activeDrops = decodedDrops.filter(
          (d) => BigInt(d.data.currentClaims) < BigInt(d.data.maxClaims)
        );

        setDrops(activeDrops);
      } catch (e) {
        console.error("[GeoDrop] Mobile: Failed to fetch drops:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAllDrops();

    const interval = setInterval(fetchAllDrops, 30000);
    return () => clearInterval(interval);
  }, []);

  return { drops, loading };
}
