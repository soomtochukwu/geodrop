"use client";

import dynamic from "next/dynamic";
import { Sliders, Users, Award } from "lucide-react";

const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/5 bg-white/5">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="font-mono text-xs uppercase tracking-widest">
          INITIALIZING_GEO_PROTOCOL...
        </span>
      </div>
    </div>
  ),
});

interface StepParametersProps {
  lat: number;
  lng: number;
  radius: number;
  rewardPerWinner: string;
  maxWinners: string;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  onRewardChange: (reward: string) => void;
  onWinnersChange: (max: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepParameters({
  lat,
  lng,
  radius,
  rewardPerWinner,
  maxWinners,
  onLocationChange,
  onRadiusChange,
  onRewardChange,
  onWinnersChange,
  onNext,
  onBack,
}: StepParametersProps) {
  const totalPool = (parseFloat(rewardPerWinner || "0") * parseInt(maxWinners || "0")).toFixed(2);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-3xl font-black uppercase tracking-tighter text-white">
          Configure Bounty <span className="text-muted-foreground/20">_</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Define your target area and specify the rewards for your hunters.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 aspect-video lg:aspect-square xl:aspect-video h-[400px]">
          <MapPicker
            lat={lat}
            lng={lng}
            radius={radius}
            onLocationChange={onLocationChange}
          />
        </div>

        <div className="space-y-4">
          {/* Max Winners */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-3 transition-all hover:border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-400">
              <Users className="h-3 w-3" />
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest">
                Target_Audience
              </h3>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={maxWinners}
                onChange={(e) => onWinnersChange(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-1 font-mono text-xl font-bold focus:border-indigo-500 outline-none transition-colors pr-16"
                placeholder="1"
              />
              <span className="absolute right-0 bottom-1 text-[10px] font-bold text-muted-foreground font-mono uppercase">
                Winners
              </span>
            </div>
          </div>

          {/* Reward per Winner */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-3 transition-all hover:border-indigo-500/20">
             <div className="flex items-center gap-2 text-indigo-400">
              <Award className="h-3 w-3" />
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest">
                Reward_Per_Winner
              </h3>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={rewardPerWinner}
                onChange={(e) => onRewardChange(e.target.value)}
                className="w-full bg-transparent border-b border-white/10 py-1 font-mono text-xl font-bold focus:border-indigo-500 outline-none transition-colors pr-12"
                placeholder="0.1"
              />
              <span className="absolute right-0 bottom-1 text-[10px] font-bold text-muted-foreground font-mono uppercase">
                SOL
              </span>
            </div>
          </div>

          {/* Total Summary */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-1">
             <p className="font-mono text-[9px] text-indigo-400 uppercase tracking-widest font-bold">Total_Campaign_Pool</p>
             <h4 className="text-2xl font-black font-mono text-white">
                {totalPool} <span className="text-xs text-indigo-500">SOL</span>
             </h4>
          </div>

          {/* Radius Slider */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sliders className="h-3 w-3" />
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest">
                Capture_Radius
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xl font-bold font-mono">
                  {radius}
                  <span className="text-xs text-muted-foreground ml-1">M</span>
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={radius}
                onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <button
          onClick={onBack}
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:text-white"
        >
          &lt; Back_to_type
        </button>
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
