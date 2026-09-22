"use client";

import { useCallback, useState } from "react";
import {
  ArrowSquareOut,
  Copy,
  Info,
  LockKey,
  PaperPlaneTilt,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Button, Modal, Pill } from "@clinic/ui";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { confirmUrl, makeToken, renderTemplate, templateFor, waLink } from "@clinic/core";
import { formatDate, formatTime } from "@clinic/i18n";
import type { TemplateKey } from "@/lib/demo/types";

export interface ComposerTarget {
  patientId: string;
  template: TemplateKey;
  appointmentId?: string;
  followUpId?: string;
}

export interface ComposerDraft extends ComposerTarget {
  messageId: string;
  body: string;
  token: string | null;
}

const LINKED_TEMPLATES: TemplateKey[] = ["booking_confirm", "reminder_48h", "followup"];

/** Builds the message, mints the confirmation token and records the draft, all inside
 *  the click handler. Opening the composer is therefore a plain state assignment. */
export function useWhatsAppComposer() {
  const { state, actions } = useDemo();
  const [draft, setDraft] = useState<ComposerDraft | null>(null);

  const open = useCallback(
    (target: ComposerTarget) => {
      const patient = state.patients.find((p) => p.id === target.patientId);
      if (!patient) return;

      const token = LINKED_TEMPLATES.includes(target.template) ? makeToken() : null;
      const appointment = target.appointmentId
        ? state.appointments.find((a) => a.id === target.appointmentId)
        : undefined;
      const followUp = target.followUpId
        ? state.followUps.find((f) => f.id === target.followUpId)
        : undefined;
      const provider = appointment
        ? state.providers.find((p) => p.id === appointment.providerId)
        : undefined;
      const visit = followUp ? state.visits.find((v) => v.id === followUp.visitId) : undefined;
      const treatmentIds = visit?.treatmentIds ?? appointment?.treatmentIds ?? [];
      const treatmentName =
        state.treatments.find((tr) => tr.id === treatmentIds[0])?.name[
          patient.lang === "en" ? "en" : "sq"
        ] ?? "";

      // The step is written in the patient's language, not the clinic's UI language.
      const step = followUp
        ? (state.protocols
            .find((p) => p.id === followUp.protocolId)
            ?.steps.find((st) => st.id === followUp.stepId)?.label[patient.lang] ?? "")
        : "";

      const body = renderTemplate(templateFor(state.templates, target.template), patient.lang, {
        patient: patient.firstName,
        clinic: state.clinic.name,
        address: state.clinic.address,
        provider: provider?.name,
        date: appointment ? formatDate(appointment.start, patient.lang === "en" ? "en" : "sq") : "",
        time: appointment ? formatTime(appointment.start) : "",
        treatment: treatmentName,
        step,
        link: token ? confirmUrl(token) : "",
      });

      const message = actions.createMessage({
        patientId: patient.id,
        template: target.template,
        body,
        appointmentId: target.appointmentId,
        followUpId: target.followUpId,
        token: token ?? undefined,
        tokenPurpose: target.appointmentId
          ? "appointment"
          : target.followUpId
            ? "followup"
            : undefined,
        tokenTargetId: target.appointmentId ?? target.followUpId,
      });

      setDraft({ ...target, messageId: message.id, body, token });
    },
    [state, actions],
  );

  const close = useCallback(() => setDraft(null), []);
  return { draft, open, close };
}

export function WhatsAppComposer({
  draft,
  onClose,
}: {
  draft: ComposerDraft | null;
  onClose: () => void;
}) {
  const { t, state, actions } = useDemo();
  const s = useSelectors();
  const [copied, setCopied] = useState(false);

  const patient = draft ? s.patientById(draft.patientId) : undefined;
  const appointment = draft?.appointmentId
    ? state.appointments.find((a) => a.id === draft.appointmentId)
    : undefined;

  function markSent() {
    if (!draft) return;
    actions.markMessageSent(draft.messageId);
    if (draft.appointmentId && appointment?.confirmation === "pending") {
      actions.patchAppointment(draft.appointmentId, { confirmation: "sent" });
    }
    if (draft.followUpId) {
      actions.patchFollowUp(draft.followUpId, {
        status: "sent",
        lastMessageId: draft.messageId,
      });
    }
    setCopied(false);
    onClose();
  }

  async function copy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal
      open={Boolean(draft && patient)}
      onClose={onClose}
      title={t.message.title}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="secondary" onClick={markSent}>
            <PaperPlaneTilt size={15} weight="bold" />
            {t.message.markSent}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (patient && draft) {
                window.open(waLink(patient.phone, draft.body), "_blank", "noopener");
              }
              markSent();
            }}
          >
            <WhatsappLogo size={16} weight="fill" />
            {t.message.open}
          </Button>
        </>
      }
    >
      {draft && patient ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-ink-3">{t.message.to}</span>
            <span className="font-medium text-ink">
              {patient.firstName} {patient.lastName}
            </span>
            <span className="nums text-ink-2">{patient.phone}</span>
            <Pill tone="neutral">{patient.lang.toUpperCase()}</Pill>
          </div>

          {!patient.contactConsent ? (
            <p className="flex items-start gap-2 rounded-card bg-danger-soft px-3 py-2 text-[13px] text-danger">
              <Info size={15} weight="bold" className="mt-0.5 shrink-0" />
              {t.message.noConsent}
            </p>
          ) : null}

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink-2">{t.message.preview}</p>
            <div className="rounded-panel bg-[#e7f3e8] p-4 dark:bg-surface-2">
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-stone-900 dark:text-ink">
                {draft.body}
              </p>
            </div>
          </div>

          {draft.token ? (
            <div className="flex flex-col gap-2 rounded-card bg-surface-2 p-3">
              <p className="flex items-start gap-2 text-xs text-ink-2">
                <LockKey size={14} weight="bold" className="mt-0.5 shrink-0" />
                {t.message.linkHint}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(confirmUrl(draft.token!), "_blank", "noopener")}
                className="self-start"
              >
                <ArrowSquareOut size={14} weight="bold" />
                {t.message.testLink}
              </Button>
            </div>
          ) : null}

          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-3">
            <Info size={14} weight="bold" className="mt-0.5 shrink-0" />
            {t.message.complianceNote}
          </p>

          <Button size="sm" variant="ghost" onClick={copy} className="self-start">
            <Copy size={14} weight="bold" />
            {copied ? t.message.copied : t.message.copy}
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
