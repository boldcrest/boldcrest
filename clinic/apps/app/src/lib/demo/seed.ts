import { addDays, addMinutes, format, setHours, setMinutes, startOfDay } from "date-fns";
import type {
  Appointment,
  DemoState,
  FollowUp,
  MessageTemplate,
  Patient,
  Protocol,
  Provider,
  Treatment,
  Visit,
} from "./types";

const WEEKDAYS_FULL = [1, 2, 3, 4, 5];

const providers: Provider[] = [
  {
    id: "prov-zeqiri",
    name: "Dr. Ilir Zeqiri",
    title: "Stomatolog",
    verticals: ["dental"],
    tint: "teal",
    hours: [
      ...WEEKDAYS_FULL.map((weekday) => ({ weekday, start: "09:00", end: "17:00" })),
      { weekday: 6, start: "09:00", end: "13:00" },
    ],
  },
  {
    id: "prov-nushi",
    name: "Dr. Elda Nushi",
    title: "Dermatologe",
    verticals: ["aesthetic"],
    tint: "violet",
    hours: [2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      start: weekday === 6 ? "10:00" : "11:00",
      end: weekday === 6 ? "14:00" : "19:00",
    })),
  },
  {
    id: "prov-tafani",
    name: "Dr. Rea Tafani",
    title: "Stomatologe",
    verticals: ["dental"],
    tint: "amber",
    hours: WEEKDAYS_FULL.map((weekday) => ({ weekday, start: "10:00", end: "18:00" })),
  },
];

const treatments: Treatment[] = [
  { id: "t-kontroll", name: { sq: "Kontroll dhe pastrim", en: "Check-up and cleaning" }, vertical: "dental", minutes: 45, price: 4000, protocolId: "p-higjiena" },
  { id: "t-mbushje", name: { sq: "Mbushje kompozite", en: "Composite filling" }, vertical: "dental", minutes: 60, price: 6000 },
  { id: "t-implant", name: { sq: "Implant dentar, faza 1", en: "Dental implant, stage 1" }, vertical: "dental", minutes: 90, price: 45000, protocolId: "p-implanti" },
  { id: "t-kurore", name: { sq: "Kurorë zirkoni", en: "Zirconia crown" }, vertical: "dental", minutes: 60, price: 25000 },
  { id: "t-zbardhim", name: { sq: "Zbardhim dhëmbësh", en: "Teeth whitening" }, vertical: "dental", minutes: 60, price: 18000 },
  { id: "t-heqje", name: { sq: "Heqje dhëmbi", en: "Tooth extraction" }, vertical: "dental", minutes: 30, price: 5000 },
  { id: "t-buze", name: { sq: "Mbushës buzësh", en: "Lip filler" }, vertical: "aesthetic", minutes: 45, price: 20000, protocolId: "p-mbushesi" },
  { id: "t-faqe", name: { sq: "Mbushës faqesh", en: "Cheek filler" }, vertical: "aesthetic", minutes: 45, price: 25000, protocolId: "p-mbushesi" },
  { id: "t-mezo", name: { sq: "Mezoterapi fytyre", en: "Facial mesotherapy" }, vertical: "aesthetic", minutes: 45, price: 12000, protocolId: "p-mezo" },
  { id: "t-pastrim", name: { sq: "Pastrim fytyre", en: "Facial cleansing" }, vertical: "aesthetic", minutes: 60, price: 5000 },
  { id: "t-laser", name: { sq: "Depilim me lazer", en: "Laser hair removal" }, vertical: "aesthetic", minutes: 30, price: 6000 },
];

