"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  CheckCircle,
  HourglassMedium,
  Repeat,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Button, Card, CardHeader, EmptyState, IconButton, Pill, useToast } from "@clinic/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { FollowUpBadge } from "@/components/status";
import { WhatsAppComposer, useWhatsAppComposer } from "@/components/whatsapp-composer";
import { BookAppointmentModal, type BookingPrefill } from "@/components/book-appointment";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { formatCadence, formatDate } from "@clinic/i18n";
import {
  daysUntilDue,
  followUpPriority,
  isOpen,
  openSeries,
  stepInterval,
  type FollowUp,
  type FollowUpSeries,
} from "@clinic/core";

/** Where a series lands in the work list, by how many days until its next step. */
type Bucket = "overdue" | "today" | "thisWeek" | "later";

function bucketOf(days: number): Bucket {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "thisWeek";
  return "later";
}

export default function FollowUpsPage() {
  const { t, state, now, actions } = useDemo();
  const s = useSelectors();
  const toast = useToast();
  const composer = useWhatsAppComposer();
  const [booking, setBooking] = useState<BookingPrefill | null>(null);

  // One row per series rather than per occurrence: a six-session course is one
  // thing to act on, and showing all six would bury every other patient.
  const { buckets, closed } = useMemo(() => {
    const empty: Record<Bucket, FollowUpSeries[]> = {
      overdue: [],
      today: [],
      thisWeek: [],
      later: [],
    };

    for (const series of openSeries(state.followUps)) {
      empty[bucketOf(daysUntilDue(series.head, now))].push(series);
    }
    for (const key of Object.keys(empty) as Bucket[]) {
      empty[key].sort(
        (a, b) => followUpPriority(a.head, now) - followUpPriority(b.head, now),
      );
    }

    return {
      buckets: empty,
      closed: state.followUps
        .filter((f) => !isOpen(f))
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    };
  }, [state.followUps, now]);

  const summary = [
    buckets.overdue.length > 0
      ? `${buckets.overdue.length} ${t.followups.overdue.toLowerCase()}`
      : null,
    buckets.today.length > 0 ? `${buckets.today.length} ${t.followups.today.toLowerCase()}` : null,
    buckets.thisWeek.length > 0
      ? `${buckets.thisWeek.length} ${t.followups.thisWeek.toLowerCase()}`
      : null,
  ].filter(Boolean);

  function Row({ series }: { series: FollowUpSeries }) {
    const { head, later, completed, length } = series;
    const patient = s.patientById(head.patientId);
    const visit = s.visitById(head.visitId);
    const step = s.stepById(head.protocolId, head.stepId);
    const every = step ? stepInterval(step) : 0;
    const days = daysUntilDue(head, now);
    const overdue = days < 0;
    const treatment = visit ? s.treatmentNames(visit.treatmentIds).join(", ") : "";

    return (
      <li className="mx-2 flex flex-wrap items-center gap-3 rounded-card px-3 py-3 transition-colors hover:bg-surface-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/pacientet/${head.patientId}`}
              className="truncate text-sm font-medium text-ink hover:text-accent"
            >
              {patient?.firstName} {patient?.lastName}
            </Link>
            <FollowUpBadge status={head.status} />
            {every > 0 ? (
              <Pill tone="accent" icon={<Repeat size={11} weight="bold" />}>
                {formatCadence(every, state.lang)}
              </Pill>
            ) : null}
            {patient?.isTraveller ? <Pill tone="neutral">{t.patients.traveller}</Pill> : null}
          </div>

          <p className="truncate text-xs text-ink-2">
            {s.stepLabel(head.protocolId, head.stepId)}
            {length > 1 ? ` · ${t.followups.session(head.occurrence, length)}` : ""}
          </p>

          <p className="nums mt-0.5 text-xs text-ink-3">
            {t.followups.dueOn}: {formatDate(head.dueDate, state.lang)}
            {" · "}
            <span className={overdue ? "font-medium text-danger" : undefined}>
              {overdue
                ? t.followups.overdueBy(Math.abs(days))
                : days === 0
                  ? t.followups.dueToday
                  : t.followups.inDays(days)}
            </span>
          </p>

          <p className="nums mt-0.5 text-[11px] text-ink-4">
            {treatment ? `${t.followups.fromService}: ${treatment}` : ""}
            {visit ? ` · ${formatDate(visit.date, state.lang)}` : ""}
            {length > 1 ? ` · ${t.followups.seriesProgress(completed, length)}` : ""}
            {later.length > 0 ? ` · ${t.followups.queued(later.length)}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {head.status === "confirmed" ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                setBooking({
                  patientId: head.patientId,
                  followUpId: head.id,
                  treatmentIds: visit?.treatmentIds,
                  start: now,
                })
              }
            >
              <CalendarPlus size={14} weight="bold" />
              {t.followups.book}
            </Button>
          ) : patient?.contactConsent ? (
            <Button
              size="sm"
              onClick={() =>
                composer.open({
                  patientId: head.patientId,
                  template: "followup",
                  followUpId: head.id,
                })
              }
            >
              <WhatsappLogo size={14} weight="fill" />
              {head.status === "sent" ? t.followups.resend : t.followups.sendRequest}
            </Button>
          ) : (
            <Pill tone="neutral">{t.patients.noConsent}</Pill>
          )}

          <IconButton
            tone="ghost"
            onClick={() => {
              actions.snoozeFollowUp(head.id);
              toast.push(t.toast.snoozed);
            }}
            title={t.followups.snooze}
            aria-label={t.followups.snooze}
          >
            <HourglassMedium size={15} weight="bold" />
          </IconButton>
          <IconButton
            tone="ghost"
            onClick={() => actions.patchFollowUp(head.id, { status: "done" })}
            title={t.followups.markDone}
            aria-label={t.followups.markDone}
          >
            <CheckCircle size={15} weight="bold" />
          </IconButton>
        </div>
      </li>
    );
  }

  function ClosedRow({ followUp }: { followUp: FollowUp }) {
    const patient = s.patientById(followUp.patientId);
    return (
      <li className="mx-2 flex flex-wrap items-center gap-3 rounded-card px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/pacientet/${followUp.patientId}`}
              className="truncate text-[13px] font-medium text-ink hover:text-accent"
            >
              {patient?.firstName} {patient?.lastName}
            </Link>
            <FollowUpBadge status={followUp.status} />
          </div>
          <p className="nums truncate text-xs text-ink-3">
            {s.stepLabel(followUp.protocolId, followUp.stepId)}
            {followUp.seriesLength > 1
              ? ` · ${t.followups.session(followUp.occurrence, followUp.seriesLength)}`
              : ""}
            {" · "}
            {formatDate(followUp.dueDate, state.lang)}
          </p>
        </div>
      </li>
    );
  }

  const sections: Array<{ bucket: Bucket; title: string; delay: number }> = [
    { bucket: "overdue", title: t.followups.overdue, delay: 0 },
    { bucket: "today", title: t.followups.today, delay: 0.05 },
    { bucket: "thisWeek", title: t.followups.thisWeek, delay: 0.1 },
    { bucket: "later", title: t.followups.later, delay: 0.15 },
  ];

  const nothingOpen = sections.every(({ bucket }) => buckets[bucket].length === 0);

  return (
    <>
      <PageHeader title={t.followups.title}>
        <p className="mt-1 text-sm text-ink-3">
          {summary.length > 0 ? summary.join(" · ") : t.followups.none}
        </p>
        <p className="mt-1 max-w-2xl text-xs text-ink-4">{t.followups.autoHint}</p>
      </PageHeader>

      <div className="flex flex-col gap-4">
        {nothingOpen ? (
          <FadeIn>
            <Card>
              <EmptyState icon={<Repeat size={24} />} title={t.followups.none} />
            </Card>
          </FadeIn>
        ) : null}

        {sections.map(({ bucket, title, delay }) =>
          buckets[bucket].length === 0 ? null : (
            <FadeIn key={bucket} delay={delay}>
              <Card>
                <CardHeader
                  title={title}
                  action={<Pill tone="neutral">{buckets[bucket].length}</Pill>}
                />
                <ul className="flex flex-col gap-0.5 pb-3">
                  {buckets[bucket].map((series) => (
                    <Row key={series.key} series={series} />
                  ))}
                </ul>
              </Card>
            </FadeIn>
          ),
        )}

        {closed.length > 0 ? (
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader title={t.followups.handled} />
              <ul className="flex flex-col gap-0.5 pb-3">
                {closed.slice(0, 8).map((followUp) => (
                  <ClosedRow key={followUp.id} followUp={followUp} />
                ))}
              </ul>
            </Card>
          </FadeIn>
        ) : null}
      </div>

      <WhatsAppComposer draft={composer.draft} onClose={composer.close} />
      <BookAppointmentModal
        open={Boolean(booking)}
        onClose={() => setBooking(null)}
        prefill={booking ?? undefined}
      />
    </>
  );
}
