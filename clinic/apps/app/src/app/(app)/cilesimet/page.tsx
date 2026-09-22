"use client";

import { useState } from "react";
import { Plus, Repeat, Trash } from "@phosphor-icons/react";
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  Field,
  IconButton,
  Input,
  Modal,
  Pill,
  Select,
  cx,
  useToast,
} from "@clinic/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { useDemo } from "@/lib/demo/store";
import { RequirePermission } from "@/components/guard";
import { capitalizeFirst, formatCadence, formatMoney } from "@clinic/i18n";
import { stepInterval, stepOccurrences, type Protocol, type Treatment } from "@clinic/core";

const TABS = ["treatments", "protocols", "templates", "providers"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  return (
    <RequirePermission needs="settings.manage">
      <Settings />
    </RequirePermission>
  );
}

function Settings() {
  const { t, state } = useDemo();
  const [tab, setTab] = useState<Tab>("treatments");
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader title={t.settings.title} />

      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-full bg-surface p-1 shadow-[var(--shadow-card)] dark:hairline">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              tab === key ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
            )}
          >
            {t.settings[key]}
          </button>
        ))}
      </div>

      <FadeIn key={tab}>
        {tab === "treatments" ? (
          <Card>
            <CardHeader
              title={t.settings.treatments}
              hint={t.settings.treatmentHint}
              action={
                <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                  <Plus size={13} weight="bold" />
                  {t.settings.newTreatment}
                </Button>
              }
            />
            <ul className="flex flex-col gap-0.5 px-2 pb-3">
              {state.treatments.map((treatment) => (
                <TreatmentRow key={treatment.id} treatment={treatment} />
              ))}
            </ul>
          </Card>
        ) : null}

        {tab === "protocols" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {state.protocols.map((protocol) => (
              <ProtocolCard key={protocol.id} protocol={protocol} />
            ))}
          </div>
        ) : null}

        {tab === "templates" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-3">{t.settings.templateHint}</p>
            {state.templates.map((template) => (
              <Card key={template.key}>
                <CardHeader title={template.name[state.lang]} />
                <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-3">
                  {(["sq", "it", "en"] as const).map((lang) => (
                    <div key={lang}>
                      <p className="mb-1 text-[11px] font-semibold uppercase text-ink-3">
                        {lang}
                      </p>
                      <p className="rounded-card bg-surface-2 px-2.5 py-2 text-xs leading-relaxed text-ink-2">
                        {template.body[lang]}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === "providers" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader title={provider.name} hint={provider.title} />
                <div className="px-4 py-3.5">
                  <p className="mb-2 text-xs font-medium text-ink-3">{t.settings.hours}</p>
                  <ul className="flex flex-col gap-1">
                    {provider.hours.map((block) => (
                      <li
                        key={block.weekday}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-ink-2">
                          {capitalizeFirst(weekdayName(block.weekday, state.lang))}
                        </span>
                        <span className="nums text-ink">
                          {block.start} - {block.end}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </FadeIn>

      {creating ? <NewTreatmentModal onClose={() => setCreating(false)} /> : null}
    </>
  );
}

/** A service and the recalls it triggers, read as one thing. */
function TreatmentRow({ treatment }: { treatment: Treatment }) {
  const { t, state } = useDemo();
  const protocol = state.protocols.find((p) => p.id === treatment.protocolId);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-card px-3 py-3 transition-colors hover:bg-surface-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{treatment.name[state.lang]}</p>
        <p className="truncate text-xs text-ink-3">
          {treatment.vertical === "dental" ? t.form.verticalDental : t.form.verticalAesthetic} ·{" "}
          {t.settings.minutes(treatment.minutes)}
        </p>
        {protocol ? (
          <ul className="mt-1 flex flex-col gap-0.5">
            {protocol.steps.map((step) => {
              const every = stepInterval(step);
              return (
                <li key={step.id} className="nums truncate text-[11px] text-ink-4">
                  {step.label[state.lang]} · {t.settings.afterDays(step.offsetDays)}
                  {every > 0
                    ? `, ${formatCadence(every, state.lang)} × ${stepOccurrences(step)}`
                    : ""}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-1 text-[11px] text-ink-4">{t.settings.noFollowUps}</p>
        )}
      </div>
      {protocol ? (
        <Pill tone="accent" icon={<Repeat size={11} weight="bold" />}>
          {t.settings.stepCount(protocol.steps.length)}
        </Pill>
      ) : null}
      <span className="nums shrink-0 text-[13px] text-ink-2">
        {formatMoney(treatment.price, state.lang)}
      </span>
    </li>
  );
}

function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const { t, state } = useDemo();

  return (
    <Card>
      <CardHeader
        title={protocol.name[state.lang]}
        hint={protocol.treatmentIds
          .map((id) => state.treatments.find((tr) => tr.id === id)?.name[state.lang])
          .filter(Boolean)
          .join(", ")}
      />
      <ol className="flex flex-col gap-0.5 px-2 pb-3">
        {protocol.steps.map((step, index) => {
          const every = stepInterval(step);
          return (
            <li key={step.id} className="flex items-center gap-3 rounded-card px-3 py-2.5">
              <span className="nums grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">
                  {step.label[state.lang]}
                </span>
                {every > 0 ? (
                  <span className="nums block truncate text-[11px] text-ink-4">
                    {formatCadence(every, state.lang)} · {stepOccurrences(step)}×
                  </span>
                ) : null}
              </span>
              <span className="nums shrink-0 text-xs text-ink-3">
                {t.settings.afterDays(step.offsetDays)}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ------------------------------------------------------- new treatment */

type StepDraft = {
  label: string;
  offsetDays: string;
  repeats: boolean;
  everyDays: string;
  times: string;
};

const emptyStep: StepDraft = {
  label: "",
  offsetDays: "30",
  repeats: false,
  everyDays: "30",
  times: "6",
};

/**
 * Adding a service and defining its follow-ups is one form, because they are
 * one decision: the cadence entered here is what turns up under Follow-ups the
 * moment a visit for this service is recorded.
 */
function NewTreatmentModal({ onClose }: { onClose: () => void }) {
  const { t, actions } = useDemo();
  const toast = useToast();

  const [nameSq, setNameSq] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [vertical, setVertical] = useState<Treatment["vertical"]>("dental");
  const [minutes, setMinutes] = useState("45");
  const [price, setPrice] = useState("5000");
  const [steps, setSteps] = useState<StepDraft[]>([{ ...emptyStep }]);

  function patchStep(index: number, patch: Partial<StepDraft>) {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    );
  }

  function save() {
    if (!nameSq.trim()) return;
    actions.addTreatment(
      {
        nameSq,
        nameEn,
        vertical,
        minutes: Number(minutes) || 30,
        price: Number(price) || 0,
      },
      steps
        .filter((step) => step.label.trim())
        .map((step) => ({
          label: step.label,
          offsetDays: Number(step.offsetDays) || 0,
          repeat: step.repeats
            ? {
                everyDays: Number(step.everyDays) || 30,
                times: Math.max(2, Number(step.times) || 2),
              }
            : undefined,
        })),
    );
    toast.push(t.toast.treatmentCreated);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t.settings.newTreatment}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={save} disabled={!nameSq.trim()}>
            {t.actions.save}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.form.treatmentNameSq}>
            <Input value={nameSq} onChange={(e) => setNameSq(e.target.value)} />
          </Field>
          <Field label={t.form.treatmentNameEn}>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </Field>
          <Field label={t.form.vertical}>
            <Select
              value={vertical}
              onChange={(e) => setVertical(e.target.value as Treatment["vertical"])}
            >
              <option value="dental">{t.form.verticalDental}</option>
              <option value="aesthetic">{t.form.verticalAesthetic}</option>
            </Select>
          </Field>
          <Field label={t.form.durationMinutes}>
            <Input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              inputMode="numeric"
            />
          </Field>
          <Field label={t.form.priceAll}>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
          </Field>
        </div>

        <div className="border-t border-line pt-4">
          <p className="text-[13px] font-medium text-ink">{t.form.followUpSteps}</p>
          <p className="mt-0.5 text-xs text-ink-3">{t.form.followUpStepsHint}</p>

          <div className="mt-3 flex flex-col gap-3">
            {steps.map((step, index) => (
              <div key={index} className="rounded-card border border-line p-3">
                <div className="flex items-start gap-3">
                  <div className="grid flex-1 gap-3 sm:grid-cols-[2fr_1fr]">
                    <Field label={t.form.stepName}>
                      <Input
                        value={step.label}
                        onChange={(e) => patchStep(index, { label: e.target.value })}
                        placeholder="kontrolli periodik"
                      />
                    </Field>
                    <Field label={t.form.afterDaysField}>
                      <Input
                        value={step.offsetDays}
                        onChange={(e) => patchStep(index, { offsetDays: e.target.value })}
                        inputMode="numeric"
                      />
                    </Field>
                  </div>
                  {steps.length > 1 ? (
                    <IconButton
                      tone="ghost"
                      className="mt-6"
                      title={t.form.removeStep}
                      aria-label={t.form.removeStep}
                      onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                    >
                      <Trash size={14} weight="bold" />
                    </IconButton>
                  ) : null}
                </div>

                <div className="mt-3">
                  <Checkbox
                    label={t.form.repeats}
                    checked={step.repeats}
                    onChange={(e) => patchStep(index, { repeats: e.target.checked })}
                  />
                </div>

                {step.repeats ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label={t.form.repeatEvery}>
                      <Input
                        value={step.everyDays}
                        onChange={(e) => patchStep(index, { everyDays: e.target.value })}
                        inputMode="numeric"
                      />
                    </Field>
                    <Field label={t.form.repeatTimes}>
                      <Input
                        value={step.times}
                        onChange={(e) => patchStep(index, { times: e.target.value })}
                        inputMode="numeric"
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <Button
            size="sm"
            className="mt-3"
            onClick={() => setSteps([...steps, { ...emptyStep }])}
          >
            <Plus size={13} weight="bold" />
            {t.form.addStep}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function weekdayName(weekday: number, lang: "sq" | "en") {
  const sq = ["e hënë", "e martë", "e mërkurë", "e enjte", "e premte", "e shtunë", "e diel"];
  const en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return (lang === "sq" ? sq : en)[weekday - 1] ?? "";
}
