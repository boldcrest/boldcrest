"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { CalendarBlank, CheckCircle, Clock, MapPin, SealCheck, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { capitalizeFirst, formatDate, formatTime } from "@/lib/i18n";

/** Patient-facing copy. The page renders in the patient's own language,
 *  independently of whatever language the clinic staff use in the app. */
const COPY = {
  sq: {
    appointment: "Konfirmim termini",
    followup: "Konfirmim i ndjekjes së trajtimit",
    hello: "Përshëndetje",
    apptIntro: "Ky është termini juaj:",
    fuIntro: "Sipas protokollit, ka ardhur koha për:",
    with: "me",
    confirm: "Po, konfirmoj",
    confirmFu: "Po, dua ta rezervoj",
    reschedule: "Dua një orar tjetër",
    okTitle: "Faleminderit, u konfirmua.",
    okBody: "Ju presim në orarin e caktuar.",
    okFuBody: "Klinika ju kontakton shumë shpejt për të caktuar orarin.",
    reTitle: "E morëm kërkesën tuaj.",
    reBody: "Ju kontaktojmë brenda ditës për një orar tjetër.",
    expired: "Ky link ka skaduar. Na kontaktoni në telefon.",
    invalid: "Ky link nuk është i vlefshëm.",
    used: "Përgjigja juaj është regjistruar tashmë.",
  },
  it: {
    appointment: "Conferma appuntamento",
    followup: "Conferma del controllo",
    hello: "Buongiorno",
    apptIntro: "Questo è il suo appuntamento:",
    fuIntro: "Secondo il protocollo, è il momento di:",
    with: "con",
    confirm: "Sì, confermo",
    confirmFu: "Sì, desidero prenotare",
    reschedule: "Vorrei un altro orario",
    okTitle: "Grazie, è confermato.",
    okBody: "La aspettiamo all'orario stabilito.",
    okFuBody: "La clinica la contatterà a breve per fissare l'orario.",
    reTitle: "Abbiamo ricevuto la sua richiesta.",
    reBody: "La contattiamo in giornata per un altro orario.",
    expired: "Questo link è scaduto. Ci contatti telefonicamente.",
    invalid: "Questo link non è valido.",
    used: "La sua risposta è già stata registrata.",
  },
  en: {
    appointment: "Appointment confirmation",
    followup: "Follow-up confirmation",
    hello: "Hello",
    apptIntro: "This is your appointment:",
    fuIntro: "Your treatment protocol is due for:",
    with: "with",
    confirm: "Yes, I confirm",
    confirmFu: "Yes, book it for me",
    reschedule: "I need another time",
    okTitle: "Thank you, that is confirmed.",
    okBody: "We will see you at the scheduled time.",
    okFuBody: "The clinic will contact you shortly to set a time.",
    reTitle: "We have your request.",
    reBody: "We will contact you today with another time.",
    expired: "This link has expired. Please call the clinic.",
    invalid: "This link is not valid.",
    used: "Your answer has already been recorded.",
  },
};

