import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "./components/pwa-register";
import { WalletProvider } from "./lib/wallet-context";

export const metadata: Metadata = {
  title: "GeoDrop Hunter",
  description:
    "Hunt live SOL bounties around you. Walk into a drop zone, prove you're there, and claim your share of the pool.",
  applicationName: "GeoDrop Hunter",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GeoDrop",
  },
  openGraph: {
    title: "GeoDrop Hunter",
    description: "Hunt live SOL bounties around you.",
    siteName: "GeoDrop",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
