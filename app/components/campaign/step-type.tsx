"use client";

import { Coins, Zap } from "lucide-react";

interface StepTypeProps {
  onSelect: (type: "SOL" | "SPL") => void;
  selectedType: "SOL" | "SPL";
  onNext: () => void;
}

export function StepType({ onSelect, selectedType, onNext }: StepTypeProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-3xl font-black uppercase tracking-tighter">
          Select Bounty Type <span className="text-muted-foreground/20">_</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose the asset you want to distribute as a location-based reward.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect("SOL")}
          className={`group relative flex flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
            selectedType === "SOL"
              ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
              : "border-white/5 bg-white/5 hover:border-white/10"
          }`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
              selectedType === "SOL"
                ? "bg-indigo-500 text-white"
                : "bg-white/5 text-muted-foreground group-hover:text-foreground"
            }`}
          >
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest">
              Native SOL
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Distribute native Solana (SOL) rewards. Best for simple
              onboarding.
            </p>
          </div>
          {selectedType === "SOL" && (
            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500" />
          )}
        </button>

        <button
          disabled // For MVP, we stick to SOL first
          className={`group relative flex flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-all opacity-50 cursor-not-allowed ${
            selectedType === "SPL"
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-white/5 bg-white/5"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-muted-foreground">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">
              SPL Token (COMING_SOON)
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Distribute USDC, BONK, or your own custom project tokens.
            </p>
          </div>
        </button>
      </div>

      <div className="flex justify-end pt-8">
        <button
          onClick={onNext}
          className="group flex items-center gap-2 rounded-full bg-indigo-500 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          NEXT_STEP
          <span className="font-mono opacity-50 group-hover:translate-x-1 transition-transform">
            -&gt;
          </span>
        </button>
      </div>
    </div>
  );
}
