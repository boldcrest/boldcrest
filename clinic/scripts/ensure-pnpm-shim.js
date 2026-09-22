#!/usr/bin/env node
// pnpm is not installed globally on this machine and `corepack enable` cannot
// write its shims to /usr/local/bin (EACCES) — only `corepack pnpm <cmd>`
// works. Turbo, though, needs an actual `pnpm` binary on PATH so it can shell
// out to each workspace package's scripts; without one every `turbo run ...`
// fails with "Unable to find package manager binary".
//
// pnpm always puts <workspace root>/node_modules/.bin on PATH for any script
// it runs (including this postinstall), so a tiny forwarding shim there is
// enough for turbo to find. `pnpm install` recreates node_modules/.bin from
// scratch each time, which would delete this file — hence recreating it here
// as a postinstall step instead of committing it (node_modules is gitignored).
const fs = require("node:fs");
const path = require("node:path");

const binDir = path.join(__dirname, "..", "node_modules", ".bin");
const shimPath = path.join(binDir, "pnpm");
const shim = "#!/bin/sh\nexec corepack pnpm \"$@\"\n";

fs.mkdirSync(binDir, { recursive: true });
fs.writeFileSync(shimPath, shim, { mode: 0o755 });
fs.chmodSync(shimPath, 0o755);
