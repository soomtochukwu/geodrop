"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Account } from "@solana/kit";
import type { Drop } from "@geodrop/client";
import { useWallet } from "../lib/wallet-context";
import { useGeolocation } from "../lib/use-geolocation";
import { useDrops } from "../lib/use-drops";
import { useClaimBounty } from "../lib/use-claim-bounty";
import {
  calculateDistance,
  decodeDropName,
  formatLamportsToSol,
  microDegreesToDegrees,
} from "../lib/geo";
import { getExplorerTxUrl } from "../lib/config";
import type { MapDrop } from "./hunter-map";

const HunterMap = dynamic(() => import("./hunter-map"), {
  ssr: false,
  loading: () => <div className="map-loading">LOADING_MAP...</div>,
});

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

function ellipsify(str: string, len = 4) {
  return str.length > len * 2 ? `${str.slice(0, len)}..${str.slice(-len)}` : str;
}

export function HunterApp() {
  const { wallets, wallet, connecting, connect, disconnect } = useWallet();
  const { position, error: geoError } = useGeolocation();
  const { drops, claimedDrops, loading: loadingDrops, refresh: refreshDrops } = useDrops(wallet?.address);
  const { claimBounty, status, txSignature, errorMessage, isWalletAvailable } =
    useClaimBounty();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"radar" | "claims">("radar");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null
  );
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  useEffect(() => {
    if (status === "success") {
      refreshDrops();
    }
  }, [status, refreshDrops]);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  // Filter out exhausted or already claimed drops when calculating the nearest drop
  const availableDrops = useMemo(() => {
    return drops.filter((drop) => {
      const isClaimed = !!claimedDrops[drop.address];
      const isExhausted = Number(drop.data.maxClaims) - Number(drop.data.currentClaims) <= 0;
      return !isClaimed && !isExhausted;
    });
  }, [drops, claimedDrops]);

  // Find nearest drop and its live distance — same logic as the mobile app.
  const nearestDropInfo = useMemo(() => {
    if (!position || availableDrops.length === 0) return null;

    let minDistance = Infinity;
    let closestDrop: Account<Drop> | null = null;

    availableDrops.forEach((drop) => {
      const dist = calculateDistance(
        position.latitude,
        position.longitude,
        microDegreesToDegrees(drop.data.latitude),
        microDegreesToDegrees(drop.data.longitude)
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestDrop = drop;
      }
    });

    return closestDrop
      ? { drop: closestDrop as Account<Drop>, distance: minDistance }
      : null;
  }, [position, availableDrops]);

  const nearestDrop = nearestDropInfo?.drop;
  const distance = nearestDropInfo?.distance ?? null;
  const inRange =
    !!nearestDrop &&
    distance !== null &&
    distance <= Number(nearestDrop.data.radius);

  const mapDrops: MapDrop[] = useMemo(
    () =>
      drops.map((drop) => {
        const isNearest = nearestDrop?.address === drop.address;
        const isClaimed = !!claimedDrops[drop.address];
        const slotsLeft = Number(drop.data.maxClaims) - Number(drop.data.currentClaims);
        const isExhausted = slotsLeft <= 0;
        return {
          address: drop.address,
          lat: microDegreesToDegrees(drop.data.latitude),
          lng: microDegreesToDegrees(drop.data.longitude),
          radius: Number(drop.data.radius),
          name: decodeDropName(drop),
          rewardSol: formatLamportsToSol(drop.data.rewardPerClaim),
          slotsLeft,
          isNearest,
          highlight: isNearest && inRange,
          isClaimed,
          isExhausted,
        };
      }),
    [drops, nearestDrop, inRange, claimedDrops]
  );

  const isNearestClaimed = nearestDrop ? !!claimedDrops[nearestDrop.address] : false;
  const isNearestExhausted = nearestDrop ? (Number(nearestDrop.data.maxClaims) - Number(nearestDrop.data.currentClaims) <= 0) : false;

  const claimDisabled =
    isWalletAvailable && (!inRange || status === "claiming" || isNearestClaimed || isNearestExhausted);

  const handleMainButton = () => {
    if (!isWalletAvailable) {
      setWalletModalOpen(true);
      return;
    }
    if (nearestDrop && position) {
      claimBounty(nearestDrop.address, position.latitude, position.longitude);
    }
  };

  const buttonLabel = !isWalletAvailable
    ? "CONNECT_WALLET"
    : status === "claiming"
      ? "SIGNING_TRANSACTION..."
      : status === "success"
        ? "BOUNTY_CLAIMED!"
        : isNearestClaimed
          ? "ALREADY_CLAIMED"
          : isNearestExhausted
            ? "EXHAUSTED"
            : inRange
              ? "CLAIM_BOUNTY"
              : "OUT_OF_RANGE";

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="header-title">GEODROP // LIVE_RADAR</span>
          <span className="status-dot" />
        </div>
        <div className="header-actions">
          <button className="chip" onClick={toggleTheme} title="Toggle Theme" style={{ marginRight: "4px" }}>
            {theme === "dark" ? "☀️ LIGHT" : "🌙 DARK"}
          </button>
          {installPrompt && (
            <button
              className="chip"
              onClick={() => {
                installPrompt.prompt();
                setInstallPrompt(null);
              }}
            >
              INSTALL
            </button>
          )}
          {wallet ? (
            <button
              className="chip chip-connected"
              onClick={() => disconnect()}
              title="Disconnect"
            >
              {ellipsify(wallet.address)}
            </button>
          ) : (
            <button className="chip" onClick={() => setWalletModalOpen(true)}>
              CONNECT
            </button>
          )}
        </div>
      </header>

      {/* Premium Tab Bar Navigation */}
      <div className="tabs" style={{ display: "flex", gap: "8px", width: "100%", margin: "4px 0" }}>
        <button
          onClick={() => setActiveTab("radar")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            background: activeTab === "radar" ? "var(--indigo)" : "rgba(255,255,255,0.02)",
            border: "1px solid " + (activeTab === "radar" ? "var(--indigo)" : "rgba(255,255,255,0.06)"),
            color: "#fff",
            fontWeight: "bold",
            fontSize: "11px",
            letterSpacing: "1px",
            transition: "all 0.2s ease"
          }}
        >
          RADAR_MAP
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            background: activeTab === "claims" ? "var(--indigo)" : "rgba(255,255,255,0.02)",
            border: "1px solid " + (activeTab === "claims" ? "var(--indigo)" : "rgba(255,255,255,0.06)"),
            color: "#fff",
            fontWeight: "bold",
            fontSize: "11px",
            letterSpacing: "1px",
            transition: "all 0.2s ease"
          }}
        >
          MY_CLAIMS ({Object.keys(claimedDrops).length})
        </button>
      </div>

      {activeTab === "radar" ? (
        <>
          <div className="map-shell">
            {position ? (
              <HunterMap
                user={{ lat: position.latitude, lng: position.longitude }}
                drops={mapDrops}
              />
            ) : (
              <div className="map-loading">
                {geoError === "LOCATION_PERMISSION_DENIED" ? (
                  <>
                    <span>LOCATION_ACCESS_DENIED</span>
                    <span style={{ fontSize: 10 }}>
                      ENABLE_LOCATION_PERMISSIONS_TO_HUNT
                    </span>
                  </>
                ) : geoError ? (
                  <span>{geoError}</span>
                ) : (
                  <span>ACQUIRING_GPS_SIGNAL...</span>
                )}
              </div>
            )}
          </div>

          <div className="info">
            <span className="info-label">
              [ {nearestDrop ? "NEAREST_BOUNTY" : "SCANNING_AREA"} ]
            </span>
            <span className={`info-distance${inRange ? " in-range" : ""}`}>
              {distance !== null ? `${distance.toFixed(1)}m` : "SEARCHING..."}
            </span>
            {nearestDrop && (
              <span className="info-drop">
                {decodeDropName(nearestDrop)} //{" "}
                {formatLamportsToSol(nearestDrop.data.rewardPerClaim)} SOL
              </span>
            )}
          </div>

          <button
            className="claim-button"
            disabled={claimDisabled}
            onClick={handleMainButton}
          >
            {buttonLabel}
          </button>
        </>
      ) : (
        <div
          className="claims-list"
          style={{
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
            maxHeight: "65vh",
            padding: "8px 0"
          }}
        >
          {!wallet ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--dim)",
                fontSize: "12px",
                textAlign: "center",
                gap: "10px",
                padding: "40px"
              }}
            >
              <span>CONNECT_WALLET_TO_VIEW_CLAIMS</span>
              <button
                className="chip"
                onClick={() => setWalletModalOpen(true)}
                style={{ cursor: "pointer", borderColor: "var(--indigo)" }}
              >
                CONNECT
              </button>
            </div>
          ) : Object.keys(claimedDrops).length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--dim)",
                fontSize: "12px",
                textAlign: "center",
                padding: "40px"
              }}
            >
              NO_PAST_CLAIMS_FOUND
            </div>
          ) : (
            drops
              .filter((d) => claimedDrops[d.address])
              .map((d) => (
                <div
                  key={d.address}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "10px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    transition: "transform 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                      {decodeDropName(d)}
                    </span>
                    <span style={{ color: "var(--live)", fontWeight: "bold", fontSize: "13px" }}>
                      +{formatLamportsToSol(d.data.rewardPerClaim)} SOL
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--muted)" }}>
                    <span>DROP: {ellipsify(d.address, 6)}</span>
                    <a
                      href={`https://explorer.solana.com/address/${d.address}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--indigo)", textDecoration: "underline" }}
                    >
                      EXPLORER
                    </a>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {status === "success" && txSignature && (
        <a
          className="tx-link"
          href={getExplorerTxUrl(txSignature)}
          target="_blank"
          rel="noopener noreferrer"
        >
          VIEW_TRANSACTION_ON_EXPLORER
        </a>
      )}
      {status === "error" && errorMessage && (
        <span className="error-text">CLAIM_FAILED: {errorMessage}</span>
      )}
      {loadingDrops && <span className="sync-text">SYNCING_WITH_BLOCKCHAIN...</span>}

      {walletModalOpen && (
        <div className="modal-backdrop" onClick={() => setWalletModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-title">SELECT_WALLET</span>
            {wallets.length === 0 ? (
              <p className="modal-empty">
                NO_SOLANA_WALLET_DETECTED.
                <br />
                Install a Wallet Standard wallet such as{" "}
                <a
                  href="https://phantom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Phantom
                </a>{" "}
                or{" "}
                <a
                  href="https://solflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solflare
                </a>
                , or open this page inside your wallet&apos;s in-app browser.
              </p>
            ) : (
              wallets.map((option) => (
                <button
                  key={option.id}
                  className="wallet-option"
                  disabled={connecting}
                  onClick={async () => {
                    const connected = await connect(option.id);
                    if (connected) setWalletModalOpen(false);
                  }}
                >
                  {option.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={option.icon} alt="" />
                  )}
                  {option.name}
                </button>
              ))
            )}
            {connecting && <span className="sync-text">CONNECTING...</span>}
          </div>
        </div>
      )}
    </div>
  );
}
