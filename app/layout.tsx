import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoDrop | Cross-Chain Physical Bounties",
  description: "Gamifying real-world onboarding to the Solana ecosystem. Pokémon GO meets cross-chain yield—driving foot traffic for merchants and crypto adoption for the masses.",
  keywords: ["Solana", "Bounties", "Geolocation", "Cross-Chain", "LiFi", "Web3", "Crypto"],
  authors: [{ name: "GeoDrop Team" }],
  openGraph: {
    title: "GeoDrop | Cross-Chain Physical Bounties",
    description: "Gamifying real-world onboarding to the Solana ecosystem.",
    url: "https://geodrop.xyz",
    siteName: "GeoDrop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
