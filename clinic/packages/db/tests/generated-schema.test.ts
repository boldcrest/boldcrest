// The browser demo cannot read the filesystem, so it loads the schema from a
// generated module. That module is the one thing in the repo that can silently
// disagree with the source it was generated from: edit a .sql file, forget to
// regenerate, and the tests keep passing against yesterday's schema while the
// demo runs today's. This test is the tripwire.

import { describe, expect, it } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIGRATIONS, SUPABASE_SHIM } from "../src/index";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "..", "supabase", "migrations");

describe("generated schema module", () => {
  it("matches the .sql files on disk, name for name and byte for byte", async () => {
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
    expect(
      MIGRATIONS.map((m) => m.name),
      "run `corepack pnpm --filter @clinic/db run generate`",
    ).toEqual(files);

    for (const file of files) {
      const onDisk = await readFile(path.join(migrationsDir, file), "utf8");
      const generated = MIGRATIONS.find((m) => m.name === file)?.sql;
      expect(generated, `${file} is stale — regenerate`).toBe(onDisk);
    }
  });

  it("carries the Supabase shim", async () => {
    const onDisk = await readFile(path.join(here, "supabase-shim.sql"), "utf8");
    expect(SUPABASE_SHIM, "shim is stale — regenerate").toBe(onDisk);
  });
});
