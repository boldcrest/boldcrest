"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Warning } from "@phosphor-icons/react";
import { addMinutes, format, parse } from "date-fns";
import { Button, Field, Input, Modal, Select, Textarea, useToast } from "@clinic/ui";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { formatTime } from "@clinic/i18n";

export interface BookingPrefill {
  patientId?: string;
  treatmentIds?: string[];
  followUpId?: string;
  /** set when the booking answers a clinician's recommendation */
  recommendationId?: string;
  providerId?: string;
  start?: Date;
}

/** Mounted only while open, so the form starts from the prefill every time
 *  without an effect resetting it. */
export function BookAppointmentModal({
  open,
  onClose,
  prefill,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: BookingPrefill;
  onBooked?: (appointmentId: string) => void;
}) {
  if (!open) return null;
  return <BookingDialog onClose={onClose} prefill={prefill} onBooked={onBooked} />;
}

function BookingDialog({
  onClose,
  prefill,
  onBooked,
}: {
  onClose: () => void;
  prefill?: BookingPrefill;
  onBooked?: (appointmentId: string) => void;
}) {
  const { t, state, now, actions } = useDemo();
  const s = useSelectors();
  const toast = useToast();

  const [patientId, setPatientId] = useState(prefill?.patientId ?? "");
  const [treatmentId, setTreatmentId] = useState(prefill?.treatmentIds?.[0] ?? "");
  const [rawProviderId, setProviderId] = useState(prefill?.providerId ?? "");
  const [date, setDate] = useState(format(prefill?.start ?? now, "yyyy-MM-dd"));
  const [time, setTime] = useState(prefill?.start ? format(prefill.start, "HH:mm") : "10:00");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  const treatment = state.treatments.find((tr) => tr.id === treatmentId);

  // Only clinicians who actually perform this kind of treatment.
  const eligibleProviders = useMemo(
    () =>
      treatment
        ? state.providers.filter((p) => p.verticals.includes(treatment.vertical))
        : state.providers,
    [state.providers, treatment],
  );

  // Derived rather than reset in an effect: switching treatment simply drops a
  // clinician who no longer qualifies.
  const providerId = eligibleProviders.some((p) => p.id === rawProviderId) ? rawProviderId : "";

  const start = useMemo(() => {
    if (!date || !time) return null;
    const parsed = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [date, time]);

  const end = start && treatment ? addMinutes(start, treatment.minutes) : null;

  const conflict = useMemo(() => {
    if (!start || !end || !providerId) return null;
    return (
      state.appointments.find(
        (a) =>
          a.providerId === providerId &&
          a.status !== "cancelled" &&
          new Date(a.start) < end &&
          new Date(a.end) > start,
      ) ?? null
    );
  }, [state.appointments, providerId, start, end]);

  const outsideHours = useMemo(() => {
    if (!start || !providerId) return false;
    const provider = s.providerById(providerId);
    if (!provider) return false;
    const weekday = start.getDay() === 0 ? 7 : start.getDay();
    const block = provider.hours.find((h) => h.weekday === weekday);
    if (!block) return true;
    const minutes = start.getHours() * 60 + start.getMinutes();
    const [sh, sm] = block.start.split(":").map(Number);
    const [eh, em] = block.end.split(":").map(Number);
    return minutes < sh * 60 + sm || minutes >= eh * 60 + em;
  }, [start, providerId, s]);

  function submit() {
    setTouched(true);
    if (!patientId || !providerId || !treatmentId || !start || conflict) return;
    const appointment = actions.bookAppointment({
      patientId,
      providerId,
      treatmentIds: [treatmentId],
      start,
      note: note.trim() || undefined,
      followUpId: prefill?.followUpId,
      recommendationId: prefill?.recommendationId,
    });
    toast.push(prefill?.followUpId ? t.toast.followupBooked : t.toast.appointmentCreated);
    onBooked?.(appointment.id);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.schedule.newAppointment}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={submit} disabled={Boolean(conflict)}>
            <CalendarPlus size={15} weight="bold" />
            {t.actions.save}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label={t.form.patient}
            error={touched && !patientId ? t.form.required : undefined}
          >
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">{t.form.selectPatient}</option>
              {[...state.patients]
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
            </Select>
          </Field>
        </div>

        <Field
          label={t.form.treatment}
          error={touched && !treatmentId ? t.form.required : undefined}
        >
          <Select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
            <option value="">{t.form.selectTreatment}</option>
            {state.treatments.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name[state.lang]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={t.form.provider}
          error={touched && !providerId ? t.form.required : undefined}
        >
          <Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            <option value="">{t.form.selectProvider}</option>
            {eligibleProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t.form.date}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field
          label={t.form.time}
          hint={
            treatment && end && start
              ? `${formatTime(start)} - ${formatTime(end)} · ${t.settings.minutes(treatment.minutes)}`
              : undefined
          }
        >
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>

        <div className="sm:col-span-2">
          <Field label={t.form.note}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </Field>
        </div>

        {conflict ? (
          <p className="flex items-center gap-2 rounded-card bg-danger-soft px-3 py-2 text-[13px] text-danger sm:col-span-2">
            <Warning size={15} weight="bold" />
            {t.schedule.conflict}: {s.patientName(conflict.patientId)},{" "}
            <span className="nums">{formatTime(conflict.start)}</span>
          </p>
        ) : outsideHours ? (
          <p className="flex items-center gap-2 rounded-card bg-warn-soft px-3 py-2 text-[13px] text-warn sm:col-span-2">
            <Warning size={15} weight="bold" />
            {t.schedule.outsideHours}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
