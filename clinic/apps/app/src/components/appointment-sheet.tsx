"use client";

import { useState } from "react";
import {
  CalendarCheck,
  CheckCircle,
  ClipboardText,
  Prohibit,
  UserCheck,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Button, Modal, Pill, Textarea } from "@clinic/ui";
import { StatusBadge, ConfirmationBadge } from "./status";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { useToast } from "@clinic/ui";
import { formatDate, formatTime, formatMoney } from "@clinic/i18n";
import { reminderTemplateFor } from "@clinic/core";
import type { Appointment } from "@/lib/demo/types";
import type { ComposerTarget } from "./whatsapp-composer";

export function AppointmentSheet({
  appointment,
  onClose,
  onCompose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onCompose: (target: ComposerTarget) => void;
}) {
  const { t, state, actions } = useDemo();
  const s = useSelectors();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [loggingVisit, setLoggingVisit] = useState(false);

  if (!appointment) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;

  const patient = s.patientById(appointment.patientId);
  const provider = s.providerById(appointment.providerId);
  const treatments = appointment.treatmentIds
    .map((id) => s.treatmentById(id))
    .filter(Boolean);
  const total = treatments.reduce((sum, tr) => sum + (tr?.price ?? 0), 0);

  function logVisit() {
    if (!appointment) return;
    const { followUps } = actions.logVisit({
      patientId: appointment.patientId,
      providerId: appointment.providerId,
      treatmentIds: appointment.treatmentIds,
      note: note.trim() || undefined,
      appointmentId: appointment.id,
    });
    toast.push(t.toast.visitLogged);
    if (followUps.length > 0) {
      window.setTimeout(() => toast.push(t.toast.followupsCreated(followUps.length)), 700);
    }
    setNote("");
    setLoggingVisit(false);
    onClose();
  }

  return (
    <Modal
      open={Boolean(appointment)}
      onClose={onClose}
      title={patient ? `${patient.firstName} ${patient.lastName}` : ""}
      wide
      footer={
        loggingVisit ? (
          <>
            <Button variant="ghost" onClick={() => setLoggingVisit(false)}>
              {t.actions.cancel}
            </Button>
            <Button variant="primary" onClick={logVisit}>
              <ClipboardText size={15} weight="bold" />
              {t.patients.logVisit}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t.actions.close}
            </Button>
            {patient?.contactConsent ? (
              <Button
                variant="secondary"
                onClick={() =>
                  onCompose({
                    patientId: appointment.patientId,
                    template: reminderTemplateFor(appointment, new Date(state.now)),
                    appointmentId: appointment.id,
                  })
                }
              >
                <WhatsappLogo size={16} weight="fill" />
                {t.actions.sendReminder}
              </Button>
            ) : null}
            {appointment.status !== "completed" ? (
              <Button variant="primary" onClick={() => setLoggingVisit(true)}>
                <ClipboardText size={15} weight="bold" />
                {t.patients.logVisit}
              </Button>
            ) : null}
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={appointment.status} />
          <ConfirmationBadge confirmation={appointment.confirmation} />
          {patient?.isTraveller ? <Pill tone="accent">{t.patients.traveller}</Pill> : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-ink-3">{t.form.date}</dt>
            <dd className="text-ink">{formatDate(appointment.start, state.lang)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">{t.form.time}</dt>
            <dd className="nums text-ink">
              {formatTime(appointment.start)} - {formatTime(appointment.end)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">{t.form.provider}</dt>
            <dd className="text-ink">{provider?.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">{t.form.phone}</dt>
            <dd className="nums text-ink">{patient?.phone}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-ink-3">{t.form.treatment}</dt>
            <dd className="text-ink">
              {treatments.map((tr) => tr?.name[state.lang]).join(", ")}
              <span className="ml-2 text-ink-3">{formatMoney(total, state.lang)}</span>
            </dd>
          </div>
          {appointment.note ? (
            <div className="col-span-2">
              <dt className="text-xs text-ink-3">{t.form.note}</dt>
              <dd className="text-ink-2">{appointment.note}</dd>
            </div>
          ) : null}
        </dl>

        {loggingVisit ? (
          <div className="rounded-card bg-surface-2 p-3">
            <p className="mb-2 text-[13px] font-medium text-ink-2">{t.form.visitNote}</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                state.lang === "sq"
                  ? "Çfarë u krye gjatë vizitës?"
                  : "What happened during the visit?"
              }
            />
            <p className="mt-2 text-xs text-ink-3">
              {state.lang === "sq"
                ? "Ndjekjet krijohen automatikisht sipas protokollit të trajtimit."
                : "Follow-ups are created automatically from the treatment protocol."}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {appointment.status === "scheduled" ? (
              <Button
                size="sm"
                onClick={() => {
                  actions.patchAppointment(appointment.id, { status: "arrived" });
                  toast.push(t.toast.appointmentUpdated);
                }}
              >
                <UserCheck size={15} weight="bold" />
                {t.actions.markArrived}
              </Button>
            ) : null}
            {appointment.status !== "completed" && appointment.status !== "noshow" ? (
              <Button
                size="sm"
                onClick={() => {
                  actions.patchAppointment(appointment.id, { status: "noshow" });
                  toast.push(t.toast.appointmentUpdated);
                }}
              >
                <Prohibit size={15} weight="bold" />
                {t.actions.markNoshow}
              </Button>
            ) : null}
            {appointment.confirmation !== "confirmed" ? (
              <Button
                size="sm"
                onClick={() => {
                  actions.patchAppointment(appointment.id, { confirmation: "confirmed" });
                  toast.push(t.toast.appointmentUpdated);
                }}
              >
                <CheckCircle size={15} weight="bold" />
                {t.actions.confirm}
              </Button>
            ) : null}
            {appointment.status === "completed" ? (
              <Pill tone="ok" icon={<CalendarCheck size={12} weight="bold" />}>
                {t.status.completed}
              </Pill>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
