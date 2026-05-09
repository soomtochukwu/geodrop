"use client";

import dynamic from "next/dynamic";
import { Sliders } from "lucide-react";

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
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepParameters({
  lat,
  lng,
  radius,
  onLocationChange,
  onRadiusChange,
  onNext,
  onBack,
}: StepParametersProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-3xl font-black uppercase tracking-tighter">
          Define Territory <span className="text-muted-foreground/20">_</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Pin the precise location where hunters can claim your bounty and
          define the physical reach.
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

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sliders className="h-4 w-4" />
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest">
                Capture_Radius
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold font-mono">
                  {radius}
                  <span className="text-sm text-muted-foreground ml-1">M</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono opacity-50 uppercase">
                  meters_sq
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
              <div className="flex justify-between text-[8px] font-mono text-muted-foreground opacity-50">
                <span>10M</span>
                <span>1KM</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-4">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              GPS_COORDINATES
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[8px] text-muted-foreground uppercase">
                  Latitude
                </p>
                <p className="font-mono text-xs">{lat.toFixed(6)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] text-muted-foreground uppercase">
                  Longitude
                </p>
                <p className="font-mono text-xs">{lng.toFixed(6)}</p>
              </div>
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
