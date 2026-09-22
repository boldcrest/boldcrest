import { describe, expect, it } from "vitest";
import { capitalizeFirst, formatCadence } from "../index";

describe("formatCadence", () => {
  it("says it in months when the interval is whole months", () => {
    // "çdo muaj" is what a clinic says; "çdo 30 ditë" is what a database says.
    expect(formatCadence(30, "sq")).toBe("çdo muaj");
    expect(formatCadence(30, "en")).toBe("monthly");
    expect(formatCadence(90, "sq")).toBe("çdo 3 muaj");
    expect(formatCadence(180, "en")).toBe("every 6 months");
  });

  it("falls back to weeks when months do not divide the interval", () => {
    expect(formatCadence(7, "sq")).toBe("çdo javë");
    expect(formatCadence(21, "sq")).toBe("çdo 3 javë");
    expect(formatCadence(14, "en")).toBe("every 2 weeks");
  });

  it("uses days only when neither months nor weeks fit", () => {
    expect(formatCadence(10, "sq")).toBe("çdo 10 ditë");
    expect(formatCadence(10, "en")).toBe("every 10 days");
    expect(formatCadence(1, "sq")).toBe("çdo ditë");
  });

  it("prefers months over weeks where both would divide", () => {
    // 210 days is 30 weeks and 7 months; months read better.
    expect(formatCadence(210, "en")).toBe("every 7 months");
  });
});

describe("capitalizeFirst", () => {
  it("lifts only the first letter, leaving Albanian lowercase orthography alone", () => {
    expect(capitalizeFirst("e hënë, 10 mars")).toBe("E hënë, 10 mars");
  });

  it("handles an empty string", () => {
    expect(capitalizeFirst("")).toBe("");
  });
});
