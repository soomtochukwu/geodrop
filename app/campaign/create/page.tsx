"use client";

import { useState } from "react";
import { GridBackground } from "../../components/grid-background";
import { ThemeToggle } from "../../components/theme-toggle";
import { ClusterSelect } from "../../components/cluster-select";
import { WalletButton } from "../../components/wallet-button";
import { LiFiFundingWidget } from "../../components/lifi-funding-widget";
import { useWallet } from "../../lib/wallet/context";

export default function CreateCampaignPage() {
  const { status } = useWallet();
  const [step, setStep] = useState(3); // Defaulting to the funding step for this demo
  
  // Mock data for the demonstration
  const mockBountyAddress = "4ysUbXcRMXJkmTx6y7ek34aDLkakG7ihpgZ4VEzXGmko";

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
      <GridBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">
              GeoDrop // Sponsor_Node
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ClusterSelect />
            <WalletButton />
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-6 py-12">
          {/* Stepper Header */}
          <div className="mb-12 flex justify-between border-b border-white/5 pb-8">
            {[
              { id: 1, label: "CAMPAIGN_TYPE" },
              { id: 2, label: "PARAMETERS" },
              { id: 3, label: "CROSS_CHAIN_FUNDING" },
              { id: 4, label: "LAUNCH" }
            ].map((s) => (
              <div key={s.id} className="flex flex-col gap-2">
                <span className={`font-mono text-[10px] tracking-tighter ${step === s.id ? 'text-indigo-400' : 'text-muted-foreground/40'}`}>
                  STEP_0{s.id}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                  {s.label}
                </span>
                {step === s.id && <div className="h-0.5 w-full bg-indigo-500" />}
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <h1 className="font-mono text-3xl font-black uppercase tracking-tighter">
                Fund Escrow <span className="text-muted-foreground/20">_</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Your bounty configuration is locked. Please fund the Solana Escrow PDA 
                using your assets from any EVM-compatible chain.
              </p>
            </div>

            {status !== "connected" ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 py-20 text-center">
                <p className="text-sm text-muted-foreground font-mono">
                  [!] INITIALIZE_WALLET_CONNECTION_REQUIRED
                </p>
                <WalletButton />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-card/50 p-1 backdrop-blur-xl">
                <LiFiFundingWidget 
                  destinationAddress={mockBountyAddress}
                  amount="10" // Initial $10 bounty example
                />
              </div>
            )}
            
            <div className="flex justify-between pt-8">
              <button 
                onClick={() => setStep(2)}
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
              >
                &lt; Back_to_parameters
              </button>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                <span>SYSTEM_STATUS: OK</span>
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
