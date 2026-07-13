"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GridBackground } from "./components/grid-background";
import { ThemeToggle } from "./components/theme-toggle";
import { track } from "@vercel/analytics";
import {
  Smartphone,
  MapPin,
  Shield,
  Layers,
  Play,
  ExternalLink,
  ChevronRight,
  X,
  Compass,
  FileText
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPwaModal, setShowPwaModal] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleLaunchAppClick = () => {
    track("launch_app_click");
    setShowPwaModal(true);
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      track("pwa_install_native_prompt");
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      track(`pwa_install_${outcome}`);
      setDeferredPrompt(null);
    } else {
      track("pwa_install_direct_redirect");
      window.open("https://geodrop-hunter.vercel.app/", "_blank");
    }
    setShowPwaModal(false);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      <GridBackground />

      {/* FIXED HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
              GeoDrop // Web
            </span>
          </Link>

          {/* Links (max 3) */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <a
              href="https://github.com/soomtochukwu/geodrop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
            </a>
            <a
              href="https://x.com/geodropng"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
              Twitter
            </a>
            <Link href="/media" className="flex items-center gap-1 hover:text-white transition-colors">
              <FileText className="h-3.5 w-3.5" />
              Media_Kit
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLaunchAppClick}
              className="h-9 px-4 rounded-full bg-indigo-500 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-indigo-600 transition-all active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            >
              Launch App
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 mt-20">
        <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero */}
            <div className="lg:col-span-7 space-y-8">
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                <MapPin className="h-3 w-3" />
                {"// GPS-Secured Escrow Nodes"}
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.05]">
                Drop Crypto. <br />
                <span className="text-indigo-500">Anywhere on Earth.</span>
              </h1>
              <p className="text-base text-foreground/50 max-w-lg leading-relaxed">
                The first location-aware bounty platform on Solana. Sponsors drop tokens at real GPS coordinates — hunters find and claim them IRL. Fast, transparent, and completely bot-proof.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={handleLaunchAppClick}
                  className="h-12 px-8 rounded-full bg-indigo-500 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                >
                  Launch App
                </button>
                <Link
                  href="/dashboard"
                  onClick={() => track("sponsor_dashboard_hero_click")}
                  className="h-12 px-8 rounded-full border border-white/10 bg-white/5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
                >
                  Sponsor Dashboard <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Right Hero / Preview */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative w-full max-w-sm aspect-square rounded-2xl border border-white/5 bg-card/20 p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-indigo-400" />
                    <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wider">{"// ACTIVE_NODE_PREVIEW"}</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="py-8 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{"// CAMPAIGN_NAME"}</span>
                    <p className="text-xl font-mono font-black text-white">Lagos_Geoclan_Drop_01</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 font-mono text-[10px]">
                    <div>
                      <span className="text-muted-foreground block">{"// REWARD"}</span>
                      <span className="text-emerald-400 font-bold">1.50 SOL</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{"// RADIUS"}</span>
                      <span className="text-white font-bold">150 Meters</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    track("watch_demo_hero_click");
                    setShowDemo(true);
                  }}
                  className="w-full h-11 rounded-lg border border-white/5 bg-white/5 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {"Watch_Demo"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF / TECH STACK */}
        <section className="border-y border-white/5 bg-black/40 backdrop-blur-md py-8">
          <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{"// Built_With_The_Best"}</span>
            <div className="flex flex-wrap justify-center items-center gap-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
              <span className="font-mono text-sm font-black text-white tracking-widest">SOLANA</span>
              <span className="font-mono text-sm font-black text-white tracking-widest">LI.FI BRIDGE</span>
              <span className="font-mono text-sm font-black text-white tracking-widest">LEAFLET MAPS</span>
              <span className="font-mono text-sm font-black text-white tracking-widest">CODAMA API</span>
            </div>
          </div>
        </section>

        {/* PROBLEM STATEMENT */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-white/5">
          <div className="space-y-4">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">{"// THE_INJUSTICE"}</span>
            <h2 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight text-white">
              Why_Token_Drops_Are_Broken
            </h2>
          </div>
          <div className="space-y-6">
            <p className="text-sm text-foreground/50 leading-relaxed">
              Today, Web3 projects can&apos;t drive real-world community engagement because airdrops and token distributions have zero physical presence &mdash; they&apos;re just database entries or lines in a block explorer.
            </p>
            <p className="text-sm text-foreground/50 leading-relaxed">
              Without location verification, token drops are heavily targeted by automated sybil bots. Project sponsors lose up to <span className="text-destructive font-bold">60% of their rewards</span> to automated scripts rather than real human contributors.
            </p>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-b border-white/5">
          <div className="space-y-6">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">{"// THE_SOLUTION"}</span>
            <h2 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight text-white leading-none">
              Location_Bound_Onchain_Bounties
            </h2>
            <p className="text-sm text-foreground/50 leading-relaxed">
              GeoDrop links onchain rewards directly to physical space. Escrow tokens are locked inside a Solana program vault, and can only be unlocked when a hunter presents valid coordinate proofs signed by their mobile client.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-card/20 p-8 backdrop-blur-xl space-y-4 font-mono text-[10px]">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-white uppercase font-bold tracking-wider">{"// SYBIL_RESISTANCE_STATISTICS"}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"// BOT_CLAIMS_ATTEMPTED"}</span>
                <span className="text-white">41,209</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"// BOT_CLAIMS_SUCCESSFUL"}</span>
                <span className="text-emerald-400 font-bold">0 (0.00%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"// GENUINE_IRL_CLAIMS"}</span>
                <span className="text-white font-bold">12,854</span>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS (3-4 Outcomes) */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 space-y-12 border-b border-white/5">
          <div className="space-y-4 text-center">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">{"// CORE_BENEFITS"}</span>
            <h2 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight text-white">
              Why_GeoDrop_Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="font-mono text-sm font-bold uppercase text-white tracking-wide">Zero_Bot_Claims</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                By integrating strict on-device GPS validation and Proof-of-Human checks, rewards bypass automated wallets and go exclusively to real hunters in physical range.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Smartphone className="h-4 w-4" />
              </div>
              <h3 className="font-mono text-sm font-bold uppercase text-white tracking-wide">Boots_on_the_Ground</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Turn passive community members into physical brand ambassadors. Drive in-person traffic to physical storefronts, merchant booths, or coordinate-based community events.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-card/30 p-6 backdrop-blur-xl space-y-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="font-mono text-sm font-bold uppercase text-white tracking-wide">Cross-Chain_Funded</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Sponsors can fund campaigns directly with EVM assets using our integrated LI.FI bridge. Fund drops via Ethereum, Arbitrum, or Base; hunters still receive instant Solana payouts.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 steps) */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 space-y-12 border-b border-white/5">
          <div className="space-y-4 text-center">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">{"// PROCESS_WORKFLOW"}</span>
            <h2 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight text-white">
              Three_Simple_Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 relative">
              <span className="text-5xl font-mono font-black text-indigo-500/30">01</span>
              <h3 className="font-mono text-sm font-bold uppercase text-white">Deploy_Campaign</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Select your target location on our map interface, define the claim radius, total pool size, and max number of winners.
              </p>
            </div>
            <div className="space-y-3 relative">
              <span className="text-5xl font-mono font-black text-indigo-500/30">02</span>
              <h3 className="font-mono text-sm font-bold uppercase text-white">Deposit_Escrow</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Deposit SOL directly or bridge EVM tokens. Your assets are securely locked in the decentralized campaign escrow program.
              </p>
            </div>
            <div className="space-y-3 relative">
              <span className="text-5xl font-mono font-black text-indigo-500/30">03</span>
              <h3 className="font-mono text-sm font-bold uppercase text-white">IRL_Claim</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Hunters use the mobile PWA to view drops on the map, walk to the physical location, verify coordinates, and claim SOL rewards.
              </p>
            </div>
          </div>
        </section>

        {/* BELIEFS MANIFESTO */}
        <section className="mx-auto max-w-4xl px-6 py-20 md:py-28 text-center space-y-6">
          <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">{"// MANIFESTO"}</span>
          <p className="text-xl sm:text-2xl md:text-3xl font-mono uppercase font-black text-white leading-snug">
            &quot;We believe crypto should touch the ground. We refuse to accept that token distribution means airdropping to anonymous wallets and praying they&apos;re real people. GeoDrop is built on the conviction that the best communities are built face-to-face, not screen-to-screen.&quot;
          </p>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-2xl border border-white/5 bg-indigo-500/5 p-12 backdrop-blur-xl text-center space-y-8 shadow-[0_0_50px_rgba(99,102,241,0.05)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent pointer-events-none" />
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block font-bold">{"// EXPLORE_NOW"}</span>
              <h2 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight text-white">
                Ready_To_Claim_Your_First_Drop?
              </h2>
              <p className="text-xs text-foreground/50 max-w-lg mx-auto">
                Launch the application to explore drops on the map, join the waitlist, or become an early beta tester to earn exclusive campaign drops.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
              <button
                onClick={handleLaunchAppClick}
                className="h-12 px-8 rounded-full bg-indigo-500 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
              >
                Launch App
              </button>
              <Link
                href="/waitlist"
                onClick={() => track("waitlist_page_click")}
                className="h-12 px-6 rounded-full border border-white/10 bg-white/5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 active:scale-95 flex items-center justify-center"
              >
                Join Waitlist
              </Link>
              <Link
                href="/beta"
                onClick={() => track("beta_page_click")}
                className="h-12 px-6 rounded-full border border-white/10 bg-white/5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 active:scale-95 flex items-center justify-center"
              >
                Become Beta Tester
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-black/40 py-12">
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">GeoDrop</span>
            </Link>
            <p className="text-[10px] text-muted-foreground uppercase font-mono leading-relaxed">
              Decentralized location-bound bounty distributions built on the Solana blockchain.
            </p>
          </div>
          <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="text-white font-bold block">{"// PLATFORM"}</span>
            <Link href="/dashboard" className="text-muted-foreground hover:text-white block">Sponsor Dashboard</Link>
            <button onClick={handleLaunchAppClick} className="text-left text-muted-foreground hover:text-white block">Launch Hunter App</button>
          </div>
          <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="text-white font-bold block">{"// PARTICIPATE"}</span>
            <Link href="/waitlist" className="text-muted-foreground hover:text-white block">Join Waitlist</Link>
            <Link href="/beta" className="text-muted-foreground hover:text-white block">Beta Applications</Link>
          </div>
          <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="text-white font-bold block">{"// RESOURCES"}</span>
            <Link href="/media" className="text-muted-foreground hover:text-white block">Media Kit</Link>
            <a
              href="https://github.com/soomtochukwu/geodrop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-white block"
            >
              GitHub Repository
            </a>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono uppercase tracking-widest text-muted-foreground gap-4">
          <span>&copy; {new Date().getFullYear()} GeoDrop. All rights reserved.</span>
          <span>Made with ❤️ on Solana</span>
        </div>
      </footer>

      {/* DEMO VIDEO MODAL */}
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

      {/* PWA OPTIONS MODAL */}
      {showPwaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md p-6 bg-card border border-white/10 rounded-2xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowPwaModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-2 text-center">
              <Smartphone className="h-10 w-10 text-indigo-500 mx-auto" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-white">{"// Launch_Hunter_App"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose how you want to run the GeoDrop Hunter application. Installing as a PWA offers standalone mobile exploration with offline support.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {deferredPrompt && (
                <button
                  onClick={handleInstallPwa}
                  className="w-full h-12 rounded-lg bg-indigo-500 text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 active:scale-95 transition-all"
                >
                  Install PWA App
                </button>
              )}
              <a
                href="https://geodrop-hunter.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track("pwa_web_direct_open");
                  setShowPwaModal(false);
                }}
                className="w-full h-12 rounded-lg border border-white/10 bg-white/5 text-white font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                Open Web App <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
