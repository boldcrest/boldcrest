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
import { Button, Card, CardHeader, EmptyState, IconButton, Pill, useToast } from "@/components/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { FollowUpBadge } from "@/components/status";
import { WhatsAppComposer, useWhatsAppComposer } from "@/components/whatsapp-composer";
import { BookAppointmentModal, type BookingPrefill } from "@/components/book-appointment";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { formatDate } from "@/lib/i18n";
import { daysUntilDue, followUpPriority, isOpen } from "@/lib/protocols";
import type { FollowUp } from "@/lib/demo/types";

export default function FollowUpsPage() {
  const { t, state, now, actions } = useDemo();
  const s = useSelectors();
  const toast = useToast();
  const composer = useWhatsAppComposer();
  const [booking, setBooking] = useState<BookingPrefill | null>(null);

  const { due, upcoming, closed } = useMemo(() => {
    const open = state.followUps.filter(isOpen);
    return {
      due: open
        .filter((f) => daysUntilDue(f, now) <= 0)
        .sort((a, b) => followUpPriority(a, now) - followUpPriority(b, now)),
      upcoming: open
        .filter((f) => daysUntilDue(f, now) > 0)
        .sort((a, b) => daysUntilDue(a, now) - daysUntilDue(b, now)),
      closed: state.followUps
        .filter((f) => !isOpen(f))
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    };
  }, [state.followUps, now]);

  function Row({ followUp }: { followUp: FollowUp }) {
    const patient = s.patientById(followUp.patientId);
    const visit = s.visitById(followUp.visitId);
    const days = daysUntilDue(followUp, now);
    const overdue = days < 0;

    return (
      <li className="mx-2 flex flex-wrap items-center gap-3 rounded-card px-3 py-3 transition-colors hover:bg-surface-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/pacientet/${followUp.patientId}`}
              className="truncate text-sm font-medium text-ink hover:text-accent"
            >
              {patient?.firstName} {patient?.lastName}
            </Link>
            <FollowUpBadge status={followUp.status} />
            {patient?.isTraveller ? <Pill tone="accent">{t.patients.traveller}</Pill> : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-2">
            {s.stepLabel(followUp.protocolId, followUp.stepId)}
            {visit ? ` · ${t.followups.fromVisit} ${formatDate(visit.date, state.lang)}` : ""}
          </p>
          <p className="nums mt-0.5 text-xs text-ink-3">
            {t.followups.dueOn}: {formatDate(followUp.dueDate, state.lang)}
            {" · "}
            <span className={overdue ? "font-medium text-danger" : undefined}>
              {overdue
                ? t.followups.overdueBy(Math.abs(days))
                : days === 0
                  ? t.followups.dueToday
                  : t.followups.inDays(days)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {followUp.status === "confirmed" ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                setBooking({
                  patientId: followUp.patientId,
                  followUpId: followUp.id,
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
                  patientId: followUp.patientId,
                  template: "followup",
                  followUpId: followUp.id,
                })
              }
            >
              <WhatsappLogo size={14} weight="fill" />
              {followUp.status === "sent" ? t.followups.resend : t.followups.sendRequest}
            </Button>
          ) : (
            <Pill tone="neutral">{t.patients.noConsent}</Pill>
          )}

          <IconButton
            tone="ghost"
            onClick={() => {
              actions.snoozeFollowUp(followUp.id);
              toast.push(t.toast.snoozed);
            }}
            title={t.followups.snooze}
            aria-label={t.followups.snooze}
          >
            <HourglassMedium size={15} weight="bold" />
          </IconButton>
          <IconButton
            tone="ghost"
            onClick={() => actions.patchFollowUp(followUp.id, { status: "done" })}
            title={t.followups.markDone}
            aria-label={t.followups.markDone}
          >
            <CheckCircle size={15} weight="bold" />
          </IconButton>
        </div>
      </li>
    );
  }

  return (
    <>
      <PageHeader title={t.followups.title}>
        <p className="mt-1 text-sm text-ink-3">
          {due.length > 0
            ? `${due.length} ${t.followups.due.toLowerCase()}`
            : t.followups.none}
        </p>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <FadeIn>
          <Card>
            <CardHeader title={t.followups.due} />
            {due.length === 0 ? (
              <EmptyState icon={<Repeat size={24} />} title={t.followups.none} />
            ) : (
              <ul className="flex flex-col gap-0.5 pb-3">
                {due.map((followUp) => (
                  <Row key={followUp.id} followUp={followUp} />
                ))}
              </ul>
            )}
          </Card>
        </FadeIn>

        {upcoming.length > 0 ? (
          <FadeIn delay={0.05}>
            <Card>
              <CardHeader title={t.followups.upcoming} />
              <ul className="flex flex-col gap-0.5 pb-3">
                {upcoming.map((followUp) => (
                  <Row key={followUp.id} followUp={followUp} />
                ))}
              </ul>
            </Card>
          </FadeIn>
        ) : null}

        {closed.length > 0 ? (
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader title={t.followups.handled} />
              <ul className="flex flex-col gap-0.5 pb-3">
                {closed.slice(0, 6).map((followUp) => (
                  <Row key={followUp.id} followUp={followUp} />
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
