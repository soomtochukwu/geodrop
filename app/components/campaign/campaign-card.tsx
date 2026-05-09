"use client";

import { MapPin, Target, Wallet } from "lucide-react";
import { lamports, type Account } from "@solana/kit";
import { type Drop } from "../../generated/vault/accounts";
import { lamportsToSolString } from "../../lib/lamports";
import { useCluster } from "../cluster-context";

interface CampaignCardProps {
  drop: Account<Drop>;
}

export function CampaignCard({ drop }: CampaignCardProps) {
  const { getExplorerUrl } = useCluster();
  const { data } = drop;

  // Convert i64 micro-degrees back to float
  const lat = Number(data.latitude) / 1_000_000;
  const lng = Number(data.longitude) / 1_000_000;

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Active_Campaign
          </span>
        </div>
        <a
          href={getExplorerUrl(`/address/${drop.address}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          VIEW_PDA
        </a>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
            Remaining_Bounty
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">
              {lamportsToSolString(lamports(data.amount))}
            </span>
            <span className="text-sm font-bold text-indigo-400">SOL</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-[10px] font-mono uppercase">Location</span>
            </div>
            <p className="font-mono text-xs text-foreground truncate">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span className="text-[10px] font-mono uppercase">Radius</span>
            </div>
            <p className="font-mono text-xs text-foreground">
              {data.radius.toString()}M
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 rounded-b-2xl bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
