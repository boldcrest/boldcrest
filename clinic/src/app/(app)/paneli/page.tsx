"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarBlank,
  CheckCircle,
  Repeat,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Button, Card, CardHeader, EmptyState, Pill, cx } from "@/components/ui";
import { ArcGauge, Bloom, Callout, Metric, Ruler, Sparkbars, type BloomPalette } from "@/components/viz";
import { FadeIn, PageHeader } from "@/components/shell";
import { ConfirmationBadge, FollowUpBadge, StatusBadge } from "@/components/status";
import { AppointmentSheet } from "@/components/appointment-sheet";
import { WhatsAppComposer, useWhatsAppComposer } from "@/components/whatsapp-composer";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { formatTime } from "@/lib/i18n";
import { reminderTemplateFor } from "@/lib/whatsapp";
import { daysUntilDue, isDue, isOverdue, followUpPriority } from "@/lib/protocols";
import type { Appointment } from "@/lib/demo/types";

/* The clinic's working window. The day strip is drawn across it, so an empty
   evening reads as an empty evening rather than as missing data. */
const HOUR_FROM = 8;
const HOUR_TO = 19;
/* Half-hour resolution: at one bar an hour the strip reads as a bar chart,
   which is the wrong instrument. At two it reads as a measurement. */
const SLOTS = (HOUR_TO - HOUR_FROM + 1) * 2;
const SLOT_MINUTES = 30;

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

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

  /* ---- readings taken off the day itself, never invented ---------------- */

  const confirmedToday = todays.filter((a) => a.confirmation === "confirmed").length;
  const completedToday = todays.filter((a) => a.status === "completed").length;
  const unconfirmedToday = todays.length - confirmedToday;

  const slotOf = (d: Date) =>
    Math.floor(((d.getHours() - HOUR_FROM) * 60 + d.getMinutes()) / SLOT_MINUTES);

  const loadBySlot = useMemo(
    () =>
      Array.from({ length: SLOTS }, (_, i) =>
        todays.filter((a) => slotOf(new Date(a.start)) === i).length,
      ),
    [todays],
  );

  const activeSlot = slotOf(now);
  const dayProgress = clamp01(
    (now.getHours() + now.getMinutes() / 60 - HOUR_FROM) / (HOUR_TO + 1 - HOUR_FROM),
  );

  const confirmRate = todays.length > 0 ? confirmedToday / todays.length : 0;
  const gaugePalette: BloomPalette =
    todays.length === 0 ? "quiet" : confirmRate >= 0.8 ? "green" : confirmRate >= 0.5 ? "amber" : "rose";

  /* Colour is a signal, not decoration: a tile stays paper until it has
     something in it, so anything glowing on this page is asking for you. */
  const tiles = [
    {
      label: t.dashboard.followupsDue,
      value: dueFollowUps.length,
      Icon: Repeat,
      palette: "violet" as BloomPalette,
      href: "/ndjekjet",
      focal: [30, 72] as [number, number],
    },
    {
      label: t.dashboard.overdue,
      value: overdueCount,
      Icon: WarningCircle,
      palette: "rose" as BloomPalette,
      href: "/ndjekjet",
      focal: [74, 66] as [number, number],
    },
  ];

  return (
    <>
      <PageHeader title={t.dashboard.title}>
        <p className="mt-2 text-[13.5px] text-ink-3">
          {state.clinic.name} ·{" "}
          {awaitingBooking > 0
            ? `${awaitingBooking} ${t.dashboard.awaitingBooking.toLowerCase()}`
            : state.clinic.address}
        </p>
      </PageHeader>

      {/* ---------------------------------------------------------- row one */}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* The day itself: one large reading, its parts, and its shape. */}
        <FadeIn className="min-w-0 lg:col-span-7">
          <Card className="flex h-full min-w-0 flex-col p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-ink-3">{t.dashboard.dayLoad}</p>
                <h2 className="mt-2 text-[15px] font-semibold tracking-[-0.015em] text-ink">
                  {t.dashboard.todayAppointments}
                </h2>
              </div>
              <Link
                href="/orari"
                className="group inline-flex items-center gap-1.5 rounded-full bg-surface-2 py-1.5 pl-3.5 pr-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
              >
                {t.schedule.title}
                <span className="grid size-6 place-items-center rounded-full bg-surface text-ink transition-transform duration-200 ease-[var(--ease)] group-hover:translate-x-0.5">
                  <ArrowUpRight size={12} weight="bold" />
                </span>
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-5">
              <Metric
                value={todays.length}
                className="text-[92px] leading-[0.92] tracking-[-0.045em] sm:text-[116px]"
              />
              <div className="grid max-w-[340px] flex-1 grid-cols-3 gap-x-5">
                <Callout
                  label={t.dashboard.confirmRate}
                  value={confirmedToday}
                  swatch="bg-ok"
                />
                <Callout
                  label={t.dashboard.unconfirmed}
                  value={unconfirmedToday}
                  swatch="bg-warn"
                />
                <Callout
                  label={t.dashboard.completed}
                  value={completedToday}
                  swatch="bg-ink-4"
                />
              </div>
            </div>

            {/* The shape of the day: one bar an hour, the lit bar is now. */}
            <div className="mt-auto pt-7">
              <Sparkbars
                values={loadBySlot}
                active={activeSlot >= 0 && activeSlot < SLOTS ? activeSlot : undefined}
                labels={Array.from({ length: SLOTS }, (_, i) => {
                  const m = HOUR_FROM * 60 + i * SLOT_MINUTES;
                  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
                })}
                className="h-28"
                barClass="bg-ink/12"
                activeClass="bg-ink"
              />
              <Ruler
                marker={dayProgress}
                className="mt-3 h-3.5 text-ink-4"
                markerClass="bg-ink"
              />
              {/* Ends only. A centred "now" would be a label pointing at the
                  wrong place for most of the day. */}
              <div className="mt-2.5 flex justify-between text-[10.5px] text-ink-3">
                <span className="nums">{String(HOUR_FROM).padStart(2, "0")}:00</span>
                <span className="nums">{String(HOUR_TO).padStart(2, "0")}:00</span>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* The gauge and the two counters that can interrupt a day. */}
        <div className="grid min-w-0 gap-4 lg:col-span-5 lg:grid-rows-[1fr_auto]">
          <FadeIn delay={0.06} className="min-w-0">
            <Bloom
              palette={gaugePalette}
              focal={[50, 46]}
              className="flex h-full min-w-0 flex-col justify-between rounded-tile p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow text-bloom-ink/60">{t.dashboard.confirmRate}</p>
                <span className="grid size-7 place-items-center rounded-full bg-white/50 text-bloom-ink dark:bg-white/10">
                  <CheckCircle size={13} weight="bold" />
                </span>
              </div>

              <ArcGauge
                value={confirmedToday}
                max={Math.max(todays.length, 1)}
                label={t.dashboard.confirmRate}
                className="mx-auto my-3 size-[148px] text-bloom-ink"
                trackClass="text-bloom-ink/15"
                arcClass="text-bloom-ink"
              >
                <span className="flex items-baseline justify-center gap-0.5 text-bloom-ink">
                  <Metric
                    value={Math.round(confirmRate * 100)}
                    className="text-[46px] leading-none tracking-[-0.04em]"
                  />
                  <span className="text-[17px] font-medium text-bloom-ink/55">%</span>
                </span>
              </ArcGauge>

              <p className="text-[12px] text-bloom-ink/70">
                <span className="font-semibold text-bloom-ink">
                  {confirmedToday}/{todays.length}
                </span>{" "}
                {t.dashboard.confirmRateHint}
              </p>
            </Bloom>
          </FadeIn>

          <div className="grid min-w-0 grid-cols-2 gap-4">
            {tiles.map((tile, i) => {
              const live = tile.value > 0;
              return (
                <FadeIn key={tile.label} delay={0.1 + i * 0.05} className="min-w-0">
                  <Link href={tile.href} className="group block min-w-0">
                    <Bloom
                      palette={live ? tile.palette : "quiet"}
                      focal={tile.focal}
                      className={cx(
                        "flex h-[168px] min-w-0 flex-col justify-between rounded-tile p-5",
                        "shadow-[var(--shadow-card)] transition-shadow duration-300 ease-[var(--ease)]",
                        "group-hover:shadow-[var(--shadow-raised)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-medium leading-snug text-bloom-ink/70">
                          {tile.label}
                        </p>
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/50 text-bloom-ink dark:bg-white/10">
                          <tile.Icon size={12} weight="bold" />
                        </span>
                      </div>
                      <div>
                        <Metric
                          value={tile.value}
                          className="text-[58px] leading-[0.78] tracking-[-0.04em]"
                          tone="var(--b-ink, var(--ink))"
                        />
                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-bloom-ink/70">
                          {t.nav.followups}
                          <ArrowRight
                            size={11}
                            weight="bold"
                            className="transition-transform duration-200 ease-[var(--ease)] group-hover:translate-x-0.5"
                          />
                        </span>
                      </div>
                    </Bloom>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- row two */}

      <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-start">
        <FadeIn delay={0.14} className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <Card>
            <CardHeader
              title={t.dashboard.agenda}
              action={
                <Link
                  href="/orari"
                  className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
                >
                  {t.schedule.title}
                  <ArrowRight size={12} weight="bold" />
                </Link>
              }
            />
            {todays.length === 0 ? (
              <EmptyState
                icon={<CalendarBlank size={26} />}
                title={t.dashboard.noAppointments}
              />
            ) : (
              <ul className="flex flex-col gap-0.5 px-3 pb-4">
                {todays.map((appointment) => {
                  const patient = s.patientById(appointment.patientId);
                  const provider = s.providerById(appointment.providerId);
                  return (
                    <li key={appointment.id}>
                      <button
                        onClick={() => setOpenAppointment(appointment)}
                        className="flex w-full items-center gap-3.5 rounded-card px-3 py-3 text-left transition-colors duration-200 hover:bg-surface-2"
                      >
                        <span className="nums w-11 shrink-0 text-[12.5px] font-medium text-ink-2">
                          {formatTime(appointment.start)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-ink">
                            {patient?.firstName} {patient?.lastName}
                          </span>
                          <span className="block truncate text-[12px] text-ink-3">
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

          <Card>
            <CardHeader title={t.dashboard.recentVisits} />
            {recentVisits.length === 0 ? (
              <EmptyState title={t.patients.emptyTimeline} />
            ) : (
              <ul className="flex flex-col gap-0.5 px-3 pb-4">
                {recentVisits.map((visit) => {
                  const patient = s.patientById(visit.patientId);
                  return (
                    <li key={visit.id}>
                      <Link
                        href={`/pacientet/${visit.patientId}`}
                        className="block rounded-card px-3 py-2.5 transition-colors duration-200 hover:bg-surface-2"
                      >
                        <p className="truncate text-[13.5px] font-medium">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="truncate text-[12px] text-ink-3">
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

        <FadeIn delay={0.18} className="flex min-w-0 flex-col gap-4 lg:col-span-5">
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
              <ul className="flex flex-col gap-0.5 px-3 pb-4">
                {unconfirmed.slice(0, 4).map((appointment) => {
                  const patient = s.patientById(appointment.patientId);
                  return (
                    <li
                      key={appointment.id}
                      className="flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors duration-200 hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="truncate text-[12px] text-ink-3">
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
                          <WhatsappLogo size={14} weight="fill" />
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
                      className="flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors duration-200 hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        <p className="truncate text-[12px] text-ink-3">
                          {s.stepLabel(followUp.protocolId, followUp.stepId)} ·{" "}
                          {days < 0
                            ? t.followups.overdueBy(Math.abs(days))
                            : t.followups.dueToday}
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
                          <WhatsappLogo size={14} weight="fill" />
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
              <div className="px-6 pb-5 pt-1">
                <Link
                  href="/ndjekjet"
                  className="text-[13px] font-medium text-ink underline underline-offset-4 hover:text-ink-2"
                >
                  {t.dashboard.sendAll}
                </Link>
              </div>
            ) : null}
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