const protocols: Protocol[] = [
  {
    id: "p-implanti",
    name: { sq: "Protokolli i implantit", en: "Implant protocol" },
    treatmentIds: ["t-implant"],
    steps: [
      { id: "s-impl-1", offsetDays: 10, label: { sq: "kontrolli i shërimit", en: "healing check", it: "controllo della guarigione" }, template: "followup" },
      { id: "s-impl-2", offsetDays: 120, label: { sq: "faza 2 dhe kurora", en: "stage 2 and crown", it: "fase 2 e corona" }, template: "followup" },
    ],
  },
  {
    id: "p-mbushesi",
    name: { sq: "Protokolli i mbushësit", en: "Filler protocol" },
    treatmentIds: ["t-buze", "t-faqe"],
    steps: [
      { id: "s-mb-1", offsetDays: 14, label: { sq: "rivlerësimi pas mbushësit", en: "post-filler review", it: "controllo dopo il filler" }, template: "followup" },
      { id: "s-mb-2", offsetDays: 180, label: { sq: "rifreskimi i mbushësit", en: "filler top-up", it: "ritocco del filler" }, template: "followup" },
    ],
  },
  {
    id: "p-higjiena",
    name: { sq: "Protokolli i higjienës", en: "Hygiene protocol" },
    treatmentIds: ["t-kontroll"],
    steps: [
      { id: "s-hig-1", offsetDays: 180, label: { sq: "kontrolli periodik", en: "periodic check-up", it: "controllo periodico" }, template: "followup" },
    ],
  },
  {
    id: "p-mezo",
    name: { sq: "Protokolli i mezoterapisë", en: "Mesotherapy protocol" },
    treatmentIds: ["t-mezo"],
    steps: [
      { id: "s-mezo-1", offsetDays: 21, label: { sq: "seanca e radhës", en: "next session", it: "seduta successiva" }, template: "followup" },
    ],
  },
];

const patients: Patient[] = [
  { id: "pa-arta", firstName: "Arta", lastName: "Hoxha", phone: "+355692418736", lang: "sq", city: "Tiranë", birthYear: 1991, contactConsent: true, isTraveller: false, createdAt: "2024-03-14" },
  { id: "pa-ledio", firstName: "Ledio", lastName: "Çela", phone: "+355684937215", lang: "sq", city: "Tiranë", birthYear: 1986, contactConsent: true, isTraveller: false, createdAt: "2023-11-02" },
  { id: "pa-marsida", firstName: "Marsida", lastName: "Kola", phone: "+355697142893", lang: "sq", city: "Tiranë", birthYear: 1995, contactConsent: true, isTraveller: false, createdAt: "2025-01-21" },
  { id: "pa-endrit", firstName: "Endrit", lastName: "Basha", phone: "+355693825471", lang: "sq", city: "Durrës", birthYear: 1979, contactConsent: true, isTraveller: false, createdAt: "2024-06-08" },
  { id: "pa-rezarta", firstName: "Rezarta", lastName: "Dushku", phone: "+355684172935", lang: "sq", city: "Tiranë", birthYear: 1988, contactConsent: true, isTraveller: false, createdAt: "2024-09-30" },
  { id: "pa-klodian", firstName: "Klodian", lastName: "Meta", phone: "+355692763418", lang: "sq", city: "Tiranë", birthYear: 1972, contactConsent: false, isTraveller: false, note: "Nuk pranon mesazhe promocionale.", createdAt: "2023-05-17" },
  { id: "pa-sara", firstName: "Sara", lastName: "Ndoja", phone: "+355697384162", lang: "sq", city: "Tiranë", birthYear: 1999, contactConsent: true, isTraveller: false, createdAt: "2025-04-11" },
  { id: "pa-fatjon", firstName: "Fatjon", lastName: "Prifti", phone: "+355683915274", lang: "sq", city: "Vlorë", birthYear: 1983, contactConsent: true, isTraveller: false, createdAt: "2024-12-03" },
  { id: "pa-elona", firstName: "Elona", lastName: "Zeka", phone: "+355694281637", lang: "sq", city: "Tiranë", birthYear: 1993, contactConsent: true, isTraveller: false, createdAt: "2025-02-19" },
  { id: "pa-giulia", firstName: "Giulia", lastName: "Ferraro", phone: "+393478192645", lang: "it", city: "Bari", birthYear: 1984, contactConsent: true, isTraveller: true, note: "Plan implanti me dy udhëtime. Fluturimi kthimit, e diel.", createdAt: "2025-06-02" },
  { id: "pa-marco", firstName: "Marco", lastName: "Bellini", phone: "+393356472819", lang: "it", city: "Milano", birthYear: 1976, contactConsent: true, isTraveller: true, createdAt: "2025-05-26" },
  { id: "pa-sophie", firstName: "Sophie", lastName: "Hargreaves", phone: "+447712489365", lang: "en", city: "Manchester", birthYear: 1990, contactConsent: true, isTraveller: true, createdAt: "2025-07-15" },
  { id: "pa-gentian", firstName: "Gentian", lastName: "Malaj", phone: "+355692184735", lang: "sq", city: "Tiranë", birthYear: 1968, contactConsent: true, isTraveller: false, createdAt: "2022-10-09" },
  { id: "pa-ada", firstName: "Ada", lastName: "Vokshi", phone: "+355685739142", lang: "sq", city: "Tiranë", birthYear: 1997, contactConsent: true, isTraveller: false, createdAt: "2025-08-04" },
];

