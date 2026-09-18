import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import type { FollowUp, Protocol, Treatment, Visit } from "./demo/types";

/** A logged visit spawns one follow-up per protocol step attached to its treatments.
 *  This is the heart of the product: the clinic never has to remember a recall. */
export function followUpsForVisit(
  visit: Visit,
  protocols: Protocol[],
  treatments: Treatment[],
  idPrefix = "fu",
): FollowUp[] {
  const visitDate = startOfDay(parseISO(visit.date));
  const protocolIds = new Set<string>();

  for (const treatmentId of visit.treatmentIds) {
    const treatment = treatments.find((t) => t.id === treatmentId);
    if (treatment?.protocolId) protocolIds.add(treatment.protocolId);
  }

  const created: FollowUp[] = [];
  for (const protocolId of protocolIds) {
    const protocol = protocols.find((p) => p.id === protocolId);
    if (!protocol) continue;
    for (const step of protocol.steps) {
      created.push({
        id: `${idPrefix}-${visit.id}-${step.id}`,
        patientId: visit.patientId,
        visitId: visit.id,
        protocolId: protocol.id,
        stepId: step.id,
        dueDate: format(addDays(visitDate, step.offsetDays), "yyyy-MM-dd"),
        status: "due",
      });
    }
  }
  return created;
}

export const OPEN_STATUSES: FollowUp["status"][] = ["due", "sent", "confirmed", "snoozed"];

export function isOpen(followUp: FollowUp): boolean {
  return OPEN_STATUSES.includes(followUp.status);
}

/** Effective due date: a snoozed follow-up is not due until the snooze runs out. */
export function effectiveDueDate(followUp: FollowUp): string {
  return followUp.snoozeUntil && followUp.snoozeUntil > followUp.dueDate
    ? followUp.snoozeUntil
    : followUp.dueDate;
}

export function daysUntilDue(followUp: FollowUp, now: Date): number {
  return differenceInCalendarDays(parseISO(effectiveDueDate(followUp)), startOfDay(now));
}

export function isDue(followUp: FollowUp, now: Date): boolean {
  return isOpen(followUp) && daysUntilDue(followUp, now) <= 0;
}

export function isOverdue(followUp: FollowUp, now: Date): boolean {
  return isOpen(followUp) && daysUntilDue(followUp, now) < 0;
}

/** Reactivation value decays with time, so the work list is ranked by urgency,
 *  not simply sorted oldest first. */
export function followUpPriority(followUp: FollowUp, now: Date): number {
  const days = daysUntilDue(followUp, now);
  const statusWeight =
    followUp.status === "confirmed" ? -1000 : followUp.status === "due" ? -100 : 0;
  return statusWeight + days;
}
