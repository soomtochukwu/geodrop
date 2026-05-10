import { useState, useEffect } from "react";
import {
  createSolanaRpc,
  type Account,
  getBase58Encoder,
  address,
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

        // Fetch all accounts owned by our program
        const programAccounts = await rpc
          .getProgramAccounts(address(VAULT_PROGRAM_ADDRESS), {
            encoding: "base64",
            filters: [
              {
                memcmp: {
                  offset: 0n,
                  bytes: getBase58Encoder().encode(
                    DROP_DISCRIMINATOR as any
                  ) as any,
                  encoding: "base58",
                },
              },
            ],
          })
          .send();

        const decodedDrops: Account<Drop>[] = (programAccounts as any[]).map(
          (account) => {
            return decodeDrop({
              address: account.pubkey,
              data: account.account.data,
            } as any);
          }
        );

        // Filter out finished campaigns
        const activeDrops = decodedDrops.filter(
          (d) => Number(d.data.currentClaims) < Number(d.data.maxClaims)
        );

        setDrops(activeDrops);
      } catch (e) {
        console.error("[GeoDrop] Failed to fetch drops:", e);
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
