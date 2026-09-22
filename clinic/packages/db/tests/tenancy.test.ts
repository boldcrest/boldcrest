// Domain A: clinics, memberships, and the two boundaries that hang off them.
//
// A cross-tenant leak is the failure that ends the product, so these are the
// tests that gate a merge. They are written as "what would the attacker try",
// not "does the happy path work".

import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestDb, scalar, type TestDb } from "./harness";
import { CLINIC_A, CLINIC_B, seedTenants, session, USERS } from "./fixtures";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
  await seedTenants(db);
}, 60_000);

describe("a session is confined to one clinic", () => {
  it("sees its own clinic and no other", async () => {
    const rows = await asUser(db, session("ownerA", CLINIC_A, "owner"), async (tx) => {
      const result = await tx.query<{ id: string; name: string }>("select id, name from clinics");
      return result.rows;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(CLINIC_A);
  });

  it("cannot reach the other clinic by asking for it directly", async () => {
    // Not an error — an empty result. A policy that raised would tell the
    // caller the row exists.
    const rows = await asUser(db, session("ownerA", CLINIC_A, "owner"), async (tx) => {
      const result = await tx.query("select id from clinics where id = $1", [CLINIC_B]);
      return result.rows;
    });
    expect(rows).toHaveLength(0);
  });

  it("sees only its own colleagues", async () => {
    const names = await asUser(db, session("ownerA", CLINIC_A, "owner"), async (tx) => {
      const result = await tx.query<{ full_name: string }>(
        "select full_name from memberships order by full_name",
      );
      return result.rows.map((r) => r.full_name);
    });
    expect(names).toEqual(["Ergi Doda", "Ilir Zeqiri", "Mira Leka"]);
    expect(names).not.toContain("Blerta Hoxha");
  });

  it("gets nothing when the token names a clinic the person does not work at", async () => {
    // The obvious forgery: take a real session and edit the clinic in the token.
    const clinicId = await asUser(db, session("ownerA", CLINIC_B, "owner"), (tx) =>
      scalar<string | null>(tx, "select app.clinic_id()"),
    );
    expect(clinicId).toBeNull();

    const rows = await asUser(db, session("ownerA", CLINIC_B, "owner"), async (tx) => {
      const result = await tx.query("select id from clinics");
      return result.rows;
    });
    expect(rows).toHaveLength(0);
  });
});

describe("locking an account (D9)", () => {
  it("takes effect on the next query, not when the token expires", async () => {
    // The whole point of checking the membership rather than trusting the
    // claim: a dismissed person's existing access token is still perfectly
    // valid, and must stop working anyway.
    const clinicId = await asUser(db, session("lockedA", CLINIC_A, "assistant"), (tx) =>
      scalar<string | null>(tx, "select app.clinic_id()"),
    );
    expect(clinicId).toBeNull();
  });

  it("leaves a locked person's rows in place for the audit trail", async () => {
    const rows = await asUser(db, session("ownerA", CLINIC_A, "owner"), async (tx) => {
      const result = await tx.query<{ status: string; locked_at: string | null }>(
        "select status, locked_at from memberships where user_id = $1",
        [USERS.lockedA],
      );
      return result.rows;
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("locked");
    expect(rows[0].locked_at).not.toBeNull();
  });
});

describe("who may change the staff list", () => {
  it("lets an owner add a member", async () => {
    const inserted = await asUser(db, session("ownerA", CLINIC_A, "owner"), async (tx) => {
      const result = await tx.query<{ id: string }>(
        `insert into memberships (clinic_id, user_id, role, full_name)
         values ($1, $2, 'practitioner', 'Rea Tafani') returning id`,
        [CLINIC_A, USERS.spare1],
      );
      return result.rows;
    });
    expect(inserted).toHaveLength(1);
  });

  it("refuses reception, who has no staff.manage", async () => {
    await expect(
      asUser(db, session("receptionA", CLINIC_A, "reception"), (tx) =>
        tx.query(
          `insert into memberships (clinic_id, user_id, role, full_name)
           values ($1, $2, 'owner', 'Smuggled In')`,
          [CLINIC_A, USERS.spare2],
        ),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("refuses an owner planting a member in someone else's clinic", async () => {
    await expect(
      asUser(db, session("ownerA", CLINIC_A, "owner"), (tx) =>
        tx.query(
          `insert into memberships (clinic_id, user_id, role, full_name)
           values ($1, $2, 'owner', 'Trojan Horse')`,
          [CLINIC_B, USERS.spare3],
        ),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("gives nobody a way to delete a membership, not even an owner", async () => {
    // Refused at the privilege level, before any policy is consulted: DELETE
    // was never granted. People are locked, never removed, or the audit trail
    // stops resolving to a person (D9).
    await expect(
      asUser(db, session("ownerA", CLINIC_A, "owner"), (tx) =>
        tx.query("delete from memberships where user_id = $1", [USERS.lockedA]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });
});

describe("the wall between us and the clinics (D10)", () => {
  async function asOperator<T>(fn: (tx: Parameters<Parameters<typeof asUser>[2]>[0]) => Promise<T>) {
    return db.transaction(async (tx) => {
      await tx.exec("set local role operator");
      return fn(tx as never);
    });
  }

  it("refuses the operator the clinics and memberships tables", async () => {
    await expect(asOperator((tx) => tx.query("select * from public.clinics"))).rejects.toThrow(
      /permission denied/i,
    );
    await expect(asOperator((tx) => tx.query("select * from public.memberships"))).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("refuses the operator EVERY table in public, including ones not written yet", async () => {
    // The test that has to keep passing as the schema grows. A patient table
    // added in six months is covered by this without anyone remembering to
    // come back here, because the privilege is denied by default rather than
    // table by table.
    const { rows } = await db.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    );
    expect(rows.length).toBeGreaterThan(0);

    for (const { tablename } of rows) {
      await expect(
        asOperator((tx) => tx.query(`select * from public."${tablename}" limit 1`)),
        `operator could read public.${tablename}`,
      ).rejects.toThrow(/permission denied/i);
    }
  });

  it("gives the operator its own schema to work in", async () => {
    const allowed = await db.query<{ has: boolean }>(
      "select has_schema_privilege('operator', 'ops', 'usage') as has",
    );
    expect(allowed.rows[0].has).toBe(true);

    const denied = await db.query<{ has: boolean }>(
      "select has_schema_privilege('operator', 'public', 'usage') as has",
    );
    expect(denied.rows[0].has).toBe(false);
  });

  it("keeps the clinics out of our schema too", async () => {
    const { rows } = await db.query<{ has: boolean }>(
      "select has_schema_privilege('authenticated', 'ops', 'usage') as has",
    );
    expect(rows[0].has).toBe(false);
  });
});
