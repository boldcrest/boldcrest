import { describe, expect, it } from "vitest";
import { addDays, format, startOfDay } from "date-fns";
import {
  followUpsForVisit,
  occurrenceOffset,
  openSeries,
  seriesKey,
  stepInterval,
  stepOccurrences,
  type FollowUp,
  type Protocol,
  type Treatment,
  type Visit,
} from "../index";

const today = startOfDay(new Date(2026, 2, 10));
const iso = (d: Date) => format(d, "yyyy-MM-dd");

const treatments: Treatment[] = [
  { id: "t-laser", name: { sq: "Lazer", en: "Laser" }, vertical: "aesthetic", minutes: 30, price: 6000, protocolId: "p-laser" },
  { id: "t-crown", name: { sq: "Kurorë", en: "Crown" }, vertical: "dental", minutes: 60, price: 25000, protocolId: "p-crown" },
  { id: "t-plain", name: { sq: "Pastrim", en: "Cleaning" }, vertical: "dental", minutes: 30, price: 3000 },
];

const protocols: Protocol[] = [
  {
    id: "p-laser",
    name: { sq: "Kursi i lazerit", en: "Laser course" },
    treatmentIds: ["t-laser"],
    steps: [
      {
        id: "s-laser",
        offsetDays: 30,
        label: { sq: "seanca e radhës", en: "next session", it: "prossima seduta" },
        template: "followup",
        repeat: { everyDays: 30, times: 6 },
      },
    ],
  },
  {
    id: "p-crown",
    name: { sq: "Kurora", en: "Crown" },
    treatmentIds: ["t-crown"],
    steps: [
      {
        id: "s-crown",
        offsetDays: 14,
        label: { sq: "kontroll", en: "check", it: "controllo" },
        template: "followup",
      },
    ],
  },
];

function visit(treatmentIds: string[], id = "vi-1", date = today): Visit {
  return {
    id,
    patientId: "pa-1",
    providerId: "prov-1",
    date: date.toISOString(),
    treatmentIds,
  };
}

describe("step shape", () => {
  it("treats a step with no repeat as happening once", () => {
    const [step] = protocols[1].steps;
    expect(stepOccurrences(step)).toBe(1);
    expect(stepInterval(step)).toBe(0);
    expect(occurrenceOffset(step, 1)).toBe(14);
  });

  it("spaces a recurring step by its interval", () => {
    const [step] = protocols[0].steps;
    expect(stepOccurrences(step)).toBe(6);
    expect(stepInterval(step)).toBe(30);
    expect(occurrenceOffset(step, 1)).toBe(30);
    expect(occurrenceOffset(step, 6)).toBe(180);
  });
});

describe("generating a course from one visit", () => {
  it("creates the whole series at once, one occurrence per session", () => {
    // The clinic logs one laser session; all six recalls exist from that moment,
    // so nobody has to remember to create the next one.
    const created = followUpsForVisit(visit(["t-laser"]), protocols, treatments);
    expect(created).toHaveLength(6);
    expect(created.map((f) => f.dueDate)).toEqual([
      iso(addDays(today, 30)),
      iso(addDays(today, 60)),
      iso(addDays(today, 90)),
      iso(addDays(today, 120)),
      iso(addDays(today, 150)),
      iso(addDays(today, 180)),
    ]);
    expect(created.map((f) => f.occurrence)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(created.every((f) => f.seriesLength === 6)).toBe(true);
    expect(created.every((f) => f.status === "due")).toBe(true);
  });

  it("numbers the ids of a series but leaves a one-off step unnumbered", () => {
    // Ids are derived, not stored, so they have to be stable: regenerating the
    // same visit must not create a second copy of the same follow-up.
    const course = followUpsForVisit(visit(["t-laser"]), protocols, treatments);
    expect(course[0].id).toBe("fu-vi-1-s-laser-1");
    expect(course[5].id).toBe("fu-vi-1-s-laser-6");

    const [single] = followUpsForVisit(visit(["t-crown"]), protocols, treatments);
    expect(single.id).toBe("fu-vi-1-s-crown");
    expect(single.occurrence).toBe(1);
    expect(single.seriesLength).toBe(1);
  });

  it("creates nothing for a treatment with no protocol", () => {
    expect(followUpsForVisit(visit(["t-plain"]), protocols, treatments)).toHaveLength(0);
  });
});

describe("series", () => {
  const course = followUpsForVisit(visit(["t-laser"]), protocols, treatments);

  it("keys every occurrence of one step of one visit together", () => {
    expect(new Set(course.map(seriesKey)).size).toBe(1);
  });

  it("collapses a course to the one session to act on now", () => {
    const [series] = openSeries(course);
    expect(series.head.occurrence).toBe(1);
    expect(series.later).toHaveLength(5);
    expect(series.completed).toBe(0);
    expect(series.length).toBe(6);
  });

  it("moves the head forward as sessions are finished and counts progress", () => {
    const progressed: FollowUp[] = course.map((f) =>
      f.occurrence <= 2 ? { ...f, status: "done" as const } : f,
    );
    const [series] = openSeries(progressed);
    expect(series.head.occurrence).toBe(3);
    expect(series.completed).toBe(2);
    expect(series.later).toHaveLength(3);
  });

  it("counts a booked session as progress, since the patient is coming", () => {
    const booked: FollowUp[] = course.map((f) =>
      f.occurrence === 1 ? { ...f, status: "booked" as const } : f,
    );
    expect(openSeries(booked)[0].completed).toBe(1);
  });

  it("drops a course with nothing left open", () => {
    const finished: FollowUp[] = course.map((f) => ({ ...f, status: "done" as const }));
    expect(openSeries(finished)).toHaveLength(0);
  });

  it("keeps two visits of the same treatment as two separate courses", () => {
    const other = followUpsForVisit(visit(["t-laser"], "vi-2"), protocols, treatments);
    expect(openSeries([...course, ...other])).toHaveLength(2);
  });

  it("gives a one-off follow-up a series of its own, length one", () => {
    const single = followUpsForVisit(visit(["t-crown"]), protocols, treatments);
    const [series] = openSeries(single);
    expect(series.length).toBe(1);
    expect(series.later).toHaveLength(0);
  });
});
