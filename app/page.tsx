"use client";

import { useState, useEffect } from "react";
import {
  lamports as sol,
  type Account,
  address as addressHelper,
  type ReadonlyUint8Array,
} from "@solana/kit";
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
import { decodeDrop, VAULT_PROGRAM_ADDRESS, type Drop } from "@geodrop/client";
import {
  Plus,
  LayoutGrid,
  Loader2,
  Wallet,
  X,
  Smartphone,
  CheckCircle2,
  Copy,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { wallet, status } = useWallet();
  const { cluster, getExplorerUrl } = useCluster();
  const client = useSolanaClient();

  const address = wallet?.account.address;
  const balance = useBalance(address);
  const [copied, setCopied] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  const [myDrops, setMyDrops] = useState<Account<Drop>[]>([]);
  const [isLoadingDrops, setIsLoadingDrops] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog((prev) => [...prev.slice(-6), msg]);
  };

  // Randomly trigger attention pulse for CTA
  useEffect(() => {
    const initialTimer = setTimeout(() => setShouldPulse(true), 2000);
    const triggerPulse = () => {
      setShouldPulse(true);
      setTimeout(() => setShouldPulse(false), 1500);
      const nextInterval =
        Math.floor(Math.random() * (20000 - 8000 + 1)) + 8000;
      return setTimeout(triggerPulse, nextInterval);
    };
    const pulseTimeout = setTimeout(triggerPulse, 10000);
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(pulseTimeout);
    };
  }, []);

  // Fetch campaigns for the connected sponsor
  useEffect(() => {
    async function fetchCampaigns() {
      if (!address || status !== "connected") {
        setMyDrops([]);
        return;
      }

      setIsLoadingDrops(true);
      addLog(`[GeoDrop] Sponsor Detected: ${ellipsify(address, 4)}`);

      try {
        const programAccounts = await client.rpc
          .getProgramAccounts(addressHelper(VAULT_PROGRAM_ADDRESS), {
            encoding: "base64",
          })
          .send();

        addLog(
          `[GeoDrop] RPC returned ${programAccounts.length} program accounts.`
        );

        const decodedDrops: Account<Drop>[] = programAccounts
          .map((acc) => {
            try {
              const rawData = acc.account.data;
              let data: Uint8Array;

              if (Array.isArray(rawData)) {
                // Convert base64 string to Uint8Array using browser native atob
                const binaryString = atob(rawData[0] as string);
                data = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  data[i] = binaryString.charCodeAt(i);
                }
              } else if (typeof rawData === "string") {
                const binaryString = atob(rawData);
                data = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  data[i] = binaryString.charCodeAt(i);
                }
              } else {
                data = rawData as any;
              }

              const decoded = decodeDrop({
                address: acc.pubkey,
                data: data as unknown as ReadonlyUint8Array,
              } as any);

              if (decoded.data.sponsor.toString() !== address.toString()) {
                return null;
              }

              return decoded;
            } catch (err) {
              return null;
            }
          })
          .filter(Boolean) as Account<Drop>[];

        addLog(
          `[GeoDrop] Successfully synced ${decodedDrops.length} campaigns.`
        );
        setMyDrops(decodedDrops);
      } catch (e) {
        console.error("[GeoDrop] Dashboard sync failed:", e);
        addLog(
          `[GeoDrop] Error: ${e instanceof Error ? e.message : "Unknown RPC error"}`
        );
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
      toast.error("Airdrop failed. Try again later.");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <GridBackground />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            <Link
              href="/"
              className="font-mono text-xs font-bold uppercase tracking-widest text-white"
            >
              GeoDrop // Sponsor_Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ClusterSelect />
            <WalletButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6">
          <section className="pt-6 pb-20 md:pt-8 md:pb-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4">
                <h1 className="font-black tracking-tight text-foreground">
                  <span className="block text-6xl md:text-7xl text-white">
                    Geo
                  </span>
                  <span className="block text-7xl md:text-8xl text-indigo-500">
                    Drop
                  </span>
                </h1>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/campaign/create"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-500 px-8 text-sm font-bold text-white transition-all hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    <Plus className="h-4 w-4" />
                    CREATE_NEW_DROP
                  </Link>
                  <button
                    onClick={() => setShowDemo(true)}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-sm font-medium text-foreground transition-all hover:bg-white/10"
                  >
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
                  <div className="flex items-center gap-1 text-white">
                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                    <span>Cross-Chain Capable</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <div className="h-1 w-1 rounded-full bg-indigo-500" />
                    <span>Powered by Solana</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
            <div className="lg:col-span-2 space-y-10">
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-indigo-400" />
                    <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-white">
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
                      No active drops found for this sponsor address. Ensure you
                      are connected to the correct cluster and wallet.
                    </p>
                    <Link
                      href="/campaign/create"
                      className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      [+] DEPLOY_NEW_CAMPAIGN
                    </Link>
                  </div>
                )}

                {/* Diagnostics */}
                {status === "connected" && debugLog.length > 0 && (
                  <div className="mt-8 rounded-xl border border-white/5 bg-black/40 p-4">
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
                      <AlertCircle className="h-3 w-3" />
                      REAL_TIME_DIAGNOSTICS
                    </div>
                    <div className="space-y-1">
                      {debugLog.map((log, i) => (
                        <p
                          key={i}
                          className="font-mono text-[9px] text-muted-foreground break-all"
                        >
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-10">
              {status === "connected" && address && (
                <section className="relative w-full overflow-hidden rounded-2xl border border-white/5 bg-card/50 p-6 backdrop-blur-xl">
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10">
                        <Wallet className="h-3 w-3 text-indigo-500" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-white">
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
                    <p className="font-mono text-3xl font-black tabular-nums tracking-tighter text-white">
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
                    {copied ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </section>
              )}
              <VaultCard />
            </div>
          </div>
        </main>
      </div>

      {showDemo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl p-4 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowDemo(false)}
              className="absolute -top-12 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/aog9_mYFT28?si=Ch4qEukIvS_vX3C6&autoplay=1"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[50] animate-in slide-in-from-right-8 duration-700 delay-500">
        <a
          href="https://wf-artifacts.eascdn.net/builds/internal-st/074e2a04-0740-457b-bd5b-1e54049e04ea/87c9e5d0-1acb-4294-9308-4f2572e077da/019e1176-4e26-75fb-9fed-a07f45296657/application-87c9e5d0-1acb-4294-9308-4f2572e077da.apk?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=75d871a1a44e598975dd84fa2341c9b0%2F20260510%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260510T105530Z&X-Amz-Expires=900&X-Amz-Signature=01d668553b37e1b7a0fa4015185b28dc5d3c51dcc21fa42a2fc47893ade7431f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-end gap-2"
        >
          <span className="rounded-lg bg-black/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-400 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 border border-white/10 shadow-xl text-center text-xs">
            Download_Hunter_v1.0.apk
          </span>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20 text-white shadow-[0_0_30px_rgba(99,102,241,0.2)] backdrop-blur-xl transition-all hover:scale-110 hover:border-indigo-500 hover:bg-indigo-500 active:scale-95 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] ${shouldPulse ? "animate-cta-attention" : ""}`}
          >
            <Smartphone className="h-6 w-6" />
          </div>
        </a>
      </div>
    </div>
  );
}
