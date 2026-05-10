"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { GridBackground } from "../../components/grid-background";
import { ThemeToggle } from "../../components/theme-toggle";
import { ClusterSelect } from "../../components/cluster-select";
import { WalletButton } from "../../components/wallet-button";
import { LiFiFundingWidget } from "../../components/lifi-funding-widget";
import { useWallet } from "../../lib/wallet/context";
import { useSolanaClient } from "../../lib/solana-client-context";
import { lamportsToSolString } from "../../lib/lamports";
import { StepType } from "../../components/campaign/step-type";
import { StepParameters } from "../../components/campaign/step-parameters";
import { findDropPda, getInitializeDropInstruction } from "@geodrop/client";
import {
  type Address,
  getAddressEncoder,
  getBytesEncoder,
  fixEncoderSize,
} from "@solana/kit";
import { CheckCircle2, ArrowRight, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useSendTransaction } from "../../lib/hooks/use-send-transaction";
import { useCluster } from "../../components/cluster-context";

export default function CreateCampaignPage() {
  const { status, wallet, signer } = useWallet();
  const { getExplorerUrl } = useCluster();
  const { send, isSending } = useSendTransaction();
  const client = useSolanaClient();

  const [step, setStep] = useState(1);
  const [fundingPath, setFundingPath] = useState<"lifi" | "sol">("sol");
  const [campaignData, setCampaignData] = useState({
    name: "My GeoDrop",
    type: "SOL" as "SOL" | "SPL",
    lat: 37.7749,
    lng: -122.4194,
    radius: 100,
    rewardPerWinner: "0.1",
    maxWinners: "10",
  });

  const [dropAddress, setDropAddress] = useState<Address | null>(null);
  const [campaignId, setCampaignId] = useState<Uint8Array>(new Uint8Array(8));

  // Initialize a random campaign ID on mount
  useEffect(() => {
    const randomId = new Uint8Array(8);
    crypto.getRandomValues(randomId);
    setCampaignId(randomId);
  }, []);

  // Derive PDA when wallet, parameters, or campaignId change
  useEffect(() => {
    async function updatePda() {
      if (wallet?.account.address && campaignId) {
        try {
          const [pda] = await findDropPda({
            sponsor: wallet.account.address,
            campaignId: campaignId,
          });
          setDropAddress(pda);
        } catch (e) {
          console.error("Failed to derive PDA", e);
        }
      }
    }
    updatePda();
  }, [wallet?.account.address, campaignId]);

  const totalPoolAmount = (
    parseFloat(campaignData.rewardPerWinner) * parseInt(campaignData.maxWinners)
  ).toFixed(2);

  const handleLaunch = async () => {
    if (!signer || !dropAddress) {
      toast.error("Missing wallet or drop address.");
      return;
    }

    try {
      const currentBalance = await client.rpc.getBalance(signer.address).send();

      const rewardPerWinnerLamports = BigInt(
        Math.round(parseFloat(campaignData.rewardPerWinner) * 1_000_000_000)
      );
      const maxWinnersNum = BigInt(campaignData.maxWinners);
      const totalBountyRequired = rewardPerWinnerLamports * maxWinnersNum;

      if (currentBalance.value < totalBountyRequired) {
        toast.error(
          `Insufficient balance. You have ${lamportsToSolString(currentBalance.value)} SOL but need ${totalPoolAmount} SOL.`
        );
        return;
      }

      // Backend authority (F6LdrjT4GCn3gExB5oB6zP6JLLtqdYWw2qt9ezRoUKcR)
      const BACKEND_AUTHORITY = "F6LdrjT4GCn3gExB5oB6zP6JLLtqdYWw2qt9ezRoUKcR";
      const backendAuthorityBytes = getAddressEncoder().encode(
        BACKEND_AUTHORITY as Address
      );

      // Encode Name to 32 bytes
      const nameEncoder = fixEncoderSize(getBytesEncoder(), 32);
      const nameBytes = nameEncoder.encode(
        new TextEncoder().encode(campaignData.name)
      );

      const instruction = getInitializeDropInstruction({
        sponsor: signer,
        drop: dropAddress,
        campaignId: campaignId,
        campaignName: nameBytes,
        backendAuthority: backendAuthorityBytes,
        lat: BigInt(Math.round(campaignData.lat * 1_000_000)),
        long: BigInt(Math.round(campaignData.lng * 1_000_000)),
        radius: BigInt(campaignData.radius),
        rewardPerClaim: rewardPerWinnerLamports,
        maxClaims: maxWinnersNum,
      });

      const signature = await send({ instructions: [instruction] });

      toast.success("Campaign Launched!", {
        description: `"${campaignData.name}" is now live on the map.`,
        action: {
          label: "View TX",
          onClick: () =>
            window.open(getExplorerUrl(`/tx/${signature}`), "_blank"),
        },
      });

      setStep(4);
    } catch (e: any) {
      console.error("[GeoDrop] Launch error:", e);
      toast.error(e?.message || "Launch failed.");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
      <GridBackground />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            <Link
              href="/"
              className="font-mono text-xs font-bold uppercase tracking-widest text-white"
            >
              GeoDrop // Sponsor_Node
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ClusterSelect />
            <WalletButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-12 flex justify-between border-b border-white/5 pb-8 max-w-2xl mx-auto">
            {[
              { id: 1, label: "CAMPAIGN_TYPE" },
              { id: 2, label: "PARAMETERS" },
              { id: 3, label: "FUNDING" },
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
                name={campaignData.name}
                lat={campaignData.lat}
                lng={campaignData.lng}
                radius={campaignData.radius}
                rewardPerWinner={campaignData.rewardPerWinner}
                maxWinners={campaignData.maxWinners}
                onNameChange={(name) =>
                  setCampaignData({ ...campaignData, name })
                }
                onLocationChange={(lat, lng) =>
                  setCampaignData({ ...campaignData, lat, lng })
                }
                onRadiusChange={(radius) =>
                  setCampaignData({ ...campaignData, radius })
                }
                onRewardChange={(rewardPerWinner) =>
                  setCampaignData({ ...campaignData, rewardPerWinner })
                }
                onWinnersChange={(maxWinners) =>
                  setCampaignData({ ...campaignData, maxWinners })
                }
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <h1 className="font-mono text-3xl font-black uppercase tracking-tighter text-white">
                    Fund Your Bounty{" "}
                    <span className="text-muted-foreground/20">_</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Initialize{" "}
                    <span className="text-indigo-400 font-bold">
                      "{campaignData.name}"
                    </span>{" "}
                    with {totalPoolAmount} SOL.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFundingPath("sol")}
                    className={`flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-all ${
                      fundingPath === "sol"
                        ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                        : "border-white/5 bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${fundingPath === "sol" ? "bg-indigo-500 text-white" : "bg-white/5 text-muted-foreground"}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                        Direct_Solana
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Pay instantly with SOL in your connected wallet.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setFundingPath("lifi")}
                    className={`flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-all ${
                      fundingPath === "lifi"
                        ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                        : "border-white/5 bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${fundingPath === "lifi" ? "bg-indigo-500 text-white" : "bg-white/5 text-muted-foreground"}`}
                    >
                      <Rocket className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                        Cross_Chain
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Bridge funds from Ethereum, Base, or Arbitrum via LI.FI.
                      </p>
                    </div>
                  </button>
                </div>

                {status !== "connected" ? (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 py-20 text-center">
                    <p className="text-sm text-muted-foreground font-mono">
                      [!] INITIALIZE_WALLET_CONNECTION_REQUIRED
                    </p>
                    <WalletButton />
                  </div>
                ) : fundingPath === "sol" ? (
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 flex flex-col items-center gap-6 text-center animate-in zoom-in-95 duration-300">
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                        Ready_to_deploy
                      </p>
                      <h2 className="text-3xl font-black font-mono text-white">
                        {totalPoolAmount}{" "}
                        <span className="text-indigo-500">SOL</span>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {campaignData.maxWinners} winners will receive{" "}
                        {campaignData.rewardPerWinner} SOL each.
                      </p>
                    </div>

                    <button
                      onClick={handleLaunch}
                      disabled={isSending}
                      className="group flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-indigo-500 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          CONFIRMING...
                        </>
                      ) : (
                        <>
                          DEPLOY_&_INITIALIZE
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-300">
                    <div className="rounded-2xl border border-white/5 bg-card/50 p-1 backdrop-blur-xl mb-6">
                      <LiFiFundingWidget
                        destinationAddress={dropAddress ?? ""}
                        amount={totalPoolAmount}
                      />
                    </div>

                    <div className="flex items-center gap-2 px-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                        Once_bridged_click_launch_below
                      </p>
                    </div>

                    <button
                      onClick={handleLaunch}
                      disabled={isSending}
                      className="mt-4 group flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-4 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                    >
                      {isSending ? "LAUNCHING..." : "INITIALIZE_ON_SOLANA"}
                    </button>
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
                  <h1 className="font-mono text-4xl font-black uppercase tracking-tighter text-white text-emerald-400">
                    "{campaignData.name}" LIVE!
                  </h1>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                    Your location-based bounty pool is now broadcasted to all
                    hunters in the area.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-8 text-white">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
                      Total_Reward_Pool
                    </p>
                    <p className="text-xl font-bold font-mono">
                      {totalPoolAmount} SOL
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
                      Max_Winners
                    </p>
                    <p className="text-xl font-bold font-mono">
                      {campaignData.maxWinners}
                    </p>
                  </div>
                </div>

                <Link
                  href="/"
                  className="group flex items-center gap-2 rounded-full bg-white text-black px-8 py-3 text-sm font-bold transition-all hover:scale-105 active:scale-95"
                >
                  RETURN_TO_DASHBOARD
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
