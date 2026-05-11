"use client";

import { MapPin, Target, ExternalLink } from "lucide-react";
import { type Account, lamports } from "@solana/kit";
import { type Drop } from "@geodrop/client";
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

  const remainingClaims = Number(data.maxClaims) - Number(data.currentClaims);
  const progressPercent =
    (Number(data.currentClaims) / Number(data.maxClaims)) * 100;

  // Decode name from bytes
  const name = new TextDecoder().decode(data.name).replace(/\0/g, "");

  return (
    <div className="group relative flex flex-col gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5 shadow-2xl">
      {/* Header with Title and Link */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`h-1.5 w-1.5 rounded-full ${remainingClaims > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
            />
            <span
              className={`font-mono text-[8px] font-bold uppercase tracking-widest ${remainingClaims > 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {remainingClaims > 0 ? "Live_On_Map" : "Campaign_Finished"}
            </span>
          </div>
          <h3 className="font-mono text-lg font-black text-white uppercase truncate tracking-tighter">
            {name || "Unnamed_Bounty"}
          </h3>
        </div>
        <a
          href={getExplorerUrl(`/address/${drop.address}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 h-8 w-8 flex items-center justify-center rounded-full border border-white/5 bg-white/5 text-muted-foreground hover:text-white transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-6">
        {/* Bounty Info */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Reward_Per_Winner
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono text-white tracking-tighter">
                {lamportsToSolString(lamports(data.rewardPerClaim))}
              </span>
              <span className="text-xs font-bold text-indigo-400 uppercase">
                Sol
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Claims
            </p>
            <p className="font-mono text-xl font-bold text-white leading-none">
              {data.currentClaims.toString()}
              <span className="text-muted-foreground/30 mx-1">/</span>
              {data.maxClaims.toString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-tighter text-muted-foreground">
            <span>Initialized</span>
            <span>{progressPercent.toFixed(0)}% Claimed</span>
          </div>
        </div>

        {/* Territory Info */}
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-[9px] font-mono uppercase tracking-widest">
                Coordinates
              </span>
            </div>
            <p className="font-mono text-[11px] text-white truncate">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span className="text-[9px] font-mono uppercase tracking-widest">
                Radius
              </span>
            </div>
            <p className="font-mono text-[11px] text-white uppercase tracking-tighter">
              {data.radius.toString()}
              <span className="text-[8px] ml-0.5 opacity-50">Meters</span>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
