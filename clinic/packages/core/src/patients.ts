import { differenceInCalendarDays, differenceInYears, parseISO, startOfDay } from "date-fns";
import type { Benefit, PatientNote, Recommendation } from "./types";

/** Age in whole years on a given day. Derived, never stored, so it cannot go stale. */
export function ageOn(birthDate: string, on: Date): number {
  return differenceInYears(startOfDay(on), startOfDay(parseISO(birthDate)));
}

/**
 * Days until the next birthday; 0 on the day itself.
 *
 * A 29 February birthday falls on 1 March in a non-leap year, which is the
 * ordinary convention for greetings and is what the Date arithmetic gives.
 */
export function daysUntilBirthday(birthDate: string, now: Date): number {
  const born = parseISO(birthDate);
  const today = startOfDay(now);
  const thisYear = startOfDay(
    new Date(today.getFullYear(), born.getMonth(), born.getDate()),
  );
  const target =
    differenceInCalendarDays(thisYear, today) >= 0
      ? thisYear
      : startOfDay(new Date(today.getFullYear() + 1, born.getMonth(), born.getDate()));
  return differenceInCalendarDays(target, today);
}

export function isBirthdayWithin(birthDate: string, now: Date, days: number): boolean {
  return daysUntilBirthday(birthDate, now) <= days;
}

/** Pinned notes first, then newest. What a clinician needs to see is at the top. */
export function sortNotes(notes: PatientNote[]): PatientNote[] {
  return [...notes].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const OPEN_RECOMMENDATION_STATUSES: Recommendation["status"][] = ["proposed", "accepted"];

export function isRecommendationOpen(recommendation: Recommendation): boolean {
  return OPEN_RECOMMENDATION_STATUSES.includes(recommendation.status);
}

/** Accepted first (the patient said yes, so it is work waiting), then newest. */
export function sortRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const rank: Record<Recommendation["status"], number> = {
    accepted: 0,
    proposed: 1,
    done: 2,
    declined: 3,
  };
  return [...recommendations].sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Still redeemable: not used, and not past its expiry. */
export function isBenefitOpen(benefit: Benefit, now: Date): boolean {
  if (benefit.usedAt) return false;
  if (!benefit.expiresAt) return true;
  return differenceInCalendarDays(startOfDay(parseISO(benefit.expiresAt)), startOfDay(now)) >= 0;
}

export function isBenefitExpired(benefit: Benefit, now: Date): boolean {
  return !benefit.usedAt && !isBenefitOpen(benefit, now);
}

/** Open first, then newest. */
export function sortBenefits(benefits: Benefit[], now: Date): Benefit[] {
  return [...benefits].sort((a, b) => {
    const openA = isBenefitOpen(a, now);
    const openB = isBenefitOpen(b, now);
    if (openA !== openB) return openA ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
