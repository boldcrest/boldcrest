// tests/harness.ts
// One in-memory Postgres per test file, with the real migrations applied in
// order. PGlite is Postgres compiled to WASM, so the SQL under test is the
// same SQL that will run on Supabase — no Docker, no dialect translation.
//
// The schema comes from the generated module rather than from disk, so the
// tests exercise exactly what the browser demo loads. A drift test keeps that
// module honest against the .sql files.

import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { beginSession, bootstrap, MIGRATIONS, type Claims } from "../src/index";

export type { Claims };
export type TestDb = PGlite;

export function migrationNames(): string[] {
  return MIGRATIONS.map((m) => m.name);
}

/** Fresh database: Supabase shim first, then every migration in order. */
export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite({ extensions: { btree_gist } });
  await bootstrap(db, { withShim: true });
  return db;
}

/**
 * Run `fn` as a signed-in user carrying `claims`; null for an anonymous
 * request. The role and the claims are transaction-scoped, so one test cannot
 * leak its identity into the next.
 */
export async function asUser<T>(
  db: TestDb,
  claims: Claims | null,
  fn: (tx: Queryable) => Promise<T>,
): Promise<T> {
  const result = await db.transaction(async (tx) => {
    await beginSession(tx, claims);
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
