"use client";

import { useState } from "react";
import Link from "next/link";
import { GridBackground } from "../components/grid-background";
import { ThemeToggle } from "../components/theme-toggle";
import { ArrowLeft, Send, CheckCircle2, Clipboard } from "lucide-react";

export default function BetaPage() {
  const formUrl = process.env.NEXT_PUBLIC_BETA_FORM_URL;
  const [formData, setFormData] = useState({
    email: "",
    wallet: "",
    device: "android",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;
    setSubmitted(true);
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

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl rounded-2xl border border-white/5 bg-card/40 p-8 md:p-12 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.05)] relative overflow-hidden">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-indigo-400 mb-8 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            [ Back_To_Safety ]
          </Link>

          <div className="space-y-6">
            <div>
              <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block mb-2">
                {"// BETA_TESTER_PROGRAM"}
              </span>
              <h1 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tight text-white">
                Become_A_Beta_Tester
              </h1>
              <p className="mt-2 text-sm text-foreground/50 max-w-xl">
                Help us shape the future of real-world Web3 exploration. Test early GeoDrop mobile builds, hunt physical drops, and earn rewards for reporting bugs.
              </p>
            </div>

            {formUrl ? (
              <div className="w-full aspect-[4/3] md:aspect-[16/10] rounded-xl overflow-hidden border border-white/5 bg-black/20">
                <iframe
                  src={formUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title="GeoDrop Beta Tester Google Form"
                >
                  Loading…
                </iframe>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Fallback Form */}
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] uppercase text-muted-foreground">
                          EMAIL_ADDRESS
                        </label>
                        <input
                          type="email"
                          placeholder="enter_your_email@domain.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-white"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] uppercase text-muted-foreground">
                          SOLANA_WALLET_ADDRESS (OPTIONAL)
                        </label>
                        <input
                          type="text"
                          placeholder="552usXzVzcLn..."
                          value={formData.wallet}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              wallet: e.target.value,
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-mono text-[10px] uppercase text-muted-foreground">
                          TESTING_DEVICE
                        </label>
                        <select
                          value={formData.device}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              device: e.target.value,
                            }))
                          }
                          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-white"
                        >
                          <option value="android" className="bg-neutral-900 text-white">Android APK</option>
                          <option value="ios" className="bg-neutral-900 text-white">iOS (TestFlight)</option>
                          <option value="both" className="bg-neutral-900 text-white">Both Devices</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-indigo-500 font-bold text-white transition-all hover:bg-indigo-600 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    >
                      <Send className="h-4 w-4" />
                      SUBMIT_APPLICATION
                    </button>
                  </form>
                ) : (
                  <div className="flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 max-w-md animate-in fade-in duration-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
                        APPLICATION_RECEIVED
                      </h3>
                      <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                        Your beta test application has been logged in our local database. We&apos;ll review your testing configuration and contact you once builds are ready.
                      </p>
                    </div>
                  </div>
                )}

                {/* Guide for developer */}
                <div className="rounded-xl border border-dashed border-white/5 bg-white/[0.01] p-6 text-xs text-muted-foreground space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase tracking-wider font-bold">
                    <Clipboard className="h-3 w-3" />
                    DEVELOPER_CONFIGURATION_GUIDE
                  </div>
                  <p className="leading-relaxed">
                    To display your Google Form directly on this page:
                  </p>
                  <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                    <li>Create a Google Form for your beta application.</li>
                    <li>Click <strong>Send</strong> → <strong>Link</strong> (or Embed HTML) and copy the URL.</li>
                    <li>Add the URL to your local <code>.env.local</code> (or Vercel environment variables) as:
                      <code className="block mt-1 font-mono text-[10px] bg-black/40 text-indigo-300 px-2 py-1 rounded border border-white/5">
                        NEXT_PUBLIC_BETA_FORM_URL=&quot;https://docs.google.com/forms/d/e/.../viewform?embedded=true&quot;
                      </code>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
