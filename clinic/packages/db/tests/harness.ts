// tests/harness.ts
// One in-memory Postgres per test file, with the real migrations applied in
// order. PGlite is Postgres compiled to WASM, so the SQL under test is the
// same SQL that will run on Supabase — no Docker, no dialect translation.

import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "..", "supabase", "migrations");

/** Claims as the Custom Access Token hook (step 1.5) will write them. */
export type Claims = {
  sub?: string;
  clinic_id?: string | null;
  role?: string;
  aal?: "aal1" | "aal2";
};

export type TestDb = PGlite;

/** Migration filenames in the order Postgres will see them. */
export async function migrationFiles(): Promise<string[]> {
  const files = await readdir(migrationsDir);
  return files.filter((f) => f.endsWith(".sql")).sort();
}

/**
 * Fresh database: Supabase shim first, then every migration in filename order.
 * Applying them in order (rather than loading a dumped schema) means a
 * migration that only works against an already-migrated database fails here.
 */
export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec(await readFile(path.join(here, "supabase-shim.sql"), "utf8"));

  for (const file of await migrationFiles()) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    try {
      await db.exec(sql);
    } catch (cause) {
      throw new Error(`migration ${file} failed: ${(cause as Error).message}`, { cause });
    }
  }

  return db;
}

/**
 * Run `fn` as a signed-in user carrying `claims`.
 *
 * SET LOCAL ROLE is transaction-scoped, so the role and the claims both fall
 * away at commit and one test cannot leak its identity into the next. Pass
 * null for an anonymous request.
 *
 * The claims GUC is set BEFORE the role change, while still superuser.
 */
export async function asUser<T>(
  db: TestDb,
  claims: Claims | null,
  fn: (tx: Queryable) => Promise<T>,
): Promise<T> {
  const result = await db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claims', $1, true)", [
      claims === null ? "" : JSON.stringify(claims),
    ]);
    await tx.exec(`set local role ${claims === null ? "anon" : "authenticated"}`);
    return fn(tx);
  });
  return result as T;
}

/** The subset of PGlite's transaction surface the tests use. */
export type Queryable = {
  query<R = Record<string, unknown>>(
    query: string,
    params?: unknown[],
  ): Promise<{ rows: R[] }>;
  exec(query: string): Promise<unknown>;
};

/** First column of the first row, for the many single-value assertions. */
export async function scalar<T>(q: Queryable, sql: string, params?: unknown[]): Promise<T> {
  const { rows } = await q.query<Record<string, T>>(sql, params);
  const first = rows[0];
  if (first === undefined) throw new Error(`no rows returned by: ${sql}`);
  const values = Object.values(first);
  if (values.length === 0) throw new Error(`no columns returned by: ${sql}`);
  return values[0] as T;
}
