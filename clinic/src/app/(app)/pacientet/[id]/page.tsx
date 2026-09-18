"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  ChatCircleText,
  ClipboardText,
  Repeat,
  Stethoscope,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Button, Card, CardHeader, EmptyState, Pill, Textarea, useToast, Select, Field } from "@/components/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { FollowUpBadge, StatusBadge } from "@/components/status";
import { BookAppointmentModal } from "@/components/book-appointment";
import { WhatsAppComposer, useWhatsAppComposer } from "@/components/whatsapp-composer";
import { Modal } from "@/components/ui";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { formatDate, formatTime } from "@/lib/i18n";
import { isOpen } from "@/lib/protocols";
import { reminderTemplateFor } from "@/lib/whatsapp";

type TimelineItem = {
  id: string;
  at: string;
  kind: "visit" | "appointment" | "message" | "followup";
  title: string;
  body?: string;
  badge?: React.ReactNode;
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, state, now } = useDemo();
  const s = useSelectors();

  const [booking, setBooking] = useState(false);
  const composer = useWhatsAppComposer();
  const [loggingVisit, setLoggingVisit] = useState(false);

  const patient = s.patientById(params.id);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!patient) return [];
    const items: TimelineItem[] = [];

    for (const visit of state.visits.filter((v) => v.patientId === patient.id)) {
      items.push({
        id: visit.id,
        at: visit.date,
        kind: "visit",
        title: s.treatmentNames(visit.treatmentIds).join(", "),
        body: visit.note,
      });
    }

    for (const appointment of state.appointments.filter((a) => a.patientId === patient.id)) {
      items.push({
        id: appointment.id,
        at: appointment.start,
        kind: "appointment",
        title: s.treatmentNames(appointment.treatmentIds).join(", "),
        body: `${formatTime(appointment.start)} · ${s.providerById(appointment.providerId)?.name ?? ""}`,
        badge: <StatusBadge status={appointment.status} />,
      });
    }

    for (const message of state.messages.filter((m) => m.patientId === patient.id && m.sentAt)) {
      items.push({
        id: message.id,
        at: message.sentAt!,
        kind: "message",
        title: state.templates.find((tpl) => tpl.key === message.template)?.name[state.lang] ?? "",
        body: message.body,
      });
    }

    for (const followUp of state.followUps.filter((f) => f.patientId === patient.id)) {
      items.push({
        id: followUp.id,
        at: `${followUp.dueDate}T08:00:00.000Z`,
        kind: "followup",
        title: s.stepLabel(followUp.protocolId, followUp.stepId),
        body: s.protocolById(followUp.protocolId)?.name[state.lang],
        badge: <FollowUpBadge status={followUp.status} />,
      });
    }

    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [patient, state, s]);

  if (!patient) {
    return (
      <EmptyState
        title={t.patients.none}
        action={
          <Link href="/pacientet">
            <Button>
              <ArrowLeft size={15} weight="bold" />
              {t.actions.back}
            </Button>
          </Link>
        }
      />
    );
  }

  const openFollowUps = state.followUps.filter(
    (f) => f.patientId === patient.id && isOpen(f),
  );

  const nextAppointment = state.appointments
    .filter(
      (a) => a.patientId === patient.id && new Date(a.start) >= now && a.status === "scheduled",
    )
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  return (
    <>
      <Link
        href="/pacientet"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} weight="bold" />
        {t.patients.title}
      </Link>

      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        action={
          <div className="flex flex-wrap gap-2">
            {patient.contactConsent && nextAppointment ? (
              <Button
                onClick={() =>
                  composer.open({
                    patientId: patient.id,
                    template: reminderTemplateFor(nextAppointment, now),
                    appointmentId: nextAppointment.id,
                  })
                }
              >
                <WhatsappLogo size={16} weight="fill" />
                WhatsApp
              </Button>
            ) : null}
            <Button onClick={() => setLoggingVisit(true)}>
              <ClipboardText size={15} weight="bold" />
              {t.patients.logVisit}
            </Button>
            <Button variant="primary" onClick={() => setBooking(true)}>
              <CalendarPlus size={15} weight="bold" />
              {t.patients.book}
            </Button>
          </div>
        }
      >
        <p className="nums mt-1 text-sm text-ink-3">
          {patient.phone} · {patient.city} ·{" "}
          {t.patients.age(new Date(state.now).getFullYear() - patient.birthYear)}
        </p>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <FadeIn className="flex flex-col gap-5">
          <Card>
            <CardHeader title={t.patients.details} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3.5 text-sm">
              <div>
                <dt className="text-xs text-ink-3">{t.form.language}</dt>
                <dd className="text-ink uppercase">{patient.lang}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">{t.form.birthYear}</dt>
                <dd className="nums text-ink">{patient.birthYear}</dd>
              </div>
              <div className="col-span-2 flex flex-wrap gap-2">
                {patient.isTraveller ? <Pill tone="accent">{t.patients.traveller}</Pill> : null}
                <Pill tone={patient.contactConsent ? "ok" : "danger"}>
                  {patient.contactConsent ? t.form.consent : t.patients.noConsent}
                </Pill>
              </div>
              {patient.note ? (
                <div className="col-span-2">
                  <dt className="text-xs text-ink-3">{t.form.note}</dt>
                  <dd className="text-ink-2">{patient.note}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card>
            <CardHeader title={t.followups.title} />
            {openFollowUps.length === 0 ? (
              <EmptyState icon={<Repeat size={22} />} title={t.followups.none} />
            ) : (
              <ul className="divide-y divide-line">
                {openFollowUps.map((followUp) => (
                  <li key={followUp.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {s.stepLabel(followUp.protocolId, followUp.stepId)}
                      </p>
                      <p className="nums truncate text-xs text-ink-3">
                        {t.followups.dueOn}: {formatDate(followUp.dueDate, state.lang)}
                      </p>
                    </div>
                    <FollowUpBadge status={followUp.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card>
            <CardHeader title={t.patients.timeline} />
            {timeline.length === 0 ? (
              <EmptyState title={t.patients.emptyTimeline} />
            ) : (
              <ol className="relative px-4 py-4">
                <span
                  className="absolute bottom-4 left-[30px] top-5 w-px bg-line"
                  aria-hidden="true"
                />
                {timeline.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="relative flex gap-3 pb-5 last:pb-0">
                    <span className="relative z-10 grid size-[26px] shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-3">
                      <TimelineIcon kind={item.kind} />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-[13px] font-medium text-ink">{item.title}</p>
                        {item.badge}
                      </div>
                      <p className="nums mt-0.5 text-[11px] text-ink-3">
                        {formatDate(item.at, state.lang)}
                      </p>
                      {item.body ? (
                        <p
                          className={
                            item.kind === "message"
                              ? "mt-1.5 rounded-card bg-surface-2 px-2.5 py-2 text-xs leading-relaxed text-ink-2"
                              : "mt-0.5 text-xs text-ink-2"
                          }
                        >
                          {item.body}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </FadeIn>
      </div>

      <BookAppointmentModal
        open={booking}
        onClose={() => setBooking(false)}
        prefill={{ patientId: patient.id, start: now }}
      />
      <WhatsAppComposer draft={composer.draft} onClose={composer.close} />
      <LogVisitModal
        open={loggingVisit}
        onClose={() => setLoggingVisit(false)}
        patientId={patient.id}
      />
    </>
  );
}

function TimelineIcon({ kind }: { kind: TimelineItem["kind"] }) {
  const size = 13;
  if (kind === "visit") return <Stethoscope size={size} weight="bold" />;
  if (kind === "message") return <ChatCircleText size={size} weight="bold" />;
  if (kind === "followup") return <Repeat size={size} weight="bold" />;
  return <CalendarPlus size={size} weight="bold" />;
}

function LogVisitModal({
  open,
  onClose,
  patientId,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string;
}) {
  const { t, state, actions } = useDemo();
  const toast = useToast();
  const [treatmentId, setTreatmentId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [note, setNote] = useState("");

  const treatment = state.treatments.find((tr) => tr.id === treatmentId);
  const eligible = treatment
    ? state.providers.filter((p) => p.verticals.includes(treatment.vertical))
    : state.providers;

  function submit() {
    if (!treatmentId || !providerId) return;
    const { followUps } = actions.logVisit({
      patientId,
      providerId,
      treatmentIds: [treatmentId],
      note: note.trim() || undefined,
    });
    toast.push(t.toast.visitLogged);
    if (followUps.length > 0) {
      window.setTimeout(() => toast.push(t.toast.followupsCreated(followUps.length)), 700);
    }
    setTreatmentId("");
    setProviderId("");
    setNote("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.patients.logVisit}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={submit} disabled={!treatmentId || !providerId}>
            {t.actions.save}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t.form.treatment}>
          <Select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
            <option value="">{t.form.selectTreatment}</option>
            {state.treatments.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name[state.lang]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.form.provider}>
          <Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            <option value="">{t.form.selectProvider}</option>
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.form.visitNote}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>
        {treatment?.protocolId ? (
          <p className="rounded-card bg-accent-soft px-3 py-2 text-xs text-accent">
            {t.settings.protocols}:{" "}
            {state.protocols.find((p) => p.id === treatment.protocolId)?.name[state.lang]}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
