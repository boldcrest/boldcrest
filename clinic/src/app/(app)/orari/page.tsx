"use client";

import { useMemo, useState } from "react";
import { addDays, isSameDay, startOfWeek } from "date-fns";
import { CalendarBlank, CalendarPlus, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button, Card, EmptyState, cx } from "@/components/ui";
import { FadeIn, PageHeader } from "@/components/shell";
import { ConfirmationBadge } from "@/components/status";
import { AppointmentSheet } from "@/components/appointment-sheet";
import { BookAppointmentModal } from "@/components/book-appointment";
import { WhatsAppComposer, useWhatsAppComposer } from "@/components/whatsapp-composer";
import { useDemo, useSelectors } from "@/lib/demo/store";
import { capitalizeFirst, formatDate, formatTime, formatWeekday } from "@/lib/i18n";
import type { Appointment } from "@/lib/demo/types";

const DAY_START = 8;
const DAY_END = 20;
const HOUR_PX = 64;

/* One hue per clinician. The block is that hue mixed into the card surface,
   so it tints in the light and glows in the dark from a single value. */
const TINT_HEX: Record<string, string> = {
  teal: "#12a04e",
  amber: "#f97316",
  violet: "#7c2fe0",
};

const tintOf = (key: string) => TINT_HEX[key] ?? TINT_HEX.teal;

export default function SchedulePage() {
  const { t, state, now } = useDemo();

  const [view, setView] = useState<"day" | "week">("day");
  const [cursor, setCursor] = useState<Date>(now);
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [open, setOpen] = useState<Appointment | null>(null);
  const [booking, setBooking] = useState(false);
  const composer = useWhatsAppComposer();

  const providers = useMemo(
    () =>
      providerFilter === "all"
        ? state.providers
        : state.providers.filter((p) => p.id === providerFilter),
    [state.providers, providerFilter],
  );

  const weekDays = useMemo(() => {
    const monday = startOfWeek(cursor, { weekStartsOn: 1 });
    return Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  }, [cursor]);

  function move(direction: 1 | -1) {
    setCursor((c) => addDays(c, view === "day" ? direction : direction * 7));
  }

  return (
    <>
      <PageHeader
        title={t.schedule.title}
        action={
          <Button variant="primary" onClick={() => setBooking(true)}>
            <CalendarPlus size={15} weight="bold" />
            {t.schedule.newAppointment}
          </Button>
        }
      >
        <p className="mt-1 text-sm text-ink-3">
          {view === "day"
            ? `${capitalizeFirst(formatWeekday(cursor, state.lang))}, ${formatDate(cursor, state.lang)}`
            : `${formatDate(weekDays[0], state.lang)} - ${formatDate(weekDays[5], state.lang)}`}
        </p>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-[var(--shadow-card)] dark:hairline">
          <Button variant="ghost" size="sm" onClick={() => move(-1)} aria-label="previous">
            <CaretLeft size={15} weight="bold" />
          </Button>
          <button
            onClick={() => setCursor(now)}
            className="rounded-full px-3 py-1 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {t.schedule.today}
          </button>
          <Button variant="ghost" size="sm" onClick={() => move(1)} aria-label="next">
            <CaretRight size={15} weight="bold" />
          </Button>
        </div>

        <div className="flex items-center rounded-full bg-surface p-1 shadow-[var(--shadow-card)] dark:hairline">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cx(
                "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                view === v ? "bg-ink text-bg" : "text-ink-3 hover:text-ink",
              )}
            >
              {v === "day" ? t.schedule.day : t.schedule.week}
            </button>
          ))}
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="h-9 rounded-full border-none bg-surface px-3.5 text-[13px] text-ink shadow-[var(--shadow-card)]"
        >
          <option value="all">{t.schedule.allProviders}</option>
          {state.providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <FadeIn>
        {view === "day" ? (
          <DayGrid
            day={cursor}
            providers={providers}
            onOpen={setOpen}
          />
        ) : (
          <WeekGrid days={weekDays} providerFilter={providerFilter} onOpen={setOpen} />
        )}
      </FadeIn>

      <AppointmentSheet
        appointment={open}
        onClose={() => setOpen(null)}
        onCompose={(target) => {
          setOpen(null);
          composer.open(target);
        }}
      />
      <BookAppointmentModal
        open={booking}
        onClose={() => setBooking(false)}
        prefill={{ start: cursor }}
      />
      <WhatsAppComposer draft={composer.draft} onClose={composer.close} />
    </>
  );
}

