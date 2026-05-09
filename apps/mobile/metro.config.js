const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project and workspace roots
const projectRoot = __dirname;
// Since we are in apps/mobile, the workspace root is two levels up
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and what to prioritize
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Enable symlinks to support PNPM
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
