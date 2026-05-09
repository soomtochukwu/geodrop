"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { WidgetConfig } from "@lifi/widget";

const LiFiWidget = dynamic(
  () => import("@lifi/widget").then((mod) => mod.LiFiWidget),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full animate-pulse rounded-lg bg-white/5" />
    ),
  }
) as React.FC<{ config: WidgetConfig; integrator: string }>;

/**
 * GeoDrop LiFi Funding Widget
 *
 * This component allows sponsors to fund Solana Escrow PDAs from any EVM chain.
 * It follows the 'Premium Cyber-Fintech' design system:
 * - Deep black backgrounds
 * - Indigo/Electric Purple accents
 * - Monospace typography for data
 * - Sharp, 1px borders
 */
export const LiFiFundingWidget = ({
  destinationAddress,
  amount,
}: {
  destinationAddress: string;
  amount?: string;
}) => {
  const config = useMemo(
    () => ({
      integrator: "geodrop",
      containerStyle: {
        border: "1px solid #1a1a1a",
        borderRadius: "8px",
        boxShadow: "0 0 20px rgba(99, 102, 241, 0.05)", // Subtle indigo glow
      },
      // Location: Geodrop Sponsor Dashboard
      fromChain: 8453, // Base
      toChain: 115111108, // Solana Devnet
      toAddress: destinationAddress,
      toAmount: amount,

      // Aesthetic: Premium Cyber-Fintech
      appearance: "dark",
      theme: {
        palette: {
          primary: { main: "#6366f1" }, // Electric Indigo
          background: {
            paper: "#000000",
            default: "#050505",
          },
          text: {
            primary: "#ffffff",
            secondary: "#a1a1aa",
          },
        },
        shape: {
          borderRadius: 4,
          borderRadiusSecondary: 4,
        },
        typography: {
          fontFamily: "var(--font-mono), monospace", // Monospace for that terminal feel
        },
      },

      // UX Rules
      variant: "compact",
      subvariant: "default",
      sdkConfig: {
        rpcUrls: {
          // Celo integration optimized (as per prompt)
          [42220]: ["https://forno.celo.org"],
        },
      },
      languages: {
        default: "en",
      },
    }),
    [destinationAddress, amount]
  );

  return (
    <div className="flex w-full flex-col items-center gap-4 py-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-indigo-500">
          Cross-Chain Funding Portal
        </h3>
        <p className="text-xs text-muted-foreground">
          Route assets from EVM chains directly into Solana Escrow
        </p>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <LiFiWidget
          config={config as unknown as WidgetConfig}
          integrator="geodrop"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-white/5 bg-white/5 p-4 text-[10px] text-muted-foreground font-mono">
        <div className="flex justify-between">
          <span>DESTINATION_PDA:</span>
          <span className="text-foreground">{destinationAddress}</span>
        </div>
        <div className="flex justify-between">
          <span>NETWORK_PROTOCOL:</span>
          <span className="text-foreground">LI.FI_BRIDGE_V2</span>
        </div>
        <div className="flex justify-between">
          <span>STATUS:</span>
          <span className="text-emerald-500">READY_FOR_FUNDING</span>
        </div>
      </div>
    </div>
  );
};
