#!/usr/bin/env node

/**
 * 兼容旧命令入口：
 * 允许继续使用 `node scripts/admin-withdraw-all.cjs`
 * 内部转调新版 mjs 脚本。
 */

const { spawnSync } = require("child_process");

const selectedNetwork = process.env.NETWORK || "plasmaMainnet";
const args = [
  "hardhat",
  "run",
  "scripts/admin-withdraw-all.mjs",
  "--network",
  selectedNetwork,
];

const result = spawnSync("npx", args, {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("\n❌ 启动失败:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
