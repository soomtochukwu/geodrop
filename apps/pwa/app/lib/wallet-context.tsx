"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { getWallets } from "@wallet-standard/app";
import type { Wallet as StandardWallet } from "@wallet-standard/base";
import {
  StandardConnect,
  StandardDisconnect,
  type StandardConnectFeature,
  type StandardDisconnectFeature,
} from "@wallet-standard/features";
import {
  SolanaSignAndSendTransaction,
  SolanaSignTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import type { Address } from "@solana/kit";
import { SOLANA_CHAIN } from "./config";

/**
 * Browser replacement for the mobile app's Mobile Wallet Adapter provider
 * (components/WalletProvider.android.tsx). Discovers injected Solana wallets
 * via the Wallet Standard and exposes connect / sign / send.
 */

export type WalletOption = {
  id: string;
  name: string;
  icon?: string;
};

export type ConnectedWallet = {
  option: WalletOption;
  address: Address;
  /** Signs and submits a fully serialized wire transaction, returns the signature bytes. */
  signAndSendTransaction?: (wireTransaction: Uint8Array) => Promise<Uint8Array>;
  /** Signs a fully serialized wire transaction, returns the signed wire bytes. */
  signTransaction?: (wireTransaction: Uint8Array) => Promise<Uint8Array>;
  disconnect: () => Promise<void>;
};

type WalletContextValue = {
  wallets: WalletOption[];
  wallet: ConnectedWallet | null;
  connecting: boolean;
  error: string | null;
  connect: (walletId: string) => Promise<ConnectedWallet | null>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = "geodrop:last-wallet";
const CHAIN = SOLANA_CHAIN as `${string}:${string}`;

function isSolanaWallet(wallet: StandardWallet) {
  return (
    StandardConnect in wallet.features &&
    wallet.chains.some((chain) => chain.startsWith("solana:"))
  );
}

function listSolanaWallets(): StandardWallet[] {
  return getWallets().get().filter(isSolanaWallet);
}

async function connectWallet(
  standardWallet: StandardWallet,
  silent: boolean
): Promise<ConnectedWallet> {
  const connectFeature = standardWallet.features[
    StandardConnect
  ] as StandardConnectFeature[typeof StandardConnect];
  const { accounts } = await connectFeature.connect(
    silent ? { silent: true } : undefined
  );

  const account = accounts[0] ?? standardWallet.accounts[0];
  if (!account) throw new Error("No accounts available");

  const hasSendTx = SolanaSignAndSendTransaction in standardWallet.features;
  const hasSignTx = SolanaSignTransaction in standardWallet.features;

  return {
    option: {
      id: standardWallet.name,
      name: standardWallet.name,
      icon: standardWallet.icon,
    },
    address: account.address as Address,
    signAndSendTransaction: hasSendTx
      ? async (wireTransaction) => {
          const feature = standardWallet.features[
            SolanaSignAndSendTransaction
          ] as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];
          const [result] = await feature.signAndSendTransaction({
            account,
            transaction: wireTransaction,
            chain: CHAIN,
          });
          return new Uint8Array(result.signature);
        }
      : undefined,
    signTransaction: hasSignTx
      ? async (wireTransaction) => {
          const feature = standardWallet.features[
            SolanaSignTransaction
          ] as SolanaSignTransactionFeature[typeof SolanaSignTransaction];
          const [result] = await feature.signTransaction({
            account,
            transaction: wireTransaction,
            chain: CHAIN,
          });
          return new Uint8Array(result.signedTransaction);
        }
      : undefined,
    disconnect: async () => {
      if (StandardDisconnect in standardWallet.features) {
        const feature = standardWallet.features[
          StandardDisconnect
        ] as StandardDisconnectFeature[typeof StandardDisconnect];
        await feature.disconnect();
      }
    },
  };
}

export function WalletProvider({ children }: PropsWithChildren) {
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoConnectAttempted = useRef(false);

  useEffect(() => {
    const registry = getWallets();

    const update = () => {
      setWallets(
        listSolanaWallets().map((w) => ({
          id: w.name,
          name: w.name,
          icon: w.icon,
        }))
      );
    };
    update();

    const offRegister = registry.on("register", update);
    const offUnregister = registry.on("unregister", update);

    // Silent auto-reconnect to the last used wallet.
    const lastId = localStorage.getItem(STORAGE_KEY);
    if (lastId && !autoConnectAttempted.current) {
      autoConnectAttempted.current = true;
      const target = listSolanaWallets().find((w) => w.name === lastId);
      if (target) {
        connectWallet(target, true)
          .then(setWallet)
          .catch(() => localStorage.removeItem(STORAGE_KEY));
      }
    }

    return () => {
      offRegister();
      offUnregister();
    };
  }, []);

  const connect = useCallback(async (walletId: string) => {
    const target = listSolanaWallets().find((w) => w.name === walletId);
    if (!target) {
      setError(`Wallet not found: ${walletId}`);
      return null;
    }

    setConnecting(true);
    setError(null);
    try {
      const connected = await connectWallet(target, false);
      setWallet(connected);
      localStorage.setItem(STORAGE_KEY, walletId);
      return connected;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (wallet) {
      try {
        await wallet.disconnect();
      } catch {
        // ignore disconnect errors
      }
    }
    setWallet(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [wallet]);

  const value = useMemo(
    () => ({ wallets, wallet, connecting, error, connect, disconnect }),
    [wallets, wallet, connecting, error, connect, disconnect]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
