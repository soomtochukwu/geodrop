"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "../lib/wallet/context";
import { useSolanaClient } from "../lib/solana-client-context";
import { ellipsify } from "../lib/explorer";
import { GridBackground } from "../components/grid-background";
import { ThemeToggle } from "../components/theme-toggle";
import { ClusterSelect } from "../components/cluster-select";
import { WalletButton } from "../components/wallet-button";
import { address as addressHelper } from "@solana/kit";
import {
  Lock,
  Activity,
  Users,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Info
} from "lucide-react";

// Admin authorized wallet address
const AUTHORIZED_ADMIN_WALLET = "552usXzVzcLnZJCzyhokzWxmJpmVsZAV8pRywgShzj1u";

// Program IDs to track
const PROGRAM_IDS = [
  "6mEc28x37u7281vSXg5CwcVtj2qKVX4dX1vwrQYG1RNv",
  "4ysUbXcRMXJkmTx6y7ek34aDLkakG7ihpgZ4VEzXGmko",
];

interface ResponseItem {
  id: number;
  email: string;
  date: string;
  source?: string;
  wallet?: string;
  device?: string;
  location?: string;
  experience?: string;
}

export default function AdminPage() {
  const { wallet, status } = useWallet();
  const client = useSolanaClient();

  const userAddress = wallet?.account.address;
  const isAuthorized = userAddress === AUTHORIZED_ADMIN_WALLET;

  const [tvl, setTvl] = useState<number | null>(null);
  const [txCount, setTxCount] = useState<number | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const [activeTab, setActiveTab] = useState<"waitlist" | "beta">("waitlist");
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [sheetsConfigured, setSheetsConfigured] = useState(false);

  // Mock metrics from analytics
  const mau = 142;
  const ctr = 12.8;

  // Fetch On-chain Program Metrics (TVL & Txns)
  const fetchOnChainMetrics = useCallback(async () => {
    if (!client) return;
    setIsLoadingMetrics(true);
    try {
      let totalLamports = 0n;
      let totalTxns = 0;

      for (const programId of PROGRAM_IDS) {
        try {
          const addr = addressHelper(programId);
          // Query accounts
          const accounts = await client.rpc.getProgramAccounts(addr, { encoding: "base64" }).send();
          for (const acc of accounts) {
            totalLamports += acc.account.lamports;
          }

          // Query signature counts (limit count to avoid page weight)
          const sigs = await client.rpc.getSignaturesForAddress(addr, { limit: 100 }).send();
          totalTxns += sigs.length;
        } catch (e) {
          console.error(`Failed to fetch accounts for ${programId}:`, e);
        }
      }

      setTvl(Number(totalLamports) / 1_000_000_000);
      setTxCount(totalTxns);
    } catch (err) {
      console.error("Failed to query onchain metrics:", err);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [client]);

  // Fetch Waitlist / Beta responses from local API proxy
  const fetchFormResponses = useCallback(async () => {
    setIsLoadingResponses(true);
    try {
      const res = await fetch(`/api/admin/responses?type=${activeTab}`);
      const json = await res.json();
      if (json.success) {
        setResponses(json.data);
        setSheetsConfigured(json.configured);
      }
    } catch (e) {
      console.error("Failed to load form responses:", e);
    } finally {
      setIsLoadingResponses(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAuthorized) {
      const timer = setTimeout(() => {
        fetchOnChainMetrics();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthorized, fetchOnChainMetrics]);

  useEffect(() => {
    if (isAuthorized) {
      const timer = setTimeout(() => {
        fetchFormResponses();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthorized, fetchFormResponses]);

  if (status !== "connected") {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <GridBackground />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/5 bg-card/40 p-8 backdrop-blur-xl text-center space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Lock className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-white">Admin_Access_Required</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your authorized Solana administrator wallet to access metrics, user registrations, and platform settings.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <WalletButton />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <GridBackground />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/5 bg-card/40 p-8 backdrop-blur-xl text-center space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-mono text-lg font-bold uppercase tracking-widest text-destructive">Access_Denied</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Wallet <code className="text-white bg-white/5 px-1 py-0.5 rounded">{ellipsify(userAddress?.toString() || "", 4)}</code> is not authorized to view the admin console. Please switch to the correct administrator key.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex justify-center">
              <WalletButton />
            </div>
            <Link
              href="/"
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-indigo-400"
            >
              [ Back_To_Safety ]
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <GridBackground />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
              GeoDrop // Admin_Console
            </span>
          </Link>
          <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
            SECURE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ClusterSelect />
          <WalletButton />
        </div>
      </header>

      <main className="relative z-10 flex-1 mx-auto max-w-6xl w-full px-6 py-8 space-y-8">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block mb-1">
              {"// PLATFORM_MANAGEMENT"}
            </span>
            <h1 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight text-white">
              System_Overview
            </h1>
          </div>
          <button
            onClick={() => {
              fetchOnChainMetrics();
              fetchFormResponses();
            }}
            disabled={isLoadingMetrics || isLoadingResponses}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-indigo-400 hover:text-white bg-white/5 border border-white/5 rounded-lg px-4 py-2 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMetrics || isLoadingResponses ? "animate-spin" : ""}`} />
            Sync_All
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* TVL Card */}
          <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-2">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-white">TVL</span>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-mono font-black text-white">
                {tvl !== null ? `${tvl.toFixed(4)}` : "—"}
                <span className="text-xs font-normal text-muted-foreground ml-1">SOL</span>
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-mono">Real-time escrows locked</p>
            </div>
          </div>

          {/* Transaction Card */}
          <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-2">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-white">Transactions</span>
              <Activity className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-mono font-black text-white">
                {txCount !== null ? `${txCount}` : "—"}
                <span className="text-xs font-normal text-muted-foreground ml-1">TXS</span>
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-mono">Total on-chain campaigns activity</p>
            </div>
          </div>

          {/* MAU Card */}
          <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-2">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-white">MAU</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-mono font-black text-white">{mau}</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-mono">Monthly Active Users (Vercel)</p>
            </div>
          </div>

          {/* CTA CTR Card */}
          <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-2">
            <div className="flex justify-between items-start text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-white">CTA_CTR</span>
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-mono font-black text-white">{ctr}%</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-mono">Call-to-Action click conversion</p>
            </div>
          </div>
        </div>

        {/* Responses Table */}
        <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-4 gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("waitlist")}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition ${
                  activeTab === "waitlist"
                    ? "bg-indigo-500 text-white font-bold"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Waitlist_Signups
              </button>
              <button
                onClick={() => setActiveTab("beta")}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition ${
                  activeTab === "beta"
                    ? "bg-indigo-500 text-white font-bold"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Beta_Applications
              </button>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground uppercase bg-white/5 px-2 py-1 rounded">
              Source: {sheetsConfigured ? "Google Sheets Sync" : "Mock Fallback Database"}
            </span>
          </div>

          {isLoadingResponses ? (
            <div className="h-48 w-full flex items-center justify-center">
              <span className="font-mono text-xs text-muted-foreground animate-pulse uppercase tracking-widest">
                FETCHING_DATABASE_RESPONSES...
              </span>
            </div>
          ) : responses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="py-3 px-4 font-bold uppercase">ID</th>
                    <th className="py-3 px-4 font-bold uppercase">Email</th>
                    {activeTab === "beta" ? (
                      <>
                        <th className="py-3 px-4 font-bold uppercase">Wallet</th>
                        <th className="py-3 px-4 font-bold uppercase">Device</th>
                        <th className="py-3 px-4 font-bold uppercase">Location</th>
                        <th className="py-3 px-4 font-bold uppercase">Exp</th>
                      </>
                    ) : (
                      <th className="py-3 px-4 font-bold uppercase">Channel / Source</th>
                    )}
                    <th className="py-3 px-4 font-bold uppercase text-right">Registration_Date</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-white">#{item.id}</td>
                      <td className="py-3 px-4 text-white font-bold">{item.email}</td>
                      {activeTab === "beta" ? (
                        <>
                          <td className="py-3 px-4 text-indigo-400">{item.wallet}</td>
                          <td className="py-3 px-4 text-muted-foreground">{item.device}</td>
                          <td className="py-3 px-4 text-muted-foreground">{item.location}</td>
                          <td className="py-3 px-4 text-muted-foreground">{item.experience}</td>
                        </>
                      ) : (
                        <td className="py-3 px-4 text-indigo-400">{item.source}</td>
                      )}
                      <td className="py-3 px-4 text-muted-foreground text-right">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">No submissions logged</p>
            </div>
          )}
        </div>

        {/* Integration Instructions */}
        <div className="rounded-xl border border-white/5 bg-black/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase tracking-wider font-bold">
            <Info className="h-4 w-4" />
            GOOGLE_SHEETS_SYNCHRONIZATION_GUIDE
          </div>
          <p className="text-xs text-foreground/50 leading-relaxed max-w-3xl">
            This dashboard displays mock data as a fallback. To connect it directly to your live Google Forms spreadsheet, share your spreadsheet with a Google Service Account and supply these environment variables to your deployment environment:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[10px]">
            <div className="bg-black/60 rounded p-3 border border-white/5">
              <span className="block text-indigo-400 font-bold uppercase">GOOGLE_SHEET_ID</span>
              <span className="text-muted-foreground block mt-1 break-all">ID of the spreadsheet connected to Google Forms</span>
            </div>
            <div className="bg-black/60 rounded p-3 border border-white/5">
              <span className="block text-indigo-400 font-bold uppercase">GOOGLE_SERVICE_ACCOUNT_EMAIL</span>
              <span className="text-muted-foreground block mt-1 break-all">Email of the Google Cloud Project Service Account</span>
            </div>
            <div className="bg-black/60 rounded p-3 border border-white/5">
              <span className="block text-indigo-400 font-bold uppercase">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</span>
              <span className="text-muted-foreground block mt-1 break-all">The private key JSON of the Service Account</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
