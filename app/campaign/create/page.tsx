"use client";

import { useState, useEffect } from "react";
import { GridBackground } from "../../components/grid-background";
import { ThemeToggle } from "../../components/theme-toggle";
import { ClusterSelect } from "../../components/cluster-select";
import { WalletButton } from "../../components/wallet-button";
import { LiFiFundingWidget } from "../../components/lifi-funding-widget";
import { useWallet } from "../../lib/wallet/context";
import { StepType } from "../../components/campaign/step-type";
import { StepParameters } from "../../components/campaign/step-parameters";
import { findDropPda } from "../../generated/vault/pdas";
import { type Address } from "@solana/kit";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getInitializeDropInstruction } from "../../generated/vault/instructions";
import { useSendTransaction } from "../../lib/hooks/use-send-transaction";
import { useCluster } from "../../components/cluster-context";

export default function CreateCampaignPage() {
  const { status, wallet, signer } = useWallet();
  const { getExplorerUrl } = useCluster();
  const { send, isSending } = useSendTransaction();

  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    type: "SOL" as "SOL" | "SPL",
    lat: 37.7749,
    lng: -122.4194,
    radius: 100,
    amount: "0.1",
  });

  const [dropAddress, setDropAddress] = useState<Address | null>(null);

  // Derive PDA when wallet or parameters change
  useEffect(() => {
    async function updatePda() {
      if (wallet?.account.address) {
        try {
          const [pda] = await findDropPda({ sponsor: wallet.account.address });
          setDropAddress(pda);
        } catch (e) {
          console.error("Failed to derive PDA", e);
        }
      }
    }
    updatePda();
  }, [wallet?.account.address]);

  const handleLaunch = async () => {
    if (!signer || !dropAddress) return;

    try {
      // Backend authority for the MVP (using a demo pubkey)
      const BACKEND_AUTHORITY =
        "3VshYkZ5W465L5zXNf9Xp9W5Lq8W6X7X9P4W5Lq8W6X7" as Address;

      const instruction = getInitializeDropInstruction({
        sponsor: signer,
        drop: dropAddress,
        backendAuthority: BACKEND_AUTHORITY,
        lat: BigInt(Math.round(campaignData.lat * 1_000_000)),
        long: BigInt(Math.round(campaignData.lng * 1_000_000)),
        radius: BigInt(campaignData.radius),
        amount: BigInt(parseFloat(campaignData.amount) * 1_000_000_000),
      });

      const signature = await send({ instructions: [instruction] });

      toast.success("Campaign Launched!", {
        description: "Your physical bounty is now live on the map.",
        action: {
          label: "View TX",
          onClick: () =>
            window.open(getExplorerUrl(`/tx/${signature}`), "_blank"),
        },
      });

      setStep(4);
    } catch (e) {
      console.error("Launch failed", e);
      toast.error(
        "Launch failed. Ensure you have enough SOL to fund the escrow."
      );
    }
  };

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

        <main className="mx-auto max-w-6xl px-6 py-12">
          {/* Stepper Header */}
          <div className="mb-12 flex justify-between border-b border-white/5 pb-8 max-w-2xl mx-auto">
            {[
              { id: 1, label: "CAMPAIGN_TYPE" },
              { id: 2, label: "PARAMETERS" },
              { id: 3, label: "CROSS_CHAIN_FUNDING" },
              { id: 4, label: "LAUNCH" },
            ].map((s) => (
              <div key={s.id} className="flex flex-col gap-2">
                <span
                  className={`font-mono text-[10px] tracking-tighter ${
                    step === s.id
                      ? "text-indigo-400"
                      : step > s.id
                        ? "text-emerald-400"
                        : "text-muted-foreground/40"
                  }`}
                >
                  STEP_0{s.id}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    step === s.id
                      ? "text-foreground"
                      : "text-muted-foreground/30"
                  }`}
                >
                  {s.label}
                </span>
                {step === s.id && (
                  <div className="h-0.5 w-full bg-indigo-500" />
                )}
              </div>
            ))}
          </div>

          <div className={step === 2 ? "w-full" : "max-w-2xl mx-auto"}>
            {step === 1 && (
              <StepType
                selectedType={campaignData.type}
                onSelect={(type) => setCampaignData({ ...campaignData, type })}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepParameters
                lat={campaignData.lat}
                lng={campaignData.lng}
                radius={campaignData.radius}
                onLocationChange={(lat, lng) =>
                  setCampaignData({ ...campaignData, lat, lng })
                }
                onRadiusChange={(radius) =>
                  setCampaignData({ ...campaignData, radius })
                }
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                <div className="flex flex-col gap-2">
                  <h1 className="font-mono text-3xl font-black uppercase tracking-tighter">
                    Fund Escrow{" "}
                    <span className="text-muted-foreground/20">_</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Your bounty configuration is locked. Please fund the Solana
                    Escrow PDA using your assets from any EVM-compatible chain.
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
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-card/50 p-1 backdrop-blur-xl">
                      <LiFiFundingWidget
                        destinationAddress={dropAddress ?? ""}
                        amount={campaignData.amount}
                      />
                    </div>

                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-xs font-mono text-indigo-300 uppercase">
                          Waiting for funds to land in Escrow...
                        </p>
                      </div>
                      <button
                        onClick={handleLaunch}
                        disabled={isSending}
                        className="group flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
                      >
                        {isSending ? "INITIALIZING..." : "SKIP_TO_LAUNCH"}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
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
            )}

            {step === 4 && (
              <div className="flex flex-col items-center justify-center text-center space-y-8 py-12 animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                <div className="h-24 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-mono text-4xl font-black uppercase tracking-tighter text-white">
                    Drop Live!
                  </h1>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                    Your location-based bounty is now broadcasted to all hunters
                    in the area. Real-world adoption has been initialized.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-8">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">
                      Bounty_Pool
                    </p>
                    <p className="text-xl font-bold font-mono">
                      {campaignData.amount} SOL
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">
                      Target_Radius
                    </p>
                    <p className="text-xl font-bold font-mono">
                      {campaignData.radius}M
                    </p>
                  </div>
                </div>

                <a
                  href="/"
                  className="group flex items-center gap-2 rounded-full bg-white text-black px-8 py-3 text-sm font-bold transition-all hover:scale-105 active:scale-95"
                >
                  RETURN_TO_DASHBOARD
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
