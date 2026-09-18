"use client";

import { useState } from "react";
import { Card, CardHeader, Pill, cx } from "@/components/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { useDemo } from "@/lib/demo/store";
import { capitalizeFirst, formatMoney } from "@/lib/i18n";

const TABS = ["treatments", "protocols", "templates", "providers"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const { t, state } = useDemo();
  const [tab, setTab] = useState<Tab>("treatments");

  return (
    <>
      <PageHeader title={t.settings.title} />

      <div className="mb-4 flex flex-wrap gap-1 rounded-card border border-line p-1">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cx(
              "rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              tab === key ? "bg-accent text-accent-fg" : "text-ink-2 hover:text-ink",
            )}
          >
            {t.settings[key]}
          </button>
        ))}
      </div>

      <FadeIn key={tab}>
        {tab === "treatments" ? (
          <Card>
            <CardHeader title={t.settings.treatments} />
            <ul className="divide-y divide-line">
              {state.treatments.map((treatment) => {
                const protocol = state.protocols.find((p) => p.id === treatment.protocolId);
                return (
                  <li key={treatment.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {treatment.name[state.lang]}
                      </p>
                      <p className="truncate text-xs text-ink-3">
                        {treatment.vertical === "dental" ? "Dentar" : "Estetik"} ·{" "}
                        {t.settings.minutes(treatment.minutes)}
                      </p>
                    </div>
                    {protocol ? (
                      <Pill tone="accent">{protocol.name[state.lang]}</Pill>
                    ) : null}
                    <span className="nums shrink-0 text-[13px] text-ink-2">
                      {formatMoney(treatment.price, state.lang)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}

        {tab === "protocols" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {state.protocols.map((protocol) => (
              <Card key={protocol.id}>
                <CardHeader
                  title={protocol.name[state.lang]}
                  hint={protocol.treatmentIds
                    .map((id) => state.treatments.find((tr) => tr.id === id)?.name[state.lang])
                    .filter(Boolean)
                    .join(", ")}
                />
                <ol className="divide-y divide-line">
                  {protocol.steps.map((step, index) => (
                    <li key={step.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="nums grid size-6 shrink-0 place-items-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-2">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                        {step.label[state.lang]}
                      </span>
                      <span className="nums shrink-0 text-xs text-ink-3">
                        {t.settings.afterDays(step.offsetDays)}
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
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
    </>
  );
}

function weekdayName(weekday: number, lang: "sq" | "en") {
  const sq = ["e hënë", "e martë", "e mërkurë", "e enjte", "e premte", "e shtunë", "e diel"];
  const en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return (lang === "sq" ? sq : en)[weekday - 1] ?? "";
}
