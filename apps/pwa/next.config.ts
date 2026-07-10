import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@geodrop/client"],
  // Some @solana/kit browser bundles carry a spurious `import 'fs'`.
  // Stub it out for the client bundle (same workaround as the root app).
  turbopack: {
    root: path.resolve(__dirname, "../.."),
    resolveAlias: {
      fs: { browser: "./empty-module.js" },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

export default nextConfig;
