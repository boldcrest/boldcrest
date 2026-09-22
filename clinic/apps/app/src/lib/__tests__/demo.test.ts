import { describe, expect, it } from "vitest";
import { addDays, format, startOfDay, subDays } from "date-fns";
import {
  followUpsForVisit,
  daysUntilDue,
  isDue,
  isOverdue,
  followUpPriority,
  renderTemplate,
  waLink,
  makeToken,
  type Visit,
} from "@clinic/core";
import { buildSeed, templates } from "@/lib/demo/seed";

const today = startOfDay(new Date("2026-03-10T00:00:00.000Z"));
const seed = buildSeed(today);

function visit(treatmentIds: string[], date = today): Visit {
  return {
    id: "vi-test",
    patientId: "pa-arta",
    providerId: "prov-zeqiri",
    date: date.toISOString(),
    treatmentIds,
  };
}

describe("protocol engine", () => {
  it("creates one follow-up per protocol step, dated from the visit", () => {
    const created = followUpsForVisit(visit(["t-implant"]), seed.protocols, seed.treatments);
    expect(created).toHaveLength(2);
    expect(created.map((f) => f.dueDate)).toEqual([
      format(addDays(today, 10), "yyyy-MM-dd"),
      format(addDays(today, 120), "yyyy-MM-dd"),
    ]);
    expect(created.every((f) => f.status === "due")).toBe(true);
  });

  it("creates nothing for a treatment without a protocol", () => {
    expect(followUpsForVisit(visit(["t-mbushje"]), seed.protocols, seed.treatments)).toHaveLength(0);
  });

  it("does not duplicate a protocol when a visit has two treatments sharing it", () => {
    const created = followUpsForVisit(visit(["t-buze", "t-faqe"]), seed.protocols, seed.treatments);
    // both map to the filler protocol, so its two steps are created once
    expect(created).toHaveLength(2);
  });

  it("treats a snooze as moving the effective due date", () => {
    const [followUp] = followUpsForVisit(visit(["t-mezo"]), seed.protocols, seed.treatments);
    const due = { ...followUp, dueDate: format(subDays(today, 3), "yyyy-MM-dd") };
    expect(isOverdue(due, today)).toBe(true);

    const snoozed = {
      ...due,
      status: "snoozed" as const,
      snoozeUntil: format(addDays(today, 4), "yyyy-MM-dd"),
    };
    expect(isDue(snoozed, today)).toBe(false);
    expect(daysUntilDue(snoozed, today)).toBe(4);
  });

  it("ranks confirmed follow-ups above merely due ones", () => {
    const base = followUpsForVisit(visit(["t-mezo"]), seed.protocols, seed.treatments)[0];
    const confirmed = { ...base, status: "confirmed" as const };
    const plainDue = { ...base, dueDate: format(subDays(today, 30), "yyyy-MM-dd") };
    expect(followUpPriority(confirmed, today)).toBeLessThan(followUpPriority(plainDue, today));
  });

  it("closed follow-ups are never due", () => {
    const [followUp] = followUpsForVisit(visit(["t-mezo"]), seed.protocols, seed.treatments);
    expect(isDue({ ...followUp, status: "done", dueDate: "2020-01-01" }, today)).toBe(false);
    expect(isDue({ ...followUp, status: "booked", dueDate: "2020-01-01" }, today)).toBe(false);
  });
});

describe("message rendering", () => {
  const booking = templates.find((t) => t.key === "booking_confirm")!;

  it("fills every placeholder in the patient's language", () => {
    const body = renderTemplate(booking, "sq", {
      patient: "Arta",
      clinic: "Klinika Arnika",
      provider: "Dr. Ilir Zeqiri",
      date: "10 mars 2026",
      time: "09:30",
      link: "https://example.al/konfirmo/abc",
    });
    expect(body).toContain("Arta");
    expect(body).toContain("Dr. Ilir Zeqiri");
    expect(body).toContain("https://example.al/konfirmo/abc");
    expect(body).not.toMatch(/\{\{/);
  });

  it("uses Italian for an Italian patient", () => {
    const body = renderTemplate(booking, "it", { patient: "Giulia", clinic: "Klinika Arnika" });
    expect(body).toContain("Buongiorno Giulia");
  });

  it("never leaks an unresolved placeholder when data is missing", () => {
    expect(renderTemplate(booking, "en", { patient: "Sophie" })).not.toMatch(/\{\{/);
  });

  it("builds a wa.me link with digits only and encoded text", () => {
    const link = waLink("+355 69 241 8736", "Përshëndetje, Arta");
    expect(link.startsWith("https://wa.me/355692418736?text=")).toBe(true);
    expect(link).toContain(encodeURIComponent("Përshëndetje, Arta"));
  });

  it("mints distinct tokens", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => makeToken()));
    expect(tokens.size).toBe(200);
  });
});

describe("seed integrity", () => {
  it("every seeded follow-up matches its protocol offset from the visit", () => {
    for (const followUp of seed.followUps) {
      const visitRecord = seed.visits.find((v) => v.id === followUp.visitId);
      const protocol = seed.protocols.find((p) => p.id === followUp.protocolId);
      const step = protocol?.steps.find((s) => s.id === followUp.stepId);
      expect(visitRecord, followUp.id).toBeDefined();
      expect(step, followUp.id).toBeDefined();
      const expected = format(
        addDays(startOfDay(new Date(visitRecord!.date)), step!.offsetDays),
        "yyyy-MM-dd",
      );
      expect(followUp.dueDate, followUp.id).toBe(expected);
    }
  });

  it("every appointment points at a real patient, provider and treatment", () => {
    for (const a of seed.appointments) {
      expect(seed.patients.some((p) => p.id === a.patientId), a.id).toBe(true);
      expect(seed.providers.some((p) => p.id === a.providerId), a.id).toBe(true);
      for (const id of a.treatmentIds) {
        expect(seed.treatments.some((t) => t.id === id), id).toBe(true);
      }
    }
  });

  it("only books clinicians who perform that kind of treatment", () => {
    for (const a of seed.appointments) {
      const provider = seed.providers.find((p) => p.id === a.providerId)!;
      for (const id of a.treatmentIds) {
        const treatment = seed.treatments.find((t) => t.id === id)!;
        expect(provider.verticals, `${a.id} ${treatment.id}`).toContain(treatment.vertical);
      }
    }
  });

  it("stores phone numbers in E.164 form so wa.me links work", () => {
    for (const patient of seed.patients) {
      expect(patient.phone, patient.id).toMatch(/^\+\d{9,15}$/);
    }
  });
});
