// Two clinics with staff, for the tests that matter most: the ones that prove
// one clinic cannot reach another's rows. Seeded as the superuser, which
// bypasses row security, so the fixtures themselves are never shaped by the
// policies under test.

import type { TestDb } from "./harness";
import type { Claims } from "../src/index";

export const CLINIC_A = "aaaaaaaa-0000-4000-8000-000000000001";
export const CLINIC_B = "bbbbbbbb-0000-4000-8000-000000000002";

export const USERS = {
  ownerA: "11111111-0000-4000-8000-000000000001",
  receptionA: "11111111-0000-4000-8000-000000000002",
  lockedA: "11111111-0000-4000-8000-000000000003",
  ownerB: "22222222-0000-4000-8000-000000000001",
  // not members of anything: the people the "can an owner add staff" tests invite
  spare1: "33333333-0000-4000-8000-000000000001",
  spare2: "33333333-0000-4000-8000-000000000002",
  spare3: "33333333-0000-4000-8000-000000000003",
} as const;

export async function seedTenants(db: TestDb): Promise<void> {
  await db.exec(`
    insert into auth.users (id, email) values
      ('${USERS.ownerA}',     'owner.a@example.al'),
      ('${USERS.receptionA}', 'reception.a@example.al'),
      ('${USERS.lockedA}',    'locked.a@example.al'),
      ('${USERS.ownerB}',     'owner.b@example.al'),
      ('${USERS.spare1}',     'spare.1@example.al'),
      ('${USERS.spare2}',     'spare.2@example.al'),
      ('${USERS.spare3}',     'spare.3@example.al');

    insert into public.clinics (id, name, slug, city) values
      ('${CLINIC_A}', 'Klinika Arnika', 'arnika', 'Tiranë'),
      ('${CLINIC_B}', 'Klinika Bardha', 'bardha', 'Durrës');

    insert into public.memberships (clinic_id, user_id, role, status, full_name, locked_at) values
      ('${CLINIC_A}', '${USERS.ownerA}',     'owner',     'active', 'Ilir Zeqiri',  null),
      ('${CLINIC_A}', '${USERS.receptionA}', 'reception', 'active', 'Mira Leka',    null),
      ('${CLINIC_A}', '${USERS.lockedA}',    'assistant', 'locked', 'Ergi Doda',    now()),
      ('${CLINIC_B}', '${USERS.ownerB}',     'owner',     'active', 'Blerta Hoxha', null);
  `);
}

/** A session for one of the seeded people, working in one of the seeded clinics. */
export function session(
  user: keyof typeof USERS,
  clinic: string,
  role: string,
): Claims {
  return { sub: USERS[user], clinic_id: clinic, role, aal: "aal2" };
}
