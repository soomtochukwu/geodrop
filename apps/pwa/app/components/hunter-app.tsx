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
  const { drops, loading: loadingDrops } = useDrops();
  const { claimBounty, status, txSignature, errorMessage, isWalletAvailable } =
    useClaimBounty();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  // Find nearest drop and its live distance — same logic as the mobile app.
  const nearestDropInfo = useMemo(() => {
    if (!position || drops.length === 0) return null;

    let minDistance = Infinity;
    let closestDrop: Account<Drop> | null = null;

    drops.forEach((drop) => {
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
  }, [position, drops]);

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
        return {
          address: drop.address,
          lat: microDegreesToDegrees(drop.data.latitude),
          lng: microDegreesToDegrees(drop.data.longitude),
          radius: Number(drop.data.radius),
          name: decodeDropName(drop),
          rewardSol: formatLamportsToSol(drop.data.rewardPerClaim),
          slotsLeft:
            Number(drop.data.maxClaims) - Number(drop.data.currentClaims),
          isNearest,
          highlight: isNearest && inRange,
        };
      }),
    [drops, nearestDrop, inRange]
  );

  const claimDisabled =
    isWalletAvailable && (!inRange || status === "claiming");

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