function DayGrid({
  day,
  providers,
  onOpen,
}: {
  day: Date;
  providers: ReturnType<typeof useDemo>["state"]["providers"];
  onOpen: (a: Appointment) => void;
}) {
  const { t } = useDemo();
  const s = useSelectors();

  const dayAppointments = s.appointmentsOn(day);
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
  const weekday = day.getDay() === 0 ? 7 : day.getDay();

  if (providers.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(${providers.length}, minmax(0, 1fr))` }}>
        <div className="bg-surface-2" />
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="bg-surface-2 px-3.5 py-2.5"
          >
            <p className="truncate text-[13px] font-semibold text-ink">{provider.name}</p>
            <p className="truncate text-[11px] text-ink-3">{provider.title}</p>
          </div>
        ))}
      </div>

      <div className="relative overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `56px repeat(${providers.length}, minmax(0, 1fr))`,
            height: (DAY_END - DAY_START) * HOUR_PX,
          }}
        >
          <div className="relative bg-surface-2">
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="nums absolute right-2 text-[11px] text-ink-3"
                style={{ top: i * HOUR_PX + 4 }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {providers.map((provider) => {
            const block = provider.hours.find((h) => h.weekday === weekday);
            const items = dayAppointments.filter((a) => a.providerId === provider.id);
            return (
              <div key={provider.id} className="relative border-l border-line/70">
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-line/50"
                    style={{ top: i * HOUR_PX }}
                  />
                ))}

                {/* Shade the hours this clinician does not work. */}
                {block ? (
                  <>
                    <OffHours from={DAY_START} to={hhmmToHours(block.start)} />
                    <OffHours from={hhmmToHours(block.end)} to={DAY_END} />
                  </>
                ) : (
                  <OffHours from={DAY_START} to={DAY_END} />
                )}

                {items.map((appointment) => {
                  const start = new Date(appointment.start);
                  const end = new Date(appointment.end);
                  const top =
                    (start.getHours() + start.getMinutes() / 60 - DAY_START) * HOUR_PX;
                  const height = Math.max(
                    ((end.getTime() - start.getTime()) / 3_600_000) * HOUR_PX - 3,
                    44,
                  );
                  const patient = s.patientById(appointment.patientId);
                  const cancelled =
                    appointment.status === "cancelled" || appointment.status === "noshow";
                  return (
                    <button
                      key={appointment.id}
                      onClick={() => onOpen(appointment)}
                      className={cx(
                        "absolute inset-x-1 overflow-hidden rounded-[12px] py-1.5 pl-3 pr-2 text-left",
                        "transition-shadow duration-200 ease-[var(--ease)] hover:shadow-[var(--shadow-card)]",
                        cancelled && "opacity-55 grayscale",
                      )}
                      style={{
                        top,
                        height,
                        background: `color-mix(in oklab, ${tintOf(provider.tint)} 10%, var(--surface))`,
                      }}
                    >
                      <span
                        className="absolute inset-y-1.5 left-1.5 w-[3px] rounded-full"
                        style={{ background: tintOf(provider.tint) }}
                        aria-hidden="true"
                      />
                      <span className="nums block text-[11px] font-medium text-ink-2">
                        {formatTime(start)}
                      </span>
                      <span className="block truncate text-[13px] font-medium leading-tight text-ink">
                        {patient?.firstName} {patient?.lastName}
                      </span>
                      {height > 68 ? (
                        <span className="mt-0.5 block truncate text-[11px] text-ink-3">
                          {s.treatmentNames(appointment.treatmentIds)[0]}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {dayAppointments.length === 0 ? (
        <div className="pt-1">
          <EmptyState icon={<CalendarBlank size={24} />} title={t.schedule.noneThisDay} />
        </div>
      ) : null}
    </Card>
  );
}

function OffHours({ from, to }: { from: number; to: number }) {
  if (to <= from) return null;
  return (
    <div
      className="absolute inset-x-0 bg-surface-2/70"
      style={{ top: (from - DAY_START) * HOUR_PX, height: (to - from) * HOUR_PX }}
      aria-hidden="true"
    />
  );
}

function hhmmToHours(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h + m / 60;
}

function WeekGrid({
  days,
  providerFilter,
  onOpen,
}: {
  days: Date[];
  providerFilter: string;
  onOpen: (a: Appointment) => void;
}) {
  const { t, now, state } = useDemo();
  const s = useSelectors();


  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {days.map((day) => {
        const items = s
          .appointmentsOn(day)
          .filter((a) => providerFilter === "all" || a.providerId === providerFilter);
        const today = isSameDay(day, now);
        return (
          <Card
            key={day.toISOString()}
            className={cx(today && "ring-1 ring-accent ring-offset-2 ring-offset-bg")}
          >
            <div className="flex items-baseline justify-between px-4 pb-2 pt-3">
              <p className="text-[13px] font-semibold capitalize text-ink">
                {formatWeekday(day, state.lang, true)}
              </p>
              <p className="nums text-xs text-ink-3">{day.getDate()}</p>
            </div>
            {items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-ink-3">{t.schedule.noneThisDay}</p>
            ) : (
              <ul className="flex flex-col gap-0.5 px-2 pb-2">
                {items.map((appointment) => {
                  const provider = s.providerById(appointment.providerId);
                  return (
                    <li key={appointment.id}>
                      <button
                        onClick={() => onOpen(appointment)}
                        className="flex w-full items-center gap-2 rounded-card px-2.5 py-2 text-left transition-colors duration-200 hover:bg-surface-2"
                      >
                        {/* Which clinician, as a mark rather than a rule. */}
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: tintOf(provider?.tint ?? "teal") }}
                          aria-hidden="true"
                        />
                        <span className="nums w-10 shrink-0 text-[11px] text-ink-2">
                          {formatTime(appointment.start)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                          {s.patientName(appointment.patientId)}
                        </span>
                        <ConfirmationBadge confirmation={appointment.confirmation} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
