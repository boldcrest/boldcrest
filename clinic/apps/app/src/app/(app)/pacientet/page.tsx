"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, UserPlus, Users } from "@phosphor-icons/react";
import { Button, Card, Checkbox, EmptyState, Field, Input, Modal, Pill, Select, useToast } from "@clinic/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { useDemo } from "@/lib/demo/store";
import { formatDate } from "@clinic/i18n";

export default function PatientsPage() {
  const { t, state, now } = useDemo();

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...state.patients].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
    );
    if (!q) return list;
    return list.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.phone} ${p.city}`.toLowerCase().includes(q),
    );
  }, [state.patients, query]);

  return (
    <>
      <PageHeader
        title={t.patients.title}
        action={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <UserPlus size={15} weight="bold" />
            {t.patients.new}
          </Button>
        }
      >
        <p className="mt-1 text-sm text-ink-3">{t.patients.count(state.patients.length)}</p>
      </PageHeader>

      <div className="mb-4 relative max-w-sm">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.patients.search}
          aria-label={t.patients.search}
          className="h-11 w-full rounded-full bg-surface pl-10 pr-4 text-sm text-ink shadow-[var(--shadow-card)] placeholder:text-ink-3 focus:outline-none dark:hairline"
        />
      </div>

      <FadeIn>
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={<Users size={26} />} title={t.patients.none} />
          ) : (
            <ul className="flex flex-col gap-0.5 px-2 pb-3">
              {filtered.map((patient) => {
                const lastVisit = [...state.visits]
                  .filter((v) => v.patientId === patient.id && new Date(v.date) <= now)
                  .sort((a, b) => b.date.localeCompare(a.date))[0];
                const next = state.appointments
                  .filter(
                    (a) =>
                      a.patientId === patient.id &&
                      new Date(a.start) >= now &&
                      a.status === "scheduled",
                  )
                  .sort((a, b) => a.start.localeCompare(b.start))[0];

                return (
                  <li key={patient.id}>
                    <Link
                      href={`/pacientet/${patient.id}`}
                      className="flex items-center gap-3 rounded-card px-3 py-3 transition-colors hover:bg-surface-2"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-[13px] font-semibold text-ink-2">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink">
                            {patient.firstName} {patient.lastName}
                          </span>
                          {patient.isTraveller ? (
                            <Pill tone="accent">{t.patients.traveller}</Pill>
                          ) : null}
                          {!patient.contactConsent ? (
                            <Pill tone="neutral">{t.patients.noConsent}</Pill>
                          ) : null}
                        </span>
                        <span className="nums block truncate text-xs text-ink-3">
                          {patient.phone} · {patient.city}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-right text-xs text-ink-3 sm:block">
                        {next ? (
                          <>
                            <span className="block text-ink-2">{t.patients.nextAppointment}</span>
                            <span className="nums">{formatDate(next.start, state.lang)}</span>
                          </>
                        ) : lastVisit ? (
                          <>
                            <span className="block text-ink-2">{t.patients.lastVisit}</span>
                            <span className="nums">{formatDate(lastVisit.date, state.lang)}</span>
                          </>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </FadeIn>

      <NewPatientModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function NewPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, actions } = useDemo();
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "+355",
    city: "Tiranë",
    birthYear: "1990",
    lang: "sq" as "sq" | "en" | "it",
    contactConsent: true,
    isTraveller: false,
  });
  const [touched, setTouched] = useState(false);

  const valid = form.firstName.trim() && form.lastName.trim() && form.phone.length > 6;

  function submit() {
    setTouched(true);
    if (!valid) return;
    actions.addPatient({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.replace(/\s/g, ""),
      city: form.city.trim(),
      birthYear: Number(form.birthYear) || 1990,
      lang: form.lang,
      contactConsent: form.contactConsent,
      isTraveller: form.isTraveller,
    });
    toast.push(t.toast.patientCreated);
    setForm({
      firstName: "",
      lastName: "",
      phone: "+355",
      city: "Tiranë",
      birthYear: "1990",
      lang: "sq",
      contactConsent: true,
      isTraveller: false,
    });
    setTouched(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.patients.new}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button variant="primary" onClick={submit}>
            {t.actions.save}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.form.firstName}
          error={touched && !form.firstName.trim() ? t.form.required : undefined}
        >
          <Input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </Field>
        <Field
          label={t.form.lastName}
          error={touched && !form.lastName.trim() ? t.form.required : undefined}
        >
          <Input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </Field>
        <Field
          label={t.form.phone}
          error={touched && form.phone.length <= 6 ? t.form.required : undefined}
        >
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            inputMode="tel"
          />
        </Field>
        <Field label={t.form.city}>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label={t.form.birthYear}>
          <Input
            value={form.birthYear}
            onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
            inputMode="numeric"
          />
        </Field>
        <Field label={t.form.language}>
          <Select
            value={form.lang}
            onChange={(e) => setForm({ ...form, lang: e.target.value as "sq" | "en" | "it" })}
          >
            <option value="sq">Shqip</option>
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </Select>
        </Field>
        <div className="flex flex-col gap-2.5 sm:col-span-2">
          <Checkbox
            label={t.form.consent}
            checked={form.contactConsent}
            onChange={(e) => setForm({ ...form, contactConsent: e.target.checked })}
          />
          <Checkbox
            label={t.form.traveller}
            checked={form.isTraveller}
            onChange={(e) => setForm({ ...form, isTraveller: e.target.checked })}
          />
        </div>
      </div>
    </Modal>
  );
}
