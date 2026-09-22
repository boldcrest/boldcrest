import type { Permission, Role } from "./permissions";

export type Lang = "sq" | "en";
export type Vertical = "dental" | "aesthetic";

export type AppointmentStatus =
  | "scheduled"
  | "arrived"
  | "completed"
  | "noshow"
  | "cancelled";

/** Confirmation is tracked separately from the visit lifecycle: a booking can be
 *  confirmed by the patient long before they arrive, or never confirmed at all. */
export type Confirmation = "pending" | "sent" | "confirmed" | "reschedule";

export type FollowUpStatus =
  | "due"
  | "sent"
  | "confirmed"
  | "declined"
  | "booked"
  | "done"
  | "snoozed";

export type TokenPurpose = "appointment" | "followup";

/**
 * Someone who works at the clinic. Distinct from Provider: every clinician is
 * staff, but reception and the accountant are staff too and never appear in
 * the calendar. The role is what the interface and the database both read to
 * decide what this person may do.
 */
export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  /** set when this person also takes appointments */
  providerId?: string;
  title: string;
}

export interface WorkingHours {
  /** 1 = Monday ... 7 = Sunday (ISO) */
  weekday: number;
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface Provider {
  id: string;
  name: string;
  title: string;
  verticals: Vertical[];
  hours: WorkingHours[];
  /** CSS custom-property suffix used for the provider's calendar tint */
  tint: "teal" | "amber" | "violet";
}

/** A note on the record. `label` is the clinic's own heading for it, so a note
 *  can be a named category ("Ankth nga shpimi", "Mjekim kronik") rather than
 *  one anonymous blob of text per patient. */
export interface PatientNote {
  id: string;
  label?: string;
  body: string;
  /** provider who wrote it; absent for notes taken at reception */
  authorId?: string;
  createdAt: string;
  /** pinned notes sort first and are the ones a clinician sees at a glance */
  pinned?: boolean;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // E.164, used for wa.me links
  lang: Lang | "it";
  city: string;
  /** Full date, "yyyy-MM-dd". Age is derived, never stored, so it cannot go
   *  stale, and the day is needed for birthday greetings and for telling two
   *  patients of the same name apart. */
  birthDate: string;
  /** Free text, one per line in the UI. Safety-critical, so it is rendered
   *  before anything else on the record rather than inside a notes list. */
  allergies: string[];
  contactConsent: boolean;
  isTraveller: boolean;
  notes: PatientNote[];
  createdAt: string;
}

export interface Treatment {
  id: string;
  name: { sq: string; en: string };
  vertical: Vertical;
  minutes: number;
  price: number; // ALL
  protocolId?: string;
}

/** How often a step recurs after its first occurrence. A monthly maintenance
 *  step is `{ everyDays: 30, times: 6 }`: six visits, the first at
 *  `offsetDays` and one every thirty days after it. */
export interface StepRepeat {
  everyDays: number;
  /** total occurrences, counting the first */
  times: number;
}

export interface ProtocolStep {
  id: string;
  offsetDays: number;
  label: { sq: string; en: string; it: string };
  /** which WhatsApp template renders this step's message */
  template: "followup";
  /** absent for a one-off step */
  repeat?: StepRepeat;
}

export interface Protocol {
  id: string;
  name: { sq: string; en: string };
  treatmentIds: string[];
  steps: ProtocolStep[];
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  treatmentIds: string[];
  start: string; // ISO
  end: string; // ISO
  status: AppointmentStatus;
  confirmation: Confirmation;
  note?: string;
  /** set when the appointment was created to serve a follow-up */
  followUpId?: string;
  /** set when the appointment was created from a recommendation */
  recommendationId?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  providerId: string;
  date: string; // ISO
  treatmentIds: string[];
  note?: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  visitId: string;
  protocolId: string;
  stepId: string;
  dueDate: string; // ISO date
  status: FollowUpStatus;
  /** 1-based position in the step's series; 1 for a one-off step */
  occurrence: number;
  /** how many occurrences the series has in total; 1 for a one-off step */
  seriesLength: number;
  snoozeUntil?: string;
  appointmentId?: string;
  lastMessageId?: string;
}

/** What the clinician thinks the patient should still have done. Separate from
 *  a follow-up: a follow-up is the protocol running on its own schedule, a
 *  recommendation is a judgement someone made about this patient. */
export type RecommendationStatus = "proposed" | "accepted" | "declined" | "done";

export interface Recommendation {
  id: string;
  patientId: string;
  providerId: string;
  treatmentIds: string[];
  note?: string;
  /** how soon the clinician thinks it should happen; free text is deliberate,
   *  a recommendation is advice and not a scheduled obligation */
  urgency?: "soon" | "routine" | "watch";
  status: RecommendationStatus;
  createdAt: string;
  appointmentId?: string;
}

export type BenefitKind = "discount" | "gift";

/** A discount or a gift the clinic gave this patient. This is a record of the
 *  decision, not an accounting entry — the invoice itself lives in the
 *  clinic's finance app (see the finance adapter in the build plan). */
export interface Benefit {
  id: string;
  patientId: string;
  kind: BenefitKind;
  label: string;
  /** percentage off, when that is how it was given */
  percent?: number;
  /** fixed value in ALL: the amount taken off, or what the gift is worth */
  amount?: number;
  /** the treatment it applies to, when it applies to one */
  treatmentId?: string;
  reason?: string;
  grantedBy: string; // provider id
  createdAt: string;
  expiresAt?: string;
  usedAt?: string;
}

export interface Message {
  id: string;
  patientId: string;
  channel: "whatsapp";
  template: TemplateKey;
  body: string;
  createdAt: string;
  sentAt?: string;
  appointmentId?: string;
  followUpId?: string;
  token?: string;
}

export type TemplateKey =
  | "booking_confirm"
  | "reminder_48h"
  | "reminder_3h"
  | "followup"
  | "reschedule";

export interface MessageTemplate {
  key: TemplateKey;
  name: { sq: string; en: string };
  /** per patient language; {{placeholders}} resolved by renderTemplate */
  body: Record<Lang | "it", string>;
}

export interface ConfirmToken {
  token: string;
  purpose: TokenPurpose;
  targetId: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  /** what the patient chose */
  outcome?: "confirmed" | "reschedule";
}

export interface Clinic {
  name: string;
  address: string;
  phone: string;
}

export interface DemoState {
  /** the demo clock; every "due"/"today" computation reads this, never Date.now() */
  now: string;
  lang: Lang;
  clinic: Clinic;
  staff: StaffMember[];
  /** who the demo is currently being viewed as */
  currentStaffId: string;
  /**
   * Edits to the role map made while designing. The demo reads these; the
   * database does not, and never will — a real change is a migration. They are
   * here so the question "what should reception be able to see?" can be
   * answered by looking rather than by imagining.
   */
  permissionOverrides: Partial<Record<Role, Permission[]>>;
  providers: Provider[];
  patients: Patient[];
  treatments: Treatment[];
  protocols: Protocol[];
  appointments: Appointment[];
  visits: Visit[];
  followUps: FollowUp[];
  recommendations: Recommendation[];
  benefits: Benefit[];
  messages: Message[];
  tokens: ConfirmToken[];
  templates: MessageTemplate[];
}
