"use client";

// The seam, made visible.
//
// Everything on this page is answered by a real Postgres running inside the
// page, from the same migrations that will run on Supabase. Change the role in
// the dropdown and the answers change because the database says so — no
// component here decides who may see what.

import { useEffect, useState } from "react";
import { CheckCircle, Database, Warning, XCircle } from "@phosphor-icons/react";
import { Button, Card, CardHeader, Field, Pill, Select, Skeleton } from "@clinic/ui";
import { PERMISSIONS as ALL_PERMISSIONS, ROLES as ALL_ROLES, ROLE_PERMISSIONS, type Permission, type Role as StaffRole } from "@clinic/core";
import { FadeIn, PageHeader } from "@/components/shell";
import { useDemo } from "@/lib/demo/store";
import { getDatabase, queryAs, type BootReport, type Claims } from "@/lib/db/browser";

/** Every permission key the role map knows about. */
const PERMISSIONS = [
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
] as const;

const ROLES = ["owner", "practitioner", "assistant", "reception", "accountant"] as const;
type Role = (typeof ROLES)[number] | "anon";

const DEMO_CLINIC = "11111111-1111-4111-8111-111111111111";
const DEMO_USER = "99999999-9999-4999-8999-999999999999";

function claimsFor(role: Role): Claims | null {
  if (role === "anon") return null;
  return { sub: DEMO_USER, clinic_id: DEMO_CLINIC, role, aal: "aal2" };
}