export const templates: MessageTemplate[] = [
  {
    key: "booking_confirm",
    name: { sq: "Konfirmim rezervimi", en: "Booking confirmation" },
    body: {
      sq: "Përshëndetje, {{patient}}. Termini juaj te {{clinic}} u caktua për {{date}}, ora {{time}}, me {{provider}}. Ju lutem konfirmoni këtu: {{link}}",
      it: "Buongiorno {{patient}}. Il suo appuntamento presso {{clinic}} è fissato per {{date}} alle {{time}} con {{provider}}. Confermi qui: {{link}}",
      en: "Hello {{patient}}. Your appointment at {{clinic}} is booked for {{date}} at {{time}} with {{provider}}. Please confirm here: {{link}}",
    },
  },
  {
    key: "reminder_48h",
    name: { sq: "Kujtesë termini", en: "Appointment reminder" },
    body: {
      sq: "Përshëndetje, {{patient}}. Ju kujtojmë terminin te {{clinic}} më {{date}}, ora {{time}}, me {{provider}}. Konfirmoni këtu: {{link}}",
      it: "Buongiorno {{patient}}. Le ricordiamo l'appuntamento presso {{clinic}} il {{date}} alle {{time}}, con {{provider}}. Confermi qui: {{link}}",
      en: "Hello {{patient}}. A reminder of your appointment at {{clinic}} on {{date}} at {{time}}, with {{provider}}. Confirm here: {{link}}",
    },
  },
  {
    key: "reminder_3h",
    name: { sq: "Kujtesë, 3 orë para", en: "Reminder, 3 hours before" },
    body: {
      sq: "{{patient}}, ju presim sot në orën {{time}} te {{clinic}}, {{address}}. Nëse nuk arrini dot, na shkruani këtu.",
      it: "{{patient}}, la aspettiamo oggi alle {{time}} presso {{clinic}}, {{address}}. Se non riesce ad arrivare, ci scriva qui.",
      en: "{{patient}}, we look forward to seeing you today at {{time}} at {{clinic}}, {{address}}. If you cannot make it, message us here.",
    },
  },
  {
    key: "followup",
    name: { sq: "Ndjekje trajtimi", en: "Treatment follow-up" },
    body: {
      sq: "Përshëndetje, {{patient}}. Hapi juaj i radhës: {{step}}. Dëshironi ta rezervojmë terminin? Konfirmoni këtu: {{link}}",
      it: "Buongiorno {{patient}}. Il suo prossimo passo: {{step}}. Desidera prenotare? Confermi qui: {{link}}",
      en: "Hello {{patient}}. Your next step: {{step}}. Would you like us to book it? Confirm here: {{link}}",
    },
  },
  {
    key: "reschedule",
    name: { sq: "Kërkesë për shtyrje", en: "Reschedule request" },
    body: {
      sq: "{{patient}}, morëm kërkesën tuaj për ndryshim termini. Ju kontaktojmë brenda ditës për të gjetur një orar të përshtatshëm.",
      it: "{{patient}}, abbiamo ricevuto la sua richiesta di spostare l'appuntamento. La contattiamo in giornata per trovare un nuovo orario.",
      en: "{{patient}}, we received your reschedule request. We will contact you today to find a new time.",
    },
  },
];

