"use client";

import { useState } from "react";
import {
  CalendarPlus,
  Check,
  Gift,
  Lightbulb,
  Plus,
  PushPin,
  Repeat,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { addDays, format } from "date-fns";
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Pill,
  Select,
  Textarea,
  useToast,
  type Tone,
} from "@clinic/ui";
import { formatCadence, formatDate, formatMoney } from "@clinic/i18n";
import {
  daysUntilDue,
  isBenefitExpired,
  isBenefitOpen,
  openSeries,
  sortBenefits,
  sortNotes,
  sortRecommendations,
  stepInterval,
  type Benefit,
  type Patient,
  type Recommendation,
} from "@clinic/core";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { BookAppointmentModal, type BookingPrefill } from "@/components/book-appointment";
import { FollowUpBadge } from "@/components/status";

/** The small "+" in a card header, so every panel adds records the same way. */
function AddAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick}>
      <Plus size={13} weight="bold" />
      {label}
    </Button>
  );
}

/* ------------------------------------------------------------- allergies */

/**
 * Allergies sit directly under the patient's name rather than inside a notes
 * list, because they change what a clinician is allowed to do next. Empty is
 * shown too: "nothing recorded" and "nobody asked" look the same otherwise.
 */
export function AllergyPanel({ patient }: { patient: Patient }) {
  const { t } = useDemo();
  const [editing, setEditing] = useState(false);
  const has = patient.allergies.length > 0;

  return (
    <>
      <Card className={has ? "ring-1 ring-danger/25" : undefined}>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              {has ? <Warning size={16} weight="fill" className="text-danger" /> : null}
              {t.patients.allergies}
            </span>
          }
          action={<AddAction label={t.patients.editAllergies} onClick={() => setEditing(true)} />}
        />
        <div className="px-6 pb-5">
          {has ? (
            <ul className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy) => (
                <li key={allergy}>
                  <Pill tone="danger">{allergy}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-3">{t.patients.noAllergies}</p>
          )}
        </div>
      </Card>
      {editing ? <AllergiesModal patient={patient} onClose={() => setEditing(false)} /> : null}
    </>
  );
}

function AllergiesModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { t, actions } = useDemo();
  const toast = useToast();
  const [text, setText] = useState(patient.allergies.join("\n"));

  function save() {
    actions.setAllergies(patient.id, text.split("\n"));
    toast.push(t.toast.allergiesSaved);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.patients.allergies}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={save}>
            {t.actions.save}
          </Button>
        </>
      }
    >
      <Field label={t.form.allergies} hint={t.form.allergiesHint}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} />
      </Field>
    </Modal>
  );
}

/* --------------------------------------------------------------- series */

/**
 * The patient's own view of the protocol: one row per course, not one per
 * occurrence, with the cadence spelled out so it is obvious that the clinic is
 * not remembering any of this by hand.
 */
