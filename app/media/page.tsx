"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { GridBackground } from "../components/grid-background";
import { ThemeToggle } from "../components/theme-toggle";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";

export default function MediaKitPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colors = [
    { name: "Pure Black", hex: "#0A0A0A", description: "Primary background color across the entire application" },
    { name: "Charcoal Card", hex: "#171717", description: "Containment panel background for readability and contrast" },
    { name: "Cyber Indigo", hex: "#6366F1", description: "Primary branding accent color, CTA buttons, and high-priority states" },
    { name: "Emerald Signal", hex: "#22C55E", description: "Secondary status, successful actions, and active node indicators" },
    { name: "Muted Gray", hex: "#737373", description: "Secondary typography, disabled status labels, and borders" },
  ];

  const handleCopyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <GridBackground />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
              GeoDrop // Home
            </span>
          </Link>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 mx-auto max-w-6xl w-full px-6 py-12 space-y-12">
        {/* Title / Back */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            [ Back_To_Safety ]
          </Link>
          <div>
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block mb-1">
              {"// DESIGN_SYSTEM_ASSETS"}
            </span>
            <h1 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tight text-white">
              Media_Kit
            </h1>
            <p className="mt-2 text-sm text-foreground/50 max-w-2xl">
              Official branding assets, logos, and color palettes. Use these guidelines to maintain visual consistency when mentioning GeoDrop in articles, podcasts, or community posts.
            </p>
          </div>
        </div>

        {/* Logos & Banners Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo Card */}
          <div className="rounded-2xl border border-white/5 bg-card/40 p-8 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="font-mono text-[10px] uppercase text-white font-bold tracking-wider">{"// Brand_Logo"}</span>
              <span className="font-mono text-[10px] text-muted-foreground">512x512 PNG / SVG</span>
            </div>
            <div className="flex items-center justify-center p-8 bg-black/40 rounded-xl border border-white/5 h-64 relative">
              <img
                src="/geodrop-logo.svg"
                alt="GeoDrop Logo"
                className="w-32 h-32 select-none object-contain"
              />
            </div>
            <div className="flex gap-4">
              <a
                href="/geodrop-logo.svg"
                download="geodrop-logo.svg"
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 font-mono text-xs uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download_SVG
              </a>
              <a
                href="/geodrop-logo.png"
                download="geodrop-logo.png"
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 font-mono text-xs uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download_PNG
              </a>
            </div>
          </div>

          {/* Banner Card */}
          <div className="rounded-2xl border border-white/5 bg-card/40 p-8 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="font-mono text-[10px] uppercase text-white font-bold tracking-wider">{"// Brand_Banner"}</span>
              <span className="font-mono text-[10px] text-muted-foreground">Vector SVG / PNG</span>
            </div>
            <div className="flex items-center justify-center p-4 bg-black/40 rounded-xl border border-white/5 h-64 relative">
              <img
                src="/geodrop-banner.svg"
                alt="GeoDrop Banner"
                className="w-full h-full select-none object-contain"
              />
            </div>
            <div className="flex gap-4">
              <a
                href="/geodrop-banner.svg"
                download="geodrop-banner.svg"
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 font-mono text-xs uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download_SVG
              </a>
              <a
                href="/geodrop-banner.png"
                download="geodrop-banner.png"
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 font-mono text-xs uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download_PNG
              </a>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="rounded-2xl border border-white/5 bg-card/40 p-8 md:p-10 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="font-mono text-[10px] uppercase text-white font-bold tracking-wider">{"// BRAND_COLOR_PALETTE"}</span>
            <span className="font-mono text-[10px] text-muted-foreground">Hex Code Reference</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {colors.map((color) => (
              <div
                key={color.hex}
                className="group relative flex flex-col gap-4 rounded-xl border border-white/5 bg-black/20 p-4 transition-all hover:border-white/10"
              >
                <div
                  className="h-16 w-full rounded-lg border border-white/5 relative"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex-1 space-y-1">
                  <h3 className="font-mono text-xs font-bold text-white uppercase">{color.name}</h3>
                  <p className="text-[10px] text-muted-foreground leading-normal">{color.description}</p>
                </div>
                <button
                  onClick={() => handleCopyHex(color.hex)}
                  className="mt-2 flex w-full h-8 items-center justify-between rounded bg-white/5 px-2 font-mono text-[10px] text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  <span>{color.hex}</span>
                  {copiedColor === color.hex ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="rounded-2xl border border-white/5 bg-card/40 p-8 md:p-10 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="font-mono text-[10px] uppercase text-white font-bold tracking-wider">{"// TYPOGRAPHY_GUIDELINES"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase text-indigo-400 block">{"// Primary_Mono"}</span>
              <p className="font-mono text-3xl font-black text-white">Geist_Mono</p>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Used for primary displays, header sections, navigation items, diagnostic output, and data elements. Emphasizes the technical, location-bound on-chain nature of the program.
              </p>
            </div>
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase text-indigo-400 block">{"// Secondary_Sans"}</span>
              <p className="text-3xl font-black text-white">Inter Sans</p>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Used for paragraph text, body descriptions, sliders, input labels, and structural details. Focuses on legibility and reading comfort across various screens.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
