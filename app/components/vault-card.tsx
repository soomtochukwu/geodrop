"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useBalance } from "../lib/hooks/use-balance";
import { lamportsFromSol, lamportsToSolString } from "../lib/lamports";
import { type Address } from "@solana/kit";
import { toast } from "sonner";
import {
  getDepositInstruction,
  getWithdrawInstruction,
  getWithdrawInstructionAsync,
  findVaultPda,
} from "@geodrop/client";
import { parseTransactionError } from "../lib/errors";
import { useCluster } from "./cluster-context";

export function VaultCard() {
  const { wallet, signer, status } = useWallet();
  const { send, isSending } = useSendTransaction();
  const { getExplorerUrl } = useCluster();

  const [amount, setAmount] = useState("");
  const [vaultAddress, setVaultAddress] = useState<Address | null>(null);

  const walletAddress = wallet?.account.address;

  // Derive vault PDA from generated IDL client
  useEffect(() => {
    async function updateVault() {
      if (walletAddress) {
        try {
          const [address] = await findVaultPda({ signer: walletAddress });
          setVaultAddress(address);
        } catch (e) {
          console.error("Failed to derive vault PDA", e);
        }
      }
    }
    updateVault();
  }, [walletAddress]);

  const vaultBalance = useBalance(vaultAddress ?? undefined);

  const handleAction = useCallback(
    async (type: "deposit" | "withdraw") => {
      if (!signer || !vaultAddress) return;

      try {
        let instruction;
        if (type === "deposit") {
          const lamports = BigInt(
            Math.round(parseFloat(amount) * 1_000_000_000)
          );
          instruction = getDepositInstruction({
            signer,
            vault: vaultAddress,
            amount: lamports,
          });
        } else {
          instruction = await getWithdrawInstructionAsync({
            signer,
            vault: vaultAddress,
          });
        }

        const signature = await send({ instructions: [instruction] });

        toast.success(
          `${type === "deposit" ? "Deposited" : "Withdrawn"} successfully!`,
          {
            description: signature ? (
              <a
                href={getExplorerUrl(`/tx/${signature}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View transaction
              </a>
            ) : undefined,
          }
        );
        setAmount("");
      } catch (err) {
        console.error(`${type} failed:`, err);
        toast.error(`${type.toUpperCase()}_FAILED`, {
          description: parseTransactionError(err),
        });
      }
    },
    [signer, vaultAddress, amount, send, getExplorerUrl]
  );

  if (status !== "connected") return null;

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-card/50 p-6 backdrop-blur-xl transition-all hover:border-indigo-500/20">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
          Escrow_Account
        </span>
      </div>

      <div className="mt-6 space-y-1">
        <p className="font-mono text-xs text-muted-foreground uppercase">
          Pooled_Assets
        </p>
        <p className="font-mono text-3xl font-black tabular-nums tracking-tighter text-white">
          {vaultBalance.lamports != null
            ? lamportsToSolString(vaultBalance.lamports)
            : "0.00"}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            SOL
          </span>
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-muted-foreground uppercase">
            SOL
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction("deposit")}
            disabled={isSending || !amount}
            className="flex h-10 items-center justify-center rounded-lg bg-white text-[10px] font-bold uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
          >
            Deposit
          </button>
          <button
            onClick={() => handleAction("withdraw")}
            disabled={isSending}
            className="flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
          >
            Withdraw_All
          </button>
        </div>
      </div>

      <div className="mt-6 border-t border-white/5 pt-4">
        <p className="text-center font-mono text-[8px] leading-relaxed text-muted-foreground uppercase tracking-wider">
          Funds in escrow are used to secure and initialize location-based
          bounties.
        </p>
      </div>
    </section>
  );
}