function at(base: Date, dayOffset: number, hour: number, minute = 0): Date {
  return setMinutes(setHours(startOfDay(addDays(base, dayOffset)), hour), minute);
}

function appointment(
  id: string,
  patientId: string,
  providerId: string,
  treatmentIds: string[],
  start: Date,
  status: Appointment["status"],
  confirmation: Appointment["confirmation"],
  note?: string,
): Appointment {
  const minutes = treatmentIds.reduce(
    (sum, tid) => sum + (treatments.find((t) => t.id === tid)?.minutes ?? 30),
    0,
  );
  return {
    id,
    patientId,
    providerId,
    treatmentIds,
    start: start.toISOString(),
    end: addMinutes(start, minutes).toISOString(),
    status,
    confirmation,
    note,
  };
}

/** Builds a fully-populated demo clinic relative to `base` (the demo "today"). */
export function buildSeed(base: Date): DemoState {
  const today = startOfDay(base);
  const iso = (d: Date) => format(d, "yyyy-MM-dd");

  const appointments: Appointment[] = [
    // today
    appointment("ap-1", "pa-arta", "prov-zeqiri", ["t-kontroll"], at(today, 0, 9, 0), "completed", "confirmed"),
    appointment("ap-2", "pa-ledio", "prov-zeqiri", ["t-mbushje"], at(today, 0, 10, 30), "arrived", "confirmed"),
    appointment("ap-3", "pa-giulia", "prov-zeqiri", ["t-implant"], at(today, 0, 12, 0), "scheduled", "confirmed", "Udhëtim nga Bari. Përkthim në italisht."),
    appointment("ap-4", "pa-sara", "prov-nushi", ["t-buze"], at(today, 0, 14, 0), "scheduled", "sent"),
    appointment("ap-5", "pa-elona", "prov-nushi", ["t-mezo"], at(today, 0, 16, 0), "scheduled", "pending"),
    appointment("ap-6", "pa-fatjon", "prov-tafani", ["t-heqje"], at(today, 0, 11, 0), "noshow", "pending"),
    // tomorrow
    appointment("ap-7", "pa-rezarta", "prov-tafani", ["t-zbardhim"], at(today, 1, 10, 0), "scheduled", "confirmed"),
    appointment("ap-8", "pa-endrit", "prov-zeqiri", ["t-kurore"], at(today, 1, 13, 0), "scheduled", "pending"),
    // in two days, the 48h reminder window
    appointment("ap-9", "pa-marsida", "prov-nushi", ["t-faqe"], at(today, 2, 15, 0), "scheduled", "pending"),
    appointment("ap-10", "pa-sophie", "prov-zeqiri", ["t-kontroll", "t-zbardhim"], at(today, 2, 9, 30), "scheduled", "pending", "Udhëtim nga Mançesteri."),
    appointment("ap-11", "pa-gentian", "prov-tafani", ["t-mbushje"], at(today, 3, 11, 30), "scheduled", "pending"),
    appointment("ap-12", "pa-ada", "prov-nushi", ["t-pastrim"], at(today, 4, 12, 0), "scheduled", "pending"),
    // past, completed
    appointment("ap-p1", "pa-marco", "prov-zeqiri", ["t-implant"], at(today, -125, 10, 0), "completed", "confirmed"),
    appointment("ap-p2", "pa-arta", "prov-nushi", ["t-buze"], at(today, -14, 15, 0), "completed", "confirmed"),
    appointment("ap-p3", "pa-klodian", "prov-zeqiri", ["t-kontroll"], at(today, -186, 9, 0), "completed", "confirmed"),
    appointment("ap-p4", "pa-elona", "prov-nushi", ["t-mezo"], at(today, -18, 16, 0), "completed", "confirmed"),
    appointment("ap-p5", "pa-giulia", "prov-zeqiri", ["t-implant"], at(today, -9, 12, 0), "completed", "confirmed"),
    appointment("ap-p6", "pa-rezarta", "prov-nushi", ["t-faqe"], at(today, -15, 14, 0), "completed", "confirmed"),
  ];

  const visits: Visit[] = [
    { id: "vi-1", patientId: "pa-arta", providerId: "prov-zeqiri", date: at(today, 0, 9, 0).toISOString(), treatmentIds: ["t-kontroll"], note: "Higjienë e mirë. Pa karies." },
    { id: "vi-p1", patientId: "pa-marco", providerId: "prov-zeqiri", date: at(today, -125, 10, 0).toISOString(), treatmentIds: ["t-implant"], note: "Implant në pozicionin 36. Shërim normal." },
    { id: "vi-p2", patientId: "pa-arta", providerId: "prov-nushi", date: at(today, -14, 15, 0).toISOString(), treatmentIds: ["t-buze"], note: "1 ml acid hialuronik. Pa reaksion." },
    { id: "vi-p3", patientId: "pa-klodian", providerId: "prov-zeqiri", date: at(today, -186, 9, 0).toISOString(), treatmentIds: ["t-kontroll"] },
    { id: "vi-p4", patientId: "pa-elona", providerId: "prov-nushi", date: at(today, -18, 16, 0).toISOString(), treatmentIds: ["t-mezo"], note: "Seanca 1 nga 4." },
    { id: "vi-p5", patientId: "pa-giulia", providerId: "prov-zeqiri", date: at(today, -9, 12, 0).toISOString(), treatmentIds: ["t-implant"], note: "Implant 46. Kontroll shërimi pas 10 ditësh." },
    { id: "vi-p6", patientId: "pa-rezarta", providerId: "prov-nushi", date: at(today, -15, 14, 0).toISOString(), treatmentIds: ["t-faqe"], note: "0.8 ml për faqe." },
  ];

  const followUps: FollowUp[] = [
    // overdue: Marco's implant stage 2, due 5 days ago
    { id: "fu-1", patientId: "pa-marco", visitId: "vi-p1", protocolId: "p-implanti", stepId: "s-impl-2", dueDate: iso(addDays(today, -5)), status: "sent" },
    // overdue: Klodian's hygiene recall, due 6 days ago, never contacted
    { id: "fu-2", patientId: "pa-klodian", visitId: "vi-p3", protocolId: "p-higjiena", stepId: "s-hig-1", dueDate: iso(addDays(today, -6)), status: "due" },
    // due today: Arta's filler review
    { id: "fu-3", patientId: "pa-arta", visitId: "vi-p2", protocolId: "p-mbushesi", stepId: "s-mb-1", dueDate: iso(today), status: "due" },
    // due tomorrow: Giulia's implant healing check
    { id: "fu-4", patientId: "pa-giulia", visitId: "vi-p5", protocolId: "p-implanti", stepId: "s-impl-1", dueDate: iso(addDays(today, 1)), status: "due" },
    // confirmed by the patient, waiting to be booked
    { id: "fu-5", patientId: "pa-rezarta", visitId: "vi-p6", protocolId: "p-mbushesi", stepId: "s-mb-1", dueDate: iso(addDays(today, -1)), status: "confirmed" },
    // upcoming
    { id: "fu-6", patientId: "pa-elona", visitId: "vi-p4", protocolId: "p-mezo", stepId: "s-mezo-1", dueDate: iso(addDays(today, 3)), status: "due" },
  ];

  return {
    now: base.toISOString(),
    lang: "sq",
    clinic: {
      name: "Klinika Arnika",
      address: "Rr. Sami Frashëri 24, Tiranë",
      phone: "+355692401187",
    },
    providers,
    patients,
    treatments,
    protocols,
    appointments,
    visits,
    followUps,
    messages: [],
    tokens: [],
    templates,
  };
}

export { providers, treatments, protocols, patients };
