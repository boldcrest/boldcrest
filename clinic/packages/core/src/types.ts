export type Lang = "sq" | "en";
export type Vertical = "dental" | "aesthetic";
export type StaffRole = "owner" | "clinician" | "reception";

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

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // E.164, used for wa.me links
  lang: Lang | "it";
  city: string;
  birthYear: number;
  contactConsent: boolean;
  isTraveller: boolean;
  note?: string;
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

export interface ProtocolStep {
  id: string;
  offsetDays: number;
  label: { sq: string; en: string; it: string };
  /** which WhatsApp template renders this step's message */
  template: "followup";
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
  snoozeUntil?: string;
  appointmentId?: string;
  lastMessageId?: string;
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
  providers: Provider[];
  patients: Patient[];
  treatments: Treatment[];
  protocols: Protocol[];
  appointments: Appointment[];
  visits: Visit[];
  followUps: FollowUp[];
  messages: Message[];
  tokens: ConfirmToken[];
  templates: MessageTemplate[];
}