export function FollowUpSeriesCard({ patient }: { patient: Patient }) {
  const { t, state, now } = useDemo();
  const s = useSelectors();
  const series = openSeries(s.followUpsForPatient(patient.id));

  return (
    <Card>
      <CardHeader title={t.followups.title} hint={t.followups.autoHint} />
      {series.length === 0 ? (
        <EmptyState icon={<Repeat size={22} />} title={t.followups.none} />
      ) : (
        <ul className="divide-y divide-line">
          {series.map(({ key, head, later, completed, length }) => {
            const step = s.stepById(head.protocolId, head.stepId);
            const every = step ? stepInterval(step) : 0;
            const days = daysUntilDue(head, now);

            return (
              <li key={key} className="px-6 py-3.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[13px] font-medium text-ink">
                    {s.stepLabel(head.protocolId, head.stepId)}
                  </p>
                  <FollowUpBadge status={head.status} />
                  <Pill tone="neutral">
                    {every > 0 ? formatCadence(every, state.lang) : t.followups.oneOff}
                  </Pill>
                </div>
                <p className="nums mt-1 text-xs text-ink-3">
                  {length > 1 ? `${t.followups.session(head.occurrence, length)} · ` : ""}
                  {t.followups.dueOn} {formatDate(head.dueDate, state.lang)}
                  {" · "}
                  <span className={days < 0 ? "font-medium text-danger" : undefined}>
                    {days < 0
                      ? t.followups.overdueBy(Math.abs(days))
                      : days === 0
                        ? t.followups.dueToday
                        : t.followups.inDays(days)}
                  </span>
                </p>
                {length > 1 ? (
                  <p className="nums mt-1 text-[11px] text-ink-4">
                    {t.followups.seriesProgress(completed, length)}
                    {later.length > 0 ? ` · ${t.followups.queued(later.length)}` : ""}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------------------------------ recommendations */

export const RECOMMENDATION_TONE: Record<Recommendation["status"], Tone> = {
  proposed: "warn",
  accepted: "ok",
  declined: "neutral",
  done: "accent",
};

export function RecommendationsCard({ patient }: { patient: Patient }) {
  const { t, state, actions } = useDemo();
  const s = useSelectors();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [booking, setBooking] = useState<BookingPrefill | null>(null);

  const recommendations = sortRecommendations(s.recommendationsForPatient(patient.id));

  return (
    <>
      <Card>
        <CardHeader
          title={t.patients.recommendations}
          action={<AddAction label={t.actions.add} onClick={() => setAdding(true)} />}
        />
        {recommendations.length === 0 ? (
          <EmptyState icon={<Lightbulb size={22} />} title={t.patients.noRecommendations} />
        ) : (
          <ul className="divide-y divide-line">
            {recommendations.map((recommendation) => (
              <li key={recommendation.id} className="px-6 py-3.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[13px] font-medium text-ink">
                    {s.treatmentNames(recommendation.treatmentIds).join(", ")}
                  </p>
                  <Pill tone={RECOMMENDATION_TONE[recommendation.status]}>
                    {t.rec[recommendation.status]}
                  </Pill>
                  {recommendation.urgency === "soon" ? (
                    <Pill tone="warn">{t.form.urgencySoon}</Pill>
                  ) : null}
                </div>
                {recommendation.note ? (
                  <p className="mt-1 text-xs leading-relaxed text-ink-2">{recommendation.note}</p>
                ) : null}
                <p className="nums mt-1 text-[11px] text-ink-4">
                  {s.providerById(recommendation.providerId)?.name} ·{" "}
                  {formatDate(recommendation.createdAt, state.lang)}
                </p>

                {recommendation.status === "proposed" ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => {
                        actions.patchRecommendation(recommendation.id, { status: "accepted" });
                        toast.push(t.toast.recommendationUpdated);
                      }}
                    >
                      <Check size={13} weight="bold" />
                      {t.rec.accept}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        actions.patchRecommendation(recommendation.id, { status: "declined" });
                        toast.push(t.toast.recommendationUpdated);
                      }}
                    >
                      <X size={13} weight="bold" />
                      {t.rec.decline}
                    </Button>
                  </div>
                ) : null}

                {recommendation.status === "accepted" ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        setBooking({
                          patientId: patient.id,
                          treatmentIds: recommendation.treatmentIds,
                          recommendationId: recommendation.id,
                          providerId: recommendation.providerId,
                        })
                      }
                    >
                      <CalendarPlus size={13} weight="bold" />
                      {t.rec.book}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        actions.patchRecommendation(recommendation.id, { status: "done" });
                        toast.push(t.toast.recommendationUpdated);
                      }}
                    >
                      {t.rec.markDone}
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {adding ? (
        <RecommendationModal patient={patient} onClose={() => setAdding(false)} />
      ) : null}
      <BookAppointmentModal
        open={Boolean(booking)}
        onClose={() => setBooking(null)}
        prefill={booking ?? undefined}
      />
    </>
  );
}

function RecommendationModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { t, state, actions } = useDemo();
  const toast = useToast();
  const [treatmentId, setTreatmentId] = useState("");
  const [providerId, setProviderId] = useState(state.providers[0]?.id ?? "");
  const [urgency, setUrgency] = useState<NonNullable<Recommendation["urgency"]>>("routine");
  const [note, setNote] = useState("");

  function save() {
    if (!treatmentId || !providerId) return;
    actions.addRecommendation({
      patientId: patient.id,
      providerId,
      treatmentIds: [treatmentId],
      urgency,
      note,
    });
    toast.push(t.toast.recommendationAdded);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.patients.addRecommendation}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={save} disabled={!treatmentId || !providerId}>
            {t.actions.save}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t.form.treatment}>
          <Select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
            <option value="">{t.form.selectTreatment}</option>
            {state.treatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.name[state.lang]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.form.provider}>
          <Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
            {state.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.form.urgency}>
          <Select
            value={urgency}
            onChange={(e) =>
              setUrgency(e.target.value as NonNullable<Recommendation["urgency"]>)
            }
          >
            <option value="soon">{t.form.urgencySoon}</option>
            <option value="routine">{t.form.urgencyRoutine}</option>
            <option value="watch">{t.form.urgencyWatch}</option>
          </Select>
        </Field>
        <Field label={t.form.recommendationNote}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------- benefits */

function benefitValue(benefit: Benefit, lang: "sq" | "en"): string {
  if (benefit.percent != null) return `−${benefit.percent}%`;
  if (benefit.amount != null) return `−${formatMoney(benefit.amount, lang)}`;
  return "";
}

export function BenefitsCard({ patient }: { patient: Patient }) {
  const { t, state, now, actions } = useDemo();
  const s = useSelectors();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const benefits = sortBenefits(s.benefitsForPatient(patient.id), now);

  return (
    <>
      <Card>
        <CardHeader
          title={t.patients.benefits}
          hint={t.patients.benefitsHint}
          action={<AddAction label={t.actions.add} onClick={() => setAdding(true)} />}
        />
        {benefits.length === 0 ? (
          <EmptyState icon={<Gift size={22} />} title={t.patients.noBenefits} />
        ) : (
          <ul className="divide-y divide-line">
            {benefits.map((benefit) => {
              const open = isBenefitOpen(benefit, now);
              const expired = isBenefitExpired(benefit, now);
              return (
                <li key={benefit.id} className="flex flex-wrap items-start gap-3 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[13px] font-medium text-ink">{benefit.label}</p>
                      <Pill tone={benefit.kind === "gift" ? "lime" : "accent"}>
                        {benefit.kind === "gift" ? t.form.benefitGift : t.form.benefitDiscount}
                      </Pill>
                      {benefit.usedAt ? <Pill tone="neutral">{t.patients.used}</Pill> : null}
                      {expired ? <Pill tone="danger">{t.patients.expired}</Pill> : null}
                    </div>
                    {benefit.reason ? (
                      <p className="mt-1 text-xs text-ink-2">{benefit.reason}</p>
                    ) : null}
                    <p className="nums mt-1 text-[11px] text-ink-4">
                      {benefit.treatmentId
                        ? `${s.treatmentById(benefit.treatmentId)?.name[state.lang]} · `
                        : ""}
                      {t.patients.grantedBy} {s.providerById(benefit.grantedBy)?.name}
                      {benefit.expiresAt
                        ? ` · ${t.patients.expiresOn} ${formatDate(benefit.expiresAt, state.lang)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="nums text-[13px] font-semibold text-ink">
                      {benefitValue(benefit, state.lang)}
                    </span>
                    {open ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          actions.markBenefitUsed(benefit.id);
                          toast.push(t.toast.benefitUsed);
                        }}
                      >
                        {t.patients.markUsed}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {adding ? <BenefitModal patient={patient} onClose={() => setAdding(false)} /> : null}
    </>
  );
}

function BenefitModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { t, state, now, actions } = useDemo();
  const toast = useToast();
  const [kind, setKind] = useState<Benefit["kind"]>("discount");
  const [label, setLabel] = useState("");
  const [percent, setPercent] = useState("");
  const [amount, setAmount] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [reason, setReason] = useState("");
  const [grantedBy, setGrantedBy] = useState(state.providers[0]?.id ?? "");
  const [expiresAt, setExpiresAt] = useState(format(addDays(now, 60), "yyyy-MM-dd"));

  function save() {
    if (!label.trim() || !grantedBy) return;
    actions.addBenefit({
      patientId: patient.id,
      kind,
      label,
      percent: percent ? Number(percent) : undefined,
      amount: amount ? Number(amount) : undefined,
      treatmentId: treatmentId || undefined,
      reason,
      grantedBy,
      expiresAt: expiresAt || undefined,
    });
    toast.push(t.toast.benefitAdded);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.patients.addBenefit}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={save} disabled={!label.trim()}>
            {t.actions.save}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.form.benefitKind}>
          <Select value={kind} onChange={(e) => setKind(e.target.value as Benefit["kind"])}>
            <option value="discount">{t.form.benefitDiscount}</option>
            <option value="gift">{t.form.benefitGift}</option>
          </Select>
        </Field>
        <Field label={t.form.benefitLabel}>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label={t.form.percent}>
          <Input
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            inputMode="numeric"
            placeholder="20"
          />
        </Field>
        <Field label={t.form.amount}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="4000"
          />
        </Field>
        <Field label={t.form.treatment}>
          <Select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
            <option value="">—</option>
            {state.treatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.name[state.lang]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.form.expiresAt}>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </Field>
        <Field label={t.form.provider}>
          <Select value={grantedBy} onChange={(e) => setGrantedBy(e.target.value)}>
            {state.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.form.reason} className="sm:col-span-2">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </Field>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------------- notes */

export function NotesCard({ patient }: { patient: Patient }) {
  const { t, state, actions } = useDemo();
  const s = useSelectors();
  const [adding, setAdding] = useState(false);
  const notes = sortNotes(patient.notes);

  return (
    <>
      <Card>
        <CardHeader
          title={t.patients.notes}
          action={<AddAction label={t.patients.addNote} onClick={() => setAdding(true)} />}
        />
        {notes.length === 0 ? (
          <EmptyState title={t.patients.noNotes} />
        ) : (
          <ul className="divide-y divide-line">
            {notes.map((note) => (
              <li key={note.id} className="flex items-start gap-3 px-6 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {note.label ? (
                      <p className="text-[13px] font-medium text-ink">{note.label}</p>
                    ) : null}
                    {note.pinned ? <Pill tone="lime">{t.patients.pinned}</Pill> : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-2">{note.body}</p>
                  <p className="nums mt-1 text-[11px] text-ink-4">
                    {note.authorId ? `${s.providerById(note.authorId)?.name} · ` : ""}
                    {formatDate(note.createdAt, state.lang)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton
                    tone="ghost"
                    title={t.form.pinNote}
                    aria-label={t.form.pinNote}
                    onClick={() => actions.toggleNotePin(patient.id, note.id)}
                  >
                    <PushPin size={14} weight={note.pinned ? "fill" : "bold"} />
                  </IconButton>
                  <IconButton
                    tone="ghost"
                    title={t.actions.delete}
                    aria-label={t.actions.delete}
                    onClick={() => actions.removeNote(patient.id, note.id)}
                  >
                    <Trash size={14} weight="bold" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {adding ? <NoteModal patient={patient} onClose={() => setAdding(false)} /> : null}
    </>
  );
}

function NoteModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { t, state, actions } = useDemo();
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [pinned, setPinned] = useState(false);

  function save() {
    if (!body.trim()) return;
    actions.addNote(patient.id, {
      body,
      label,
      authorId: authorId || undefined,
      pinned,
    });
    toast.push(t.toast.noteAdded);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.patients.addNote}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={save} disabled={!body.trim()}>
            {t.actions.save}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t.form.noteTitle} hint={t.form.noteTitleHint}>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label={t.form.noteBody}>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </Field>
        <Field label={t.form.provider}>
          <Select value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
            <option value="">—</option>
            {state.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox
          label={t.form.pinNote}
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
        />
      </div>
    </Modal>
  );
}
