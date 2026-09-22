import { describe, expect, it } from "vitest";
import { addDays, startOfDay } from "date-fns";
import { reminderTemplateFor } from "../whatsapp";
import type { Appointment } from "../types";

const today = startOfDay(new Date("2026-03-10T00:00:00.000Z"));

describe("reminder choice", () => {
  function appointment(dayOffset: number, confirmation: Appointment["confirmation"]): Appointment {
    const start = addDays(today, dayOffset);
    return {
      id: "ap-test",
      patientId: "pa-arta",
      providerId: "prov-zeqiri",
      treatmentIds: ["t-kontroll"],
      start: start.toISOString(),
      end: start.toISOString(),
      status: "scheduled",
      confirmation,
    };
  }

  it("uses the same-day text for an appointment today", () => {
    expect(reminderTemplateFor(appointment(0, "sent"), today)).toBe("reminder_3h");
    expect(reminderTemplateFor(appointment(0, "pending"), today)).toBe("reminder_3h");
  });

  it("asks for confirmation on an unconfirmed future booking", () => {
    expect(reminderTemplateFor(appointment(2, "pending"), today)).toBe("booking_confirm");
  });

  it("sends a dated reminder once the booking was already contacted", () => {
    expect(reminderTemplateFor(appointment(2, "sent"), today)).toBe("reminder_48h");
  });
});
