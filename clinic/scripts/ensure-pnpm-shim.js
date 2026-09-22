#!/usr/bin/env node
// A workaround for one machine, which must not follow the code anywhere else.
//
// On Aldo's Mac pnpm is not installed globally and `corepack enable` cannot
// write its shims to /usr/local/bin (EACCES), so only `corepack pnpm <cmd>`
// works. Turbo needs a real `pnpm` binary on PATH to shell out to each
// workspace package's scripts; without one, every `turbo run ...` fails with
// "Unable to find package manager binary".
//
// pnpm puts <workspace root>/node_modules/.bin on PATH for any script it runs,
// so a forwarding shim there is enough. `pnpm install` rebuilds that directory
// every time, which is why this runs on postinstall rather than being
// committed.
//
// IMPORTANT: only when there is no real pnpm. node_modules/.bin comes FIRST on
// PATH, so writing this unconditionally would shadow a perfectly good pnpm —
// on a CI runner or on Vercel — with a shim that depends on corepack being
// enabled there. That is how a local convenience becomes a broken deploy.
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const binDir = path.join(__dirname, "..", "node_modules", ".bin");
const shimPath = path.join(binDir, "pnpm");

/** Is there a usable pnpm that is not this shim? */
function realPnpmExists() {
  const withoutOurBin = (process.env.PATH ?? "")
    .split(path.delimiter)
    .filter((entry) => path.resolve(entry) !== path.resolve(binDir))
    .join(path.delimiter);
  try {
    execFileSync("pnpm", ["--version"], {
      stdio: "ignore",
      env: { ...process.env, PATH: withoutOurBin },
    });
    return true;
  } catch {
    return false;
  }
}

if (realPnpmExists()) {
  console.log("pnpm is already on PATH; no shim needed.");
  process.exit(0);
}

fs.mkdirSync(binDir, { recursive: true });
fs.writeFileSync(shimPath, '#!/bin/sh\nexec corepack pnpm "$@"\n', { mode: 0o755 });
fs.chmodSync(shimPath, 0o755);
console.log("wrote a pnpm shim for turbo (no global pnpm found).");
