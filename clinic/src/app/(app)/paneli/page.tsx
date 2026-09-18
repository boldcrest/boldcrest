"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  Clock,
  Repeat,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Button, Card, CardHeader, EmptyState, Pill, cx } from "@/components/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { ConfirmationBadge, FollowUpBadge, StatusBadge } from "@/components/status";
import { AppointmentSheet } from "@/components/appointment-sheet";
import { WhatsAppComposer, useWhatsAppComposer } from "@/components/whatsapp-composer";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { formatTime } from "@/lib/i18n";
import { reminderTemplateFor } from "@/lib/whatsapp";
import { daysUntilDue, isDue, isOverdue, followUpPriority } from "@/lib/protocols";
import type { Appointment } from "@/lib/demo/types";

export default function DashboardPage() {
  const { t, state, now } = useDemo();
  const s = useSelectors();
  const [openAppointment, setOpenAppointment] = useState<Appointment | null>(null);
  const composer = useWhatsAppComposer();

  const todays = useMemo(() => s.appointmentsOn(now), [s, now]);

  const unconfirmed = useMemo(
    () =>
      state.appointments
        .filter(
          (a) =>
            a.status === "scheduled" &&
            a.confirmation !== "confirmed" &&
            new Date(a.start) >= now,
        )
        .sort((a, b) => a.start.localeCompare(b.start)),
    [state.appointments, now],
  );

  const dueFollowUps = useMemo(
    () =>
      state.followUps
        .filter((f) => isDue(f, now))
        .sort((a, b) => followUpPriority(a, now) - followUpPriority(b, now)),
    [state.followUps, now],
  );

  const overdueCount = state.followUps.filter((f) => isOverdue(f, now)).length;
  const awaitingBooking = state.followUps.filter((f) => f.status === "confirmed").length;

  const recentVisits = useMemo(
    () =>
      [...state.visits]
        .filter((v) => new Date(v.date) <= now)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4),
    [state.visits, now],
  );

  /* A tile only takes on colour when it has something in it. A clinic with
     nothing outstanding sees four quiet grey tiles; work arriving is what
     lights the dashboard up, so colour always means "look here". */
  const stats = [
    {
      label: t.dashboard.todayAppointments,
      value: todays.length,
      Icon: CalendarBlank,
      mesh: "mesh-blue",
      href: "/orari",
      to: t.nav.schedule,
    },
    {
      label: t.dashboard.unconfirmed,
      value: unconfirmed.length,
      Icon: Clock,
      mesh: "mesh-amber",
      href: "/orari",
      to: t.nav.schedule,
    },
    {
      label: t.dashboard.followupsDue,
      value: dueFollowUps.length,
      Icon: Repeat,
      mesh: "mesh-green",
      href: "/ndjekjet",
      to: t.nav.followups,
    },
    {
      label: t.dashboard.overdue,
      value: overdueCount,
      Icon: WarningCircle,
      mesh: "mesh-rose",
      href: "/ndjekjet",
      to: t.nav.followups,
    },
  ];

  return (
    <>
      <PageHeader title={t.dashboard.title}>
        <p className="mt-1 text-sm text-ink-3">
          {state.clinic.name} · {awaitingBooking > 0
            ? `${awaitingBooking} ${t.dashboard.awaitingBooking.toLowerCase()}`
            : state.clinic.address}
        </p>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat, i) => {
          const live = stat.value > 0;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={stat.href}
                className={cx(
                  "mesh group flex h-36 flex-col justify-between rounded-panel p-4 sm:h-40 sm:p-5",
                  "shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-raised)]",
                  live ? stat.mesh : "mesh-quiet",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={cx(
                      "text-[12px] font-medium leading-snug sm:text-[13px]",
                      live ? "text-white/85" : "text-ink-2",
                    )}
                  >
                    {stat.label}
                  </p>
                  <span
                    className={cx(
                      "grid size-7 shrink-0 place-items-center rounded-full",
                      live ? "bg-white/25 text-white" : "bg-surface text-ink-3",
                    )}
                  >
                    <stat.Icon size={14} weight="bold" />
                  </span>
                </div>

                <div>
                  <p
                    className={cx(
                      "dots text-[52px] leading-[0.8] sm:text-[68px]",
                      live ? "[--dot:#ffffff]" : "[--dot:var(--ink-3)]",
                    )}
                  >
                    {stat.value}
                  </p>
                  <span
                    className={cx(
                      "mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium sm:mt-3.5 sm:text-[12px]",
                      live ? "text-white/80" : "text-ink-3",
                    )}
                  >
                    {stat.to}
                    <ArrowRight
                      size={12}
                      weight="bold"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <FadeIn delay={0.05} className="min-w-0">
          <Card>
            <CardHeader
              title={t.dashboard.agenda}
              action={
                <Link
                  href="/orari"
                  className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  {t.schedule.title}
                  <ArrowRight size={13} weight="bold" />
                </Link>
              }
            />
            {todays.length === 0 ? (
              <EmptyState
                icon={<CalendarBlank size={26} />}
                title={t.dashboard.noAppointments}
              />
            ) : (
              <ul className="flex flex-col gap-0.5 px-2 pb-3">
                {todays.map((appointment) => {
                  const patient = s.patientById(appointment.patientId);
                  const provider = s.providerById(appointment.providerId);
                  return (
                    <li key={appointment.id}>
                      <button
                        onClick={() => setOpenAppointment(appointment)}
                        className="flex w-full items-center gap-3 rounded-card px-3 py-3 text-left transition-colors hover:bg-surface-2"
                      >
                        <span className="nums w-12 shrink-0 text-[13px] font-medium text-ink-2">
                          {formatTime(appointment.start)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {patient?.firstName} {patient?.lastName}
                          </span>
                          <span className="block truncate text-xs text-ink-3">
                            {s.treatmentNames(appointment.treatmentIds).join(", ")} ·{" "}
                            {provider?.name}
                          </span>
                        </span>
                        <span className="hidden shrink-0 sm:block">
                          <StatusBadge status={appointment.status} />
                        </span>
                        <span className="shrink-0">
                          <ConfirmationBadge confirmation={appointment.confirmation} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.1} className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardHeader
              title={t.dashboard.needsAttention}
              hint={
                unconfirmed.length + dueFollowUps.length > 0
                  ? t.dashboard.remindersToSend
                  : undefined
              }
            />
            {unconfirmed.length === 0 && dueFollowUps.length === 0 ? (
              <EmptyState icon={<CheckCircle size={26} />} title={t.dashboard.noAttention} />
            ) : (
              <ul className="flex flex-col gap-0.5 px-2 pb-3">
                {unconfirmed.slice(0, 4).map((appointment) => {
                  const patient = s.patientById(appointment.patientId);
                  return (
                    <li
                      key={appointment.id}
                      className="flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="truncate text-xs text-ink-3">
                          {t.dashboard.unconfirmed} ·{" "}
                          <span className="nums">{formatTime(appointment.start)}</span>
                        </p>
                      </div>
                      {patient?.contactConsent ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            composer.open({
                              patientId: appointment.patientId,
                              template: reminderTemplateFor(appointment, now),
                              appointmentId: appointment.id,
                            })
                          }
                        >
                          <WhatsappLogo size={15} weight="fill" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                      ) : (
                        <Pill tone="neutral">{t.patients.noConsent}</Pill>
                      )}
                    </li>
                  );
                })}

                {dueFollowUps.slice(0, 4).map((followUp) => {
                  const patient = s.patientById(followUp.patientId);
                  const days = daysUntilDue(followUp, now);
                  return (
                    <li
                      key={followUp.id}
                      className="flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="truncate text-xs text-ink-3">
                          {s.stepLabel(followUp.protocolId, followUp.stepId)} ·{" "}
                          {days < 0 ? t.followups.overdueBy(Math.abs(days)) : t.followups.dueToday}
                        </p>
                      </div>
                      {followUp.status === "confirmed" ? (
                        <FollowUpBadge status={followUp.status} />
                      ) : patient?.contactConsent ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            composer.open({
                              patientId: followUp.patientId,
                              template: "followup",
                              followUpId: followUp.id,
                            })
                          }
                        >
                          <WhatsappLogo size={15} weight="fill" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                      ) : (
                        <Pill tone="neutral">{t.patients.noConsent}</Pill>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {unconfirmed.length + dueFollowUps.length > 8 ? (
              <div className="px-5 pb-4 pt-1">
                <Link
                  href="/ndjekjet"
                  className="text-[13px] font-medium text-accent hover:underline"
                >
                  {t.dashboard.sendAll}
                </Link>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title={t.dashboard.recentVisits} />
            {recentVisits.length === 0 ? (
              <EmptyState title={t.patients.emptyTimeline} />
            ) : (
              <ul className="flex flex-col gap-0.5 px-2 pb-3">
                {recentVisits.map((visit) => {
                  const patient = s.patientById(visit.patientId);
                  return (
                    <li key={visit.id}>
                      <Link
                        href={`/pacientet/${visit.patientId}`}
                        className="block rounded-card px-3 py-2.5 transition-colors hover:bg-surface-2"
                      >
                        <p className="truncate text-sm font-medium">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="truncate text-xs text-ink-3">
                          {s.treatmentNames(visit.treatmentIds).join(", ")}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </FadeIn>
      </div>

      <AppointmentSheet
        appointment={openAppointment}
        onClose={() => setOpenAppointment(null)}
        onCompose={(target) => {
          setOpenAppointment(null);
          composer.open(target);
        }}
      />
      <WhatsAppComposer draft={composer.draft} onClose={composer.close} />
    </>
  );
}
