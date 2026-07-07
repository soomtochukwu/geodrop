import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Some @solana/kit browser bundles carry a spurious `import 'fs'`.
  // Stub it out for the client bundle (same workaround as the root app).
  turbopack: {
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
