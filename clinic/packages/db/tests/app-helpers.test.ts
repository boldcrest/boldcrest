// tests/app-helpers.test.ts
// Pattern 1, the tenancy helpers: claim readers and the role -> permission map.
//
// These four functions are the hinge the whole security model hangs on. Every
// RLS policy calls app.clinic_id() and app.has_perm(), so a wrong answer here
// is not a bug in one screen — it is cross-tenant data access everywhere at
// once. Hence the exhaustive per-role assertions rather than a spot check.

import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestDb, migrationNames, scalar, type Claims, type TestDb } from "./harness";
import { CLINIC_A, seedTenants, USERS } from "./fixtures";

// The owner of clinic A, who really is a member of it — app.clinic_id() now
// confirms the claim against the membership table, so a made-up id answers null.
const staff = (role: string, over: Partial<Claims> = {}): Claims => ({
  sub: USERS.ownerA,
  clinic_id: CLINIC_A,
  role,
  aal: "aal2",
  ...over,
});

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
  await seedTenants(db);
}, 60_000);

describe("migrations", () => {
  it("applies every migration in order against a bare Postgres", () => {
    // createTestDb() throws with the offending filename if any file fails, so
    // reaching here is the assertion. This test states the guarantee.
    expect(migrationNames().length).toBeGreaterThan(0);
  });

  it("creates the app schema without exposing it to anonymous requests", async () => {
    // `app` holds the security primitives. PostgREST exposes `public` only,
    // but schema privileges are the actual boundary — assert them, not the
    // absence of a config line.
    await expect(
      asUser(db, null, (tx) => scalar<boolean>(tx, "select app.has_perm('patients.read')")),
    ).rejects.toThrow(/permission denied for schema app/i);
  });
});

describe("claim readers", () => {
  it("answers with the clinic when an active membership backs the claim", async () => {
    const got = await asUser(db, staff("owner"), (tx) =>
      scalar<string>(tx, "select app.clinic_id()"),
    );
    expect(got).toBe(CLINIC_A);
  });

  it("answers null when the claim is not backed by a membership", async () => {
    // The token is the question, not the answer. Someone who was removed, or
    // whose token names a clinic they never worked at, gets nothing — see
    // tenancy.test.ts for the full set of attempts.
    const got = await asUser(
      db,
      staff("owner", { clinic_id: "cccccccc-0000-4000-8000-00000000000c" }),
      (tx) => scalar<string | null>(tx, "select app.clinic_id()"),
    );
    expect(got).toBeNull();
  });

  it("returns null when the token carries no clinic, rather than failing open", async () => {
    // A token with no clinic_id belongs to someone mid-invitation or between
    // clinics. Null makes every `clinic_id = app.clinic_id()` comparison
    // false, so they see nothing. An error would be safe too; a wrong uuid
    // would not.
    const absent = await asUser(db, staff("owner", { clinic_id: undefined }), (tx) =>
      scalar<string | null>(tx, "select app.clinic_id()"),
    );
    expect(absent).toBeNull();
  });

  it("treats an empty clinic_id claim as null, not a cast error", async () => {
    const empty = await asUser(db, staff("owner", { clinic_id: "" }), (tx) =>
      scalar<string | null>(tx, "select app.clinic_id()"),
    );
    expect(empty).toBeNull();
  });

  it("reads role and aal from the JWT", async () => {
    const [role, aal] = await asUser(db, staff("reception", { aal: "aal1" }), async (tx) => [
      await scalar<string>(tx, "select app.role()"),
      await scalar<string>(tx, "select app.aal()"),
    ]);
    expect(role).toBe("reception");
    expect(aal).toBe("aal1");
  });

  it("ignores claims that are not in the token", async () => {
    const role = await asUser(db, { sub: staff("owner").sub }, (tx) =>
      scalar<string | null>(tx, "select app.role()"),
    );
    expect(role).toBeNull();
  });
});

describe("role -> permission map", () => {
  const permissionsOf = (role: string) =>
    asUser(db, staff("owner"), (tx) =>
      scalar<string[]>(tx, "select app.role_permissions($1)", [role]),
    );

  it("gives the owner every permission", async () => {
    expect([...(await permissionsOf("owner"))].sort()).toEqual([
      "audit.read",
      "clinical.read",
      "clinical.write",
      "messaging.send",
      "patients.read",
      "patients.write",
      "recall.manage",
      "schedule.read",
      "schedule.write",
      "settings.manage",
      "staff.manage",
    ]);
  });

  it("keeps reception out of the clinical record entirely", async () => {
    const reception = await permissionsOf("reception");
    expect(reception).not.toContain("clinical.read");
    expect(reception).not.toContain("clinical.write");
    expect(reception).toContain("patients.write");
    expect(reception).toContain("schedule.write");
  });

  it("lets an assistant read clinical context but never write it", async () => {
    const assistant = await permissionsOf("assistant");
    expect(assistant).toContain("clinical.read");
    expect(assistant).not.toContain("clinical.write");
  });

  it("gives the accountant no patient or clinical access at all", async () => {
    expect(await permissionsOf("accountant")).toEqual(["schedule.read"]);
  });

  it("reserves staff.manage and audit.read for the owner", async () => {
    for (const role of ["practitioner", "assistant", "reception", "accountant"]) {
      const perms = await permissionsOf(role);
      expect(perms, role).not.toContain("staff.manage");
      expect(perms, role).not.toContain("audit.read");
    }
  });

  it("returns nothing for a role it does not know", async () => {
    // A typo in a JWT claim, or a role removed from the product, must deny
    // rather than inherit whatever the CASE would otherwise fall through to.
    expect(await permissionsOf("superuser")).toEqual([]);
    expect(await permissionsOf("")).toEqual([]);
  });
});

describe("has_perm", () => {
  it("answers from the session's own role", async () => {
    const asReception = await asUser(db, staff("reception"), async (tx) => ({
      patients: await scalar<boolean>(tx, "select app.has_perm('patients.read')"),
      clinical: await scalar<boolean>(tx, "select app.has_perm('clinical.read')"),
    }));
    expect(asReception).toEqual({ patients: true, clinical: false });
  });

  it("denies everything when the token carries no role", async () => {
    const got = await asUser(db, { sub: staff("owner").sub, clinic_id: CLINIC_A }, (tx) =>
      scalar<boolean>(tx, "select app.has_perm('patients.read')"),
    );
    expect(got).toBe(false);
  });

  it("denies an unknown permission key", async () => {
    const got = await asUser(db, staff("owner"), (tx) =>
      scalar<boolean>(tx, "select app.has_perm('patients.destroy')"),
    );
    expect(got).toBe(false);
  });
});