export default function DatabasePage() {
  const [report, setReport] = useState<BootReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("owner");
  const [granted, setGranted] = useState<Record<string, boolean> | null>(null);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDatabase()
      .then(({ report }) => !cancelled && setReport(report))
      .catch((cause: Error) => !cancelled && setError(cause.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!report) return;
    let cancelled = false;

    void (async () => {
      try {
        // One round trip: ask the database, for this identity, which of the
        // permission keys it holds. The answer comes from app.has_perm, the
        // same function every policy calls.
        const rows = await queryAs(claimsFor(role), async (tx) => {
          const result = await tx.query<{ perm: string; ok: boolean }>(
            `select perm, app.has_perm(perm) as ok from unnest($1::text[]) as perm`,
            [PERMISSIONS as unknown as string[]],
          );
          return result.rows;
        });
        if (cancelled) return;
        setGranted(Object.fromEntries(rows.map((r) => [r.perm, r.ok])));
        setDenied(null);
      } catch (cause) {
        // An anonymous request cannot even reach the app schema. That is the
        // correct answer, so it is shown rather than swallowed.
        if (cancelled) return;
        setGranted(null);
        setDenied((cause as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [report, role]);

  return (
    <>
      <PageHeader title="Baza e të dhënave">
        <p className="mt-1 text-sm text-ink-3">
          Postgres i vërtetë, brenda kësaj faqeje. Të njëjtat migrime që do të ekzekutohen në
          Supabase.
        </p>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <FadeIn>
          <Card>
            <CardHeader
              title="Gjendja"
              action={
                report ? (
                  <Pill tone="ok" icon={<CheckCircle size={12} weight="fill" />}>
                    {report.bootMs} ms
                  </Pill>
                ) : error ? (
                  <Pill tone="danger" icon={<Warning size={12} weight="fill" />}>
                    gabim
                  </Pill>
                ) : (
                  <Pill tone="neutral">duke u ngarkuar</Pill>
                )
              }
            />
            <div className="px-6 pb-5">
              {error ? (
                <p className="rounded-card bg-danger-soft px-3 py-2 text-xs text-danger">
                  {error}
                </p>
              ) : report ? (
                <ul className="flex flex-col gap-1">
                  {report.migrations.map((name) => (
                    <li
                      key={name}
                      className="nums flex items-center gap-2 text-xs text-ink-2"
                    >
                      <Database size={13} weight="bold" className="text-ink-4" />
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                <Skeleton className="h-5 w-64" />
              )}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card>
            <CardHeader
              title="Kush sheh çfarë"
              hint="Përgjigjet vijnë nga app.has_perm() në bazë, jo nga kodi i faqes."
              action={
                <div className="w-48">
                  <Field label="">
                    <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="anon">pa u identifikuar</option>
                    </Select>
                  </Field>
                </div>
              }
            />
            <div className="px-6 pb-5">
              {denied ? (
                <p className="rounded-card bg-warn-soft px-3 py-2 text-xs text-warn">
                  Baza e refuzoi kërkesën: {denied}
                </p>
              ) : granted ? (
                <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {PERMISSIONS.map((perm) => (
                    <li key={perm} className="flex items-center gap-2 text-[13px]">
                      {granted[perm] ? (
                        <CheckCircle size={15} weight="fill" className="text-ok" />
                      ) : (
                        <XCircle size={15} weight="fill" className="text-ink-4" />
                      )}
                      <span className={granted[perm] ? "text-ink" : "text-ink-4"}>{perm}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <RoleDesigner />
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card>
            <CardHeader title="Çfarë provon kjo faqe" />
            <div className="flex flex-col gap-2 px-6 pb-5 text-[13px] leading-relaxed text-ink-2">
              <p>
                <strong className="text-ink">Provon</strong> se rregullat e aksesit sillen siç
                duhet: pyet si recepsion dhe përgjigjja ndryshon sepse baza e thotë, jo sepse e
                fsheh faqja.
              </p>
              <p>
                <strong className="text-ink">Nuk provon</strong> se produkti është i sigurt. Këtu
                faqja i zgjedh vetë të dhënat e identitetit, pra mund të shtiret si kushdo. Siguria
                bëhet e vërtetë vetëm kur token-in e nënshkruan serveri, në Supabase.
              </p>
            </div>
          </Card>
        </FadeIn>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ role designer */

/**
 * The role map, as something to move rather than read.
 *
 * Deciding what reception should see is a judgement about how a clinic runs,
 * and it is far easier to make by ticking a box and looking at the screens
 * than by reasoning in the abstract. So: tick here, then use the "viewing as"
 * switcher in the header and go look.
 *
 * These are proposals. The database's own map is shown alongside and does not
 * move — changing that for real is a migration, which is the point: the rule
 * that enforces anything should be hard to change by accident.
 */
function RoleDesigner() {
  const { state, actions } = useDemo();

  const effective = (role: StaffRole): Permission[] =>
    state.permissionOverrides[role] ?? ROLE_PERMISSIONS[role];

  function toggle(role: StaffRole, permission: Permission) {
    const current = effective(role);
    actions.setRolePermissions(
      role,
      current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission],
    );
  }

  const changed = ALL_ROLES.filter((role) => {
    const override = state.permissionOverrides[role];
    if (!override) return false;
    const base = ROLE_PERMISSIONS[role];
    return override.length !== base.length || override.some((p) => !base.includes(p));
  });

  return (
    <Card>
      <CardHeader
        title="Rregullat e aksesit"
        hint="Ndrysho çfarë sheh secili rol, pastaj përdor 'Po sheh si' lart për ta parë. Ndryshimet janë propozime — rregulli i vërtetë ndryshohet me një migrim."
        action={
          changed.length > 0 ? (
            <Button size="sm" onClick={() => actions.resetPermissions()}>
              Kthe si në bazë
            </Button>
          ) : null
        }
      />
      <div className="overflow-x-auto px-6 pb-5">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="pb-2 text-left font-medium text-ink-3">&nbsp;</th>
              {ALL_ROLES.map((role) => (
                <th key={role} className="pb-2 text-center font-medium text-ink-2">
                  {role}
                  {changed.includes(role) ? (
                    <span className="ml-1 text-warn" title="ndryshuar">
                      •
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((permission) => (
              <tr key={permission} className="border-t border-line">
                <td className="py-1.5 pr-4 text-ink-2">{permission}</td>
                {ALL_ROLES.map((role) => (
                  <td key={role} className="py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={effective(role).includes(permission)}
                      onChange={() => toggle(role, permission)}
                      aria-label={`${role} ${permission}`}
                      className="size-4 cursor-pointer accent-[var(--accent)]"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
