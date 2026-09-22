"use client";

// The demo's database.
//
// PGlite is Postgres compiled to WASM, so this is a real Postgres running in
// the page: the real migrations, the real policies, the real query planner. No
// server, no Docker, no Supabase account. When the Frankfurt project exists,
// this module is replaced by a supabase-js client and the SQL above it does
// not change.
//
// WHAT THIS PROVES AND WHAT IT DOES NOT
// It proves the policies behave: ask as reception and the rows are not there.
// It proves nothing about security, because the page chooses its own claims —
// there is no server signing a token it cannot forge. Enforcement becomes real
// only on Supabase. The suite in packages/db is what gates that.

import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { beginSession, bootstrap, MIGRATIONS, type Claims } from "@clinic/db";

export type { Claims };

export interface BootReport {
  migrations: string[];
  /** milliseconds from first call to a usable database */
  bootMs: number;
}

let booting: Promise<{ db: PGlite; report: BootReport }> | null = null;

/**
 * Boots once per page load and is shared by every caller. In memory for now:
 * PGlite can persist to IndexedDB, but while the schema changes under us on
 * every commit, a fresh database each reload is the honest default.
 */
export function getDatabase(): Promise<{ db: PGlite; report: BootReport }> {
  if (!booting) {
    booting = (async () => {
      const startedAt = performance.now();
      const db = new PGlite({ extensions: { btree_gist } });
      await bootstrap(db, { withShim: true });
      return {
        db,
        report: {
          migrations: MIGRATIONS.map((m) => m.name),
          bootMs: Math.round(performance.now() - startedAt),
        },
      };
    })();
  }
  return booting;
}

/**
 * Runs `fn` as a signed-in member, inside a transaction, exactly as the test
 * harness does. Identity is transaction-scoped, so it cannot outlive the call.
 */
export async function queryAs<T>(
  claims: Claims | null,
  fn: (tx: {
    query<R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: R[] }>;
    exec(sql: string): Promise<unknown>;
  }) => Promise<T>,
): Promise<T> {
  const { db } = await getDatabase();
  const result = await db.transaction(async (tx) => {
    await beginSession(tx, claims);
    return fn(tx);
  });
  return result as T;
}