export default function ConfirmPage() {
  const params = useParams<{ token: string }>();
  const { state, ready, dispatch } = useDemo();
  const s = useSelectors();
  const [localAnswer, setLocalAnswer] = useState<"confirmed" | "reschedule" | null>(null);

  const token = useMemo(
    () => state.tokens.find((t) => t.token === params.token),
    [state.tokens, params.token],
  );

  const appointment = token?.purpose === "appointment"
    ? state.appointments.find((a) => a.id === token.targetId)
    : undefined;
  const followUp = token?.purpose === "followup"
    ? state.followUps.find((f) => f.id === token.targetId)
    : undefined;

  const patient = s.patientById(appointment?.patientId ?? followUp?.patientId ?? "");
  const lang = (patient?.lang ?? "sq") as keyof typeof COPY;
  const c = COPY[lang];
  const dateLang = lang === "en" ? "en" : "sq";

  // A token that was already answered (in this tab or the clinic's) shows its outcome.
  const answered = localAnswer ?? (token?.usedAt ? (token.outcome ?? "confirmed") : null);

  function answer(outcome: "confirmed" | "reschedule") {
    dispatch({ type: "useToken", token: params.token, outcome });
    setLocalAnswer(outcome);
  }

  if (!ready) {
    return <Shell clinic={state.clinic.name}><div className="h-32 animate-pulse rounded-card bg-surface-2" /></Shell>;
  }

  if (!token || !patient) {
    return (
      <Shell clinic={state.clinic.name}>
        <Notice icon={<XCircle size={26} weight="fill" />} title={c.invalid} />
      </Shell>
    );
  }

  if (new Date(token.expiresAt) < new Date(state.now) && !token.usedAt) {
    return (
      <Shell clinic={state.clinic.name}>
        <Notice icon={<Clock size={26} weight="fill" />} title={c.expired} />
      </Shell>
    );
  }

  if (answered) {
    const isFollowUp = Boolean(followUp);
    return (
      <Shell clinic={state.clinic.name}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3 py-6 text-center"
        >
          <span
            className={
              answered === "confirmed"
                ? "grid size-14 place-items-center rounded-full bg-ok-soft text-ok"
                : "grid size-14 place-items-center rounded-full bg-warn-soft text-warn"
            }
          >
            {answered === "confirmed" ? (
              <SealCheck size={28} weight="fill" />
            ) : (
              <Clock size={28} weight="fill" />
            )}
          </span>
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            {answered === "confirmed" ? c.okTitle : c.reTitle}
          </h1>
          <p className="max-w-[40ch] text-sm text-ink-2">
            {answered === "confirmed"
              ? isFollowUp
                ? c.okFuBody
                : c.okBody
              : c.reBody}
          </p>
        </motion.div>
      </Shell>
    );
  }

  const provider = appointment ? s.providerById(appointment.providerId) : undefined;
  const stepLabel = followUp ? s.stepLabel(followUp.protocolId, followUp.stepId) : "";

  return (
    <Shell clinic={state.clinic.name}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-5"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {appointment ? c.appointment : c.followup}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
            {c.hello}, {patient.firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {appointment ? c.apptIntro : c.fuIntro}
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface-2 p-4">
          {appointment ? (
            <ul className="flex flex-col gap-2.5 text-sm">
              <li className="flex items-center gap-2.5 text-ink">
                <CalendarBlank size={16} weight="bold" className="shrink-0 text-ink-3" />
                <span>{capitalizeFirst(formatDate(appointment.start, dateLang))}</span>
              </li>
              <li className="flex items-center gap-2.5 text-ink">
                <Clock size={16} weight="bold" className="shrink-0 text-ink-3" />
                <span className="nums">{formatTime(appointment.start)}</span>
                {provider ? (
                  <span className="text-ink-2">
                    {c.with} {provider.name}
                  </span>
                ) : null}
              </li>
              <li className="flex items-center gap-2.5 text-ink-2">
                <MapPin size={16} weight="bold" className="shrink-0 text-ink-3" />
                {state.clinic.address}
              </li>
            </ul>
          ) : (
            <p className="text-sm font-medium text-ink">{stepLabel}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={() => answer("confirmed")}
            className="h-12 w-full text-[15px]"
          >
            <CheckCircle size={18} weight="fill" />
            {followUp ? c.confirmFu : c.confirm}
          </Button>
          <Button onClick={() => answer("reschedule")} className="h-12 w-full text-[15px]">
            {c.reschedule}
          </Button>
        </div>
      </motion.div>
    </Shell>
  );
}

function Shell({ clinic, children }: { clinic: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-bg px-4 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-card bg-accent text-[13px] font-bold text-accent-fg">
          A
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink">{clinic}</span>
      </div>
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        {children}
      </div>
      <p className="mt-5 max-w-sm text-center text-[11px] leading-relaxed text-ink-3">
        Demo. Ky link është vetëm për prezantim.
      </p>
    </div>
  );
}

function Notice({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="text-ink-3">{icon}</span>
      <p className="text-sm font-medium text-ink">{title}</p>
    </div>
  );
}
