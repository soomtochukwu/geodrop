"use client";

import { useState, useEffect } from "react";
import { lamports as sol, type Account, type Address } from "@solana/kit";
import { toast } from "sonner";
import { useWallet } from "./lib/wallet/context";
import { useBalance } from "./lib/hooks/use-balance";
import { lamportsToSolString } from "./lib/lamports";
import { useSolanaClient } from "./lib/solana-client-context";
import { ellipsify } from "./lib/explorer";
import { VaultCard } from "./components/vault-card";
import { GridBackground } from "./components/grid-background";
import { ThemeToggle } from "./components/theme-toggle";
import { ClusterSelect } from "./components/cluster-select";
import { WalletButton } from "./components/wallet-button";
import { useCluster } from "./components/cluster-context";
import { CampaignCard } from "./components/campaign/campaign-card";
import { fetchDrop, findDropPda } from "./generated/vault";
import { type Drop } from "./generated/vault/accounts";
import { Plus, LayoutGrid, Loader2, Wallet } from "lucide-react";

export default function Home() {
  const { wallet, status } = useWallet();
  const { cluster, getExplorerUrl } = useCluster();
  const client = useSolanaClient();

  const address = wallet?.account.address;
  const balance = useBalance(address);
  const [copied, setCopied] = useState(false);

  const [myDrops, setMyDrops] = useState<Account<Drop>[]>([]);
  const [isLoadingDrops, setIsLoadingDrops] = useState(false);

  // Fetch campaign for the connected sponsor
  useEffect(() => {
    async function fetchCampaigns() {
      if (!address || status !== "connected") {
        setMyDrops([]);
        return;
      }

      setIsLoadingDrops(true);
      try {
        const [pda] = await findDropPda({ sponsor: address });
        // We use fetchDrop which asserts the account exists
        const drop = await fetchDrop(client.rpc, pda);
        setMyDrops([drop]);
      } catch (e) {
        console.log("No active campaign found for this sponsor.");
        setMyDrops([]);
      } finally {
        setIsLoadingDrops(false);
      }
    }
    fetchCampaigns();
  }, [address, status, client.rpc]);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAirdrop = async () => {
    if (!address) return;
    try {
      toast.info("Requesting airdrop...");
      const sig = await client.airdrop(address, sol(1_000_000_000n));
      toast.success("Airdrop received!", {
        description: sig ? (
          <a
            href={getExplorerUrl(`/tx/${sig}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View transaction
          </a>
        ) : undefined,
      });
    } catch (err) {
      console.error("Airdrop failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimited =
        msg.includes("429") || msg.includes("Internal JSON-RPC error");
      toast.error(
        isRateLimited
          ? "Devnet faucet rate-limited. Use the web faucet instead."
          : "Airdrop failed. Try again later.",
        isRateLimited
          ? {
              description: (
                <a
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Open faucet.solana.com
                </a>
              ),
            }
          : undefined
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <GridBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              GeoDrop // Sponsor_Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ClusterSelect />
            <WalletButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6">
          {/* Hero */}
          <section className="pt-6 pb-20 md:pt-8 md:pb-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4">
                <h1 className="font-black tracking-tight text-foreground">
                  <span className="block text-6xl md:text-7xl">Geo</span>
                  <span className="block text-7xl md:text-8xl text-indigo-500">
                    Drop
                  </span>
                </h1>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/campaign/create"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-500 px-8 text-sm font-bold text-white transition-all hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    <Plus className="h-4 w-4" />
                    CREATE_NEW_DROP
                  </a>
                  <button className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-sm font-medium text-foreground transition-all hover:bg-white/10">
                    Watch Demo
                  </button>
                </div>
              </div>

              <div className="flex max-w-2xl flex-col gap-3">
                <p className="text-base leading-relaxed text-foreground/50">
                  The first location-aware bounty platform. Brands drop crypto
                  at physical coordinates, hunters claim them by walking there.
                  Seamlessly fund your campaign from any chain using our
                  integrated LI.FI bridge.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest opacity-40">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                    <span>Cross-Chain Capable</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-indigo-500" />
                    <span>Powered by Solana</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
            <div className="lg:col-span-2 space-y-10">
              {/* Dashboard Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-indigo-400" />
                    <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
                      My_Active_Campaigns
                    </h2>
                  </div>
                  {myDrops.length > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      Total_Nodes: 0{myDrops.length}
                    </span>
                  )}
                </div>

                {isLoadingDrops ? (
                  <div className="flex h-48 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/5 bg-white/[0.02]">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      SYNCHRONIZING_WITH_BLOCKCHAIN...
                    </p>
                  </div>
                ) : myDrops.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myDrops.map((drop) => (
                      <CampaignCard key={drop.address} drop={drop} />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 w-full flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/5 bg-white/[0.02] text-center px-6">
                    <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                      No active drops found. Initialize your first location-based bounty to begin real-world engagement.
                    </p>
                    <a
                      href="/campaign/create"
                      className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      [+] DEPLOY_FIRST_DROP
                    </a>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-10">
              {/* Wallet Balance Side Section */}
              {status === "connected" && address && (
                <section className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-card/50 p-6 backdrop-blur-xl">
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10">
                        <Wallet className="h-3 w-3 text-indigo-500" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
                        Vault_Status
                      </span>
                    </div>
                    {cluster !== "mainnet" && (
                      <button
                        onClick={handleAirdrop}
                        className="cursor-pointer font-mono text-[8px] uppercase tracking-widest text-indigo-400 underline underline-offset-4 hover:text-indigo-300"
                      >
                        [ Faucet ]
                      </button>
                    )}
                  </div>

                  <div className="mt-6 space-y-1">
                    <p className="font-mono text-xs text-muted-foreground uppercase">
                      Liquid_SOL
                    </p>
                    <p className="font-mono text-3xl font-black tabular-nums tracking-tighter">
                      {balance.lamports != null
                        ? lamportsToSolString(balance.lamports)
                        : "\u2014"}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        SOL
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="mt-6 flex w-full cursor-pointer items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {ellipsify(address, 6)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-muted-foreground"
                    >
                      {copied ? (
                        <path d="M20 6 9 17l-5-5" />
                      ) : (
                        <>
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </>
                      )}
                    </svg>
                  </button>
                </section>
              )}

              {/* Template content */}
              <VaultCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

