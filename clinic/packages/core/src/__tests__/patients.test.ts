import { describe, expect, it } from "vitest";
import {
  ageOn,
  daysUntilBirthday,
  isBenefitExpired,
  isBenefitOpen,
  isRecommendationOpen,
  sortBenefits,
  sortNotes,
  sortRecommendations,
  type Benefit,
  type PatientNote,
  type Recommendation,
} from "../index";

// Local midnight, to match the local-date arithmetic the helpers use.
const june10 = new Date(2026, 5, 10);

describe("age", () => {
  it("counts whole years and does not round up before the birthday", () => {
    expect(ageOn("1990-06-15", new Date(2026, 5, 14))).toBe(35);
    expect(ageOn("1990-06-15", new Date(2026, 5, 15))).toBe(36);
  });
});

describe("birthdays", () => {
  it("is zero on the day itself", () => {
    expect(daysUntilBirthday("1990-06-10", june10)).toBe(0);
  });

  it("counts forward to a birthday still to come this year", () => {
    expect(daysUntilBirthday("1990-06-13", june10)).toBe(3);
  });

  it("wraps to next year once the birthday has passed", () => {
    // 9 June 2026 has gone; the next one is 9 June 2027, 364 days off.
    expect(daysUntilBirthday("1990-06-09", june10)).toBe(364);
  });
});

describe("notes", () => {
  const notes: PatientNote[] = [
    { id: "a", body: "older", createdAt: "2024-01-01" },
    { id: "b", body: "newer", createdAt: "2026-01-01" },
    { id: "c", body: "pinned but old", createdAt: "2020-01-01", pinned: true },
  ];

  it("puts pinned notes first, then the newest", () => {
    // A pinned note is the clinician's "read this first", so it outranks recency.
    expect(sortNotes(notes).map((n) => n.id)).toEqual(["c", "b", "a"]);
  });

  it("does not mutate the array it was given", () => {
    const original = [...notes];
    sortNotes(notes);
    expect(notes).toEqual(original);
  });
});

describe("recommendations", () => {
  const base = {
    patientId: "pa-1",
    providerId: "prov-1",
    treatmentIds: ["t-1"],
    createdAt: "2026-01-01",
  };
  const recs: Recommendation[] = [
    { ...base, id: "declined", status: "declined" },
    { ...base, id: "done", status: "done" },
    { ...base, id: "proposed", status: "proposed" },
    { ...base, id: "accepted", status: "accepted" },
  ];

  it("ranks work waiting above advice not yet answered", () => {
    expect(sortRecommendations(recs).map((r) => r.id)).toEqual([
      "accepted",
      "proposed",
      "done",
      "declined",
    ]);
  });

  it("counts proposed and accepted as still open", () => {
    expect(recs.filter(isRecommendationOpen).map((r) => r.id).sort()).toEqual([
      "accepted",
      "proposed",
    ]);
  });
});

describe("discounts and gifts", () => {
  const base = {
    patientId: "pa-1",
    kind: "discount" as const,
    label: "x",
    grantedBy: "prov-1",
    createdAt: "2026-01-01",
  };

  it("stays open with no expiry set", () => {
    expect(isBenefitOpen({ ...base, id: "1" }, june10)).toBe(true);
  });

  it("is open on its last day and expired the day after", () => {
    expect(isBenefitOpen({ ...base, id: "2", expiresAt: "2026-06-10" }, june10)).toBe(true);
    expect(isBenefitOpen({ ...base, id: "3", expiresAt: "2026-06-09" }, june10)).toBe(false);
    expect(isBenefitExpired({ ...base, id: "3", expiresAt: "2026-06-09" }, june10)).toBe(true);
  });

  it("counts a used benefit as closed but not expired", () => {
    const used: Benefit = { ...base, id: "4", usedAt: "2026-05-01", expiresAt: "2026-06-09" };
    expect(isBenefitOpen(used, june10)).toBe(false);
    expect(isBenefitExpired(used, june10)).toBe(false);
  });

  it("lists what can still be redeemed first", () => {
    const list: Benefit[] = [
      { ...base, id: "used", usedAt: "2026-05-01", createdAt: "2026-05-01" },
      { ...base, id: "open", createdAt: "2026-01-01" },
    ];
    expect(sortBenefits(list, june10).map((b) => b.id)).toEqual(["open", "used"]);
  });
});
