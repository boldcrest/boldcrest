export * from "./migrations.generated";
import { MIGRATIONS, SUPABASE_SHIM } from "./migrations.generated";

/**
 * Claims as the Custom Access Token hook will write them on Supabase.
 *
 * In the browser demo we set these ourselves, which is exactly why the demo
 * proves the policies behave and proves nothing about security: a page that
 * can choose its own claims can choose any of them. Enforcement is only real
 * once a server signs the token.
 */
export interface Claims {
  sub?: string;
  clinic_id?: string | null;
  role?: string;
  aal?: "aal1" | "aal2";
}

/** The minimum any Postgres client must offer for the code below to work. */
export interface SqlRunner {
  exec(sql: string): Promise<unknown>;
  query<R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

/**
 * Applies the schema to an empty database, in order.
 *
 * `withShim` supplies the Supabase roles and `auth` functions that a real
 * project already has. True for tests and for the in-browser demo, never for
 * Supabase itself.
 */
export async function bootstrap(
  db: SqlRunner,
  { withShim = false }: { withShim?: boolean } = {},
): Promise<void> {
  if (withShim) await db.exec(SUPABASE_SHIM);

  for (const migration of MIGRATIONS) {
    try {
      await db.exec(migration.sql);
    } catch (cause) {
      throw new Error(`migration ${migration.name} failed: ${(cause as Error).message}`, { cause });
    }
  }
}

/**
 * Makes the current transaction run as a signed-in member.
 *
 * Both statements are transaction-scoped, so an identity cannot leak past the
 * commit. The claims are set before the role change, while still privileged.
 */
export async function beginSession(tx: SqlRunner, claims: Claims | null): Promise<void> {
  await tx.query("select set_config('request.jwt.claims', $1, true)", [
    claims === null ? "" : JSON.stringify(claims),
  ]);
  await tx.exec(`set local role ${claims === null ? "anon" : "authenticated"}`);
}
