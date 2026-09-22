// Who may do what.
//
// This is the second copy of the role map — the first is app.role_permissions()
// in the database, which is the one that actually enforces anything. A copy is
// a liability, so packages/db has a test that reads the map out of Postgres and
// fails if these two ever disagree. Change one, change the other, or CI stops
// you.
//
// The demo uses this to decide what to render. The real product will keep using
// it for the same reason — hiding a button the server would refuse is a
// courtesy, not a control — but the refusal will come from the database.

export type Role = "owner" | "practitioner" | "assistant" | "reception" | "accountant";

export type Permission =
  | "patients.read"
  | "patients.write"
  | "clinical.read"
  | "clinical.write"
  | "schedule.read"
  | "schedule.write"
  | "messaging.send"
  | "recall.manage"
  | "settings.manage"
  | "staff.manage"
  | "audit.read";

export const ROLES: Role[] = ["owner", "practitioner", "assistant", "reception", "accountant"];

export const PERMISSIONS: Permission[] = [
  "patients.read",
  "patients.write",
  "clinical.read",
  "clinical.write",
  "schedule.read",
  "schedule.write",
  "messaging.send",
  "recall.manage",
  "settings.manage",
  "staff.manage",
  "audit.read",
];

/**
 * The deliberate layering:
 *   - reception runs the front desk: demographics and the diary, never the
 *     clinical record.
 *   - an assistant reads clinical context chairside but cannot write it.
 *   - an accountant has no patient access at all in this scope.
 *   - staff.manage and audit.read are owner-only: the staff list and the audit
 *     trail are the two most sensitive surfaces in the product.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "patients.read",
    "patients.write",
    "clinical.read",
    "clinical.write",
    "schedule.read",
    "schedule.write",
    "messaging.send",
    "recall.manage",
    "settings.manage",
    "staff.manage",
    "audit.read",
  ],
  practitioner: [
    "patients.read",
    "patients.write",
    "clinical.read",
    "clinical.write",
    "schedule.read",
    "schedule.write",
    "messaging.send",
    "recall.manage",
  ],
  assistant: [
    "patients.read",
    "patients.write",
    "clinical.read",
    "schedule.read",
    "schedule.write",
    "messaging.send",
    "recall.manage",
  ],
  reception: [
    "patients.read",
    "patients.write",
    "schedule.read",
    "schedule.write",
    "messaging.send",
    "recall.manage",
  ],
  accountant: ["schedule.read"],
};

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return permissionsFor(role).includes(permission);
}
