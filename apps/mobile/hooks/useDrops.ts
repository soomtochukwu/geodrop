import { useState, useEffect } from "react";
import {
  createSolanaRpc,
  type Account,
  type Address,
  type Base58EncodedBytes,
  type EncodedAccount,
  getBase58Decoder,
  address,
} from "@solana/kit";
import { VAULT_PROGRAM_ADDRESS } from "@geodrop/client";
import { decodeDrop, type Drop, DROP_DISCRIMINATOR } from "@geodrop/client";

type ProgramAccount = {
  pubkey: Address;
  account: {
    data: unknown;
  };
};

export function useDrops() {
  const [drops, setDrops] = useState<Account<Drop>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAllDrops() {
      setLoading(true);
      try {
        const rpc = createSolanaRpc("https://api.devnet.solana.com");
        const dropDiscriminator = getBase58Decoder().decode(
          DROP_DISCRIMINATOR
        ) as Base58EncodedBytes;

        // Fetch all accounts owned by our program
        const programAccounts = await rpc
          .getProgramAccounts(address(VAULT_PROGRAM_ADDRESS), {
            encoding: "base64",
            filters: [
              {
                memcmp: {
                  offset: 0n,
                  bytes: dropDiscriminator,
                  encoding: "base58",
                },
              },
            ],
          })
          .send();

        const decodedDrops: Account<Drop>[] = (
          programAccounts as unknown as ProgramAccount[]
        ).map((account) => {
          return decodeDrop({
            address: account.pubkey,
            data: account.account.data,
          } as unknown as EncodedAccount);
        });

        setDrops(decodedDrops);
      } catch (e) {
        console.error("[GeoDrop] Failed to fetch drops:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAllDrops();

    // Poll every 30 seconds for new drops
    const interval = setInterval(fetchAllDrops, 30000);
    return () => clearInterval(interval);
  }, []);

  return { drops, loading };
}
