// The role map exists twice: in app.role_permissions() in the database, which
// enforces it, and in packages/core, which the interface reads to decide what
// to draw. Two copies of a security rule is exactly the kind of thing that
// quietly diverges and leaves a button that does nothing, or worse, a button
// that should not be there at all.
//
// So: read the map out of Postgres and compare it to the TypeScript one.

import { beforeAll, describe, expect, it } from "vitest";
import { ROLES, ROLE_PERMISSIONS, permissionsFor } from "@clinic/core";
import { asUser, createTestDb, type TestDb } from "./harness";
import { CLINIC_A, seedTenants, session } from "./fixtures";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
  await seedTenants(db);
}, 60_000);

describe("the role map in the database and the one in the code", () => {
  it("grant exactly the same permissions, role for role", async () => {
    for (const role of ROLES) {
      const fromDatabase = await asUser(db, session("ownerA", CLINIC_A, "owner"), async (tx) => {
        const result = await tx.query<{ perms: string[] }>(
          "select app.role_permissions($1) as perms",
          [role],
        );
        return result.rows[0].perms;
      });

      expect([...fromDatabase].sort(), `role "${role}" has drifted`).toEqual(
        [...permissionsFor(role)].sort(),
      );
    }
  });

  it("covers every role the database knows and no more", async () => {
    const { rows } = await db.query<{ constraint_def: string }>(`
      select pg_get_constraintdef(oid) as constraint_def
      from pg_constraint
      where conrelid = 'public.memberships'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) like '%role%'
    `);
    const definition = rows.map((r) => r.constraint_def).join(" ");
    for (const role of Object.keys(ROLE_PERMISSIONS)) {
      expect(definition, `role "${role}" is not allowed by the memberships check constraint`)
        .toContain(`'${role}'`);
    }
  });
});
