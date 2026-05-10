import React, { type PropsWithChildren } from "react";
import { MobileWalletProvider } from "@wallet-ui/react-native-kit";

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <MobileWalletProvider
      cluster={{
        id: "solana:devnet",
        url: "https://api.devnet.solana.com",
      }}
      identity={{
        name: "GeoDrop",
        uri: "https://geodrop.xyz",
        icon: "favicon.png",
      }}
    >
      {children}
    </MobileWalletProvider>
  );
}
