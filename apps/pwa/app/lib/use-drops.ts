"use client";

import { useEffect, useState } from "react";
import {
  createSolanaRpc,
  address,
  type Account,
  type ReadonlyUint8Array,
} from "@solana/kit";
import {
  decodeDrop,
  DROP_DISCRIMINATOR,
  VAULT_PROGRAM_ADDRESS,
  findClaimRecordPda,
  type Drop,
} from "@geodrop/client";
import { RPC_URL } from "./config";

function base64ToBytes(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function hasDropDiscriminator(data: Uint8Array) {
  if (data.length < DROP_DISCRIMINATOR.length) return false;
  return DROP_DISCRIMINATOR.every((byte, i) => data[i] === byte);
}

/**
  * Port of the mobile app's hooks/useDrops.ts: fetches every active and past drop
  * account from the vault program and checks if the current user has claimed them.
  */
export function useDrops(walletAddress?: string) {
  const [drops, setDrops] = useState<Account<Drop>[]>([]);
  const [claimedDrops, setClaimedDrops] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  const refresh = () => setTriggerRefresh((prev) => prev + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllDrops() {
      setLoading(true);
      try {
        const rpc = createSolanaRpc(RPC_URL);
        const erRpc = createSolanaRpc("https://devnet-router.magicblock.app");
        const DELEGATION_PROGRAM = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";

        // Fetch undelegated drops
        const baseAccountsPromise = rpc
          .getProgramAccounts(address(VAULT_PROGRAM_ADDRESS), {
            encoding: "base64",
          })
          .send();

        // Fetch delegated drops
        const delegatedAccountsPromise = rpc
          .getProgramAccounts(address(DELEGATION_PROGRAM), {
            encoding: "base64",
          })
          .send();

        const [baseAccounts, delegatedAccounts] = await Promise.all([
          baseAccountsPromise,
          delegatedAccountsPromise,
        ]);

        // Filter delegated program accounts to only include our drops
        const filteredDelegated = delegatedAccounts.filter((acc) => {
          try {
            const rawData = acc.account.data;
            const data = Array.isArray(rawData)
              ? base64ToBytes(rawData[0] as string)
              : base64ToBytes(rawData as unknown as string);
            return hasDropDiscriminator(data);
          } catch {
            return false;
          }
        });

        const programAccounts = [...baseAccounts, ...filteredDelegated];

        const decodedDrops = await Promise.all(
          programAccounts.map(async (acc) => {
            try {
              const isDelegated = acc.account.owner === DELEGATION_PROGRAM;
              let rawData = acc.account.data;

              if (isDelegated) {
                try {
                  const erAcc = await erRpc
                    .getAccountInfo(acc.pubkey, { encoding: "base64" })
                    .send();
                  if (erAcc && erAcc.value) {
                    rawData = erAcc.value.data;
                  }
                } catch (err) {
                  console.warn("[GeoDrop] Failed to fetch delegated drop state from ER:", err);
                }
              }

              const data = Array.isArray(rawData)
                ? base64ToBytes(rawData[0] as string)
                : typeof rawData === "string"
                  ? base64ToBytes(rawData)
                  : (rawData as unknown as Uint8Array);

              if (!hasDropDiscriminator(data)) return null;

              return decodeDrop({
                address: acc.pubkey,
                data: data as unknown as ReadonlyUint8Array,
              } as Parameters<typeof decodeDrop>[0]);
            } catch {
              return null;
            }
          })
        );

        const activeDrops = decodedDrops.filter(Boolean) as Account<Drop>[];

        if (!cancelled) setDrops(activeDrops);

        // Batch fetch claimed records if hunter wallet is connected
        if (walletAddress && activeDrops.length > 0) {
          const pdaPromises = activeDrops.map(async (d) => {
            const pda = await findClaimRecordPda({
              drop: address(d.address),
              hunter: address(walletAddress),
            });
            return { dropAddress: d.address, pdaAddress: pda[0] };
          });
          const pdas = await Promise.all(pdaPromises);
          const pdaAddresses = pdas.map((p) => address(p.pdaAddress));

          // Fetch all in a single batch on base layer
          const baseAccountsPromise = rpc.getMultipleAccounts(pdaAddresses).send();
          // Fetch all in a single batch on ER
          const erAccountsPromise = erRpc.getMultipleAccounts(pdaAddresses).send();

          const [baseAccountsRes, erAccountsRes] = await Promise.all([
            baseAccountsPromise,
            erAccountsPromise,
          ]);

          const claimedMap: Record<string, boolean> = {};
          pdas.forEach((p, idx) => {
            const baseAcc = baseAccountsRes.value[idx];
            const erAcc = erAccountsRes.value[idx];
            if (baseAcc || erAcc) {
              claimedMap[p.dropAddress] = true;
            }
          });

          if (!cancelled) setClaimedDrops(claimedMap);
        } else {
          if (!cancelled) setClaimedDrops({});
        }
      } catch (e) {
        console.error("[GeoDrop] Failed to fetch drops:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAllDrops();
    const interval = setInterval(fetchAllDrops, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [walletAddress, triggerRefresh]);

  return { drops, claimedDrops, loading, refresh };
}
