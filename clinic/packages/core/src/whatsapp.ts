import { differenceInCalendarDays } from "date-fns";
import type { Appointment, Lang, Message, MessageTemplate, TemplateKey } from "./types";

/** Picks the message that is actually true for this appointment right now:
 *  same-day gets the "see you today" text, an unconfirmed future booking gets the
 *  confirmation request, everything else gets a dated reminder. */
export function reminderTemplateFor(appointment: Appointment, now: Date): TemplateKey {
  const days = differenceInCalendarDays(new Date(appointment.start), now);
  if (days <= 0) return "reminder_3h";
  if (appointment.confirmation === "pending") return "booking_confirm";
  return "reminder_48h";
}

export type TemplateVars = Partial<{
  patient: string;
  clinic: string;
  provider: string;
  date: string;
  time: string;
  address: string;
  treatment: string;
  step: string;
  link: string;
}>;

/** Resolves {{placeholders}}. Unknown keys collapse to an empty string rather than
 *  leaking "{{foo}}" into a message a patient would actually receive. */
export function renderTemplate(
  template: MessageTemplate,
  lang: Lang | "it",
  vars: TemplateVars,
): string {
  const body = template.body[lang] ?? template.body.en;
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key as keyof TemplateVars];
    return value ?? "";
  });
}

/** wa.me wants digits only, no plus sign, no spaces. */
export function waLink(phone: string, body: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

export function confirmUrl(token: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/konfirmo/${token}`;
}

export function makeToken(): string {
  const bytes = new Uint8Array(9);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

export function templateFor(templates: MessageTemplate[], key: TemplateKey): MessageTemplate {
  const found = templates.find((t) => t.key === key);
  if (!found) throw new Error(`Missing message template: ${key}`);
  return found;
}

export function isSent(message: Message): boolean {
  return Boolean(message.sentAt);
}
