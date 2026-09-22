import { addDays, addMinutes, format, setHours, setMinutes, startOfDay } from "date-fns";
import { followUpsForVisit } from "@clinic/core";
import type {
  Appointment,
  Benefit,
  DemoState,
  FollowUp,
  MessageTemplate,
  Patient,
  Protocol,
  Provider,
  Recommendation,
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
  { id: "t-laser", name: { sq: "Depilim me lazer", en: "Laser hair removal" }, vertical: "aesthetic", minutes: 30, price: 6000, protocolId: "p-lazer" },
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
      // Every six months, four times over: the recall that keeps a clinic alive.
      { id: "s-hig-1", offsetDays: 180, label: { sq: "kontrolli periodik", en: "periodic check-up", it: "controllo periodico" }, template: "followup", repeat: { everyDays: 180, times: 4 } },
    ],
  },
  {
    id: "p-mezo",
    name: { sq: "Protokolli i mezoterapisë", en: "Mesotherapy protocol" },
    treatmentIds: ["t-mezo"],
    steps: [
      { id: "s-mezo-1", offsetDays: 21, label: { sq: "seanca e radhës", en: "next session", it: "seduta successiva" }, template: "followup", repeat: { everyDays: 21, times: 4 } },
    ],
  },
  {
    id: "p-lazer",
    name: { sq: "Kursi i depilimit me lazer", en: "Laser hair removal course" },
    treatmentIds: ["t-laser"],
    steps: [
      // The monthly course: one session a month, six in all.
      { id: "s-laz-1", offsetDays: 30, label: { sq: "seanca e radhës e lazerit", en: "next laser session", it: "prossima seduta laser" }, template: "followup", repeat: { everyDays: 30, times: 6 } },
    ],
  },
];

/**
 * Patients are built from the demo clock so one of them always has a birthday
 * a few days out — otherwise the birthday marker on the record would only ever
 * be visible by luck.
 */
function buildPatients(base: Date): Patient[] {
  const soon = addDays(startOfDay(base), 3);
  const adaBirthday = `1997-${String(soon.getMonth() + 1).padStart(2, "0")}-${String(soon.getDate()).padStart(2, "0")}`;

  return [
    { id: "pa-arta", firstName: "Arta", lastName: "Hoxha", phone: "+355692418736", lang: "sq", city: "Tiranë", birthDate: "1991-04-17", allergies: [], contactConsent: true, isTraveller: false, notes: [], createdAt: "2024-03-14" },
    {
      id: "pa-ledio", firstName: "Ledio", lastName: "Çela", phone: "+355684937215", lang: "sq", city: "Tiranë", birthDate: "1986-11-08",
      allergies: ["Penicilinë"], contactConsent: true, isTraveller: false,
      notes: [
        { id: "no-ledio-1", label: "Mjekim kronik", body: "Merr antikoagulant. Kërkon konsultë me mjekun e familjes përpara nxjerrjes së dhëmbit.", authorId: "prov-zeqiri", createdAt: "2024-02-11", pinned: true },
      ],
      createdAt: "2023-11-02",
    },
    { id: "pa-marsida", firstName: "Marsida", lastName: "Kola", phone: "+355697142893", lang: "sq", city: "Tiranë", birthDate: "1995-06-30", allergies: [], contactConsent: true, isTraveller: false, notes: [], createdAt: "2025-01-21" },
    { id: "pa-endrit", firstName: "Endrit", lastName: "Basha", phone: "+355693825471", lang: "sq", city: "Durrës", birthDate: "1979-02-11", allergies: ["Lateks"], contactConsent: true, isTraveller: false, notes: [], createdAt: "2024-06-08" },
    { id: "pa-rezarta", firstName: "Rezarta", lastName: "Dushku", phone: "+355684172935", lang: "sq", city: "Tiranë", birthDate: "1988-09-25", allergies: [], contactConsent: true, isTraveller: false, notes: [], createdAt: "2024-09-30" },
    {
      id: "pa-klodian", firstName: "Klodian", lastName: "Meta", phone: "+355692763418", lang: "sq", city: "Tiranë", birthDate: "1972-12-04",
      allergies: [], contactConsent: false, isTraveller: false,
      notes: [{ id: "no-klodian-1", body: "Nuk pranon mesazhe promocionale. Vetëm telefonatë për kontrollin periodik.", createdAt: "2023-05-17" }],
      createdAt: "2023-05-17",
    },
    { id: "pa-sara", firstName: "Sara", lastName: "Ndoja", phone: "+355697384162", lang: "sq", city: "Tiranë", birthDate: "1999-03-22", allergies: [], contactConsent: true, isTraveller: false, notes: [], createdAt: "2025-04-11" },
    { id: "pa-fatjon", firstName: "Fatjon", lastName: "Prifti", phone: "+355683915274", lang: "sq", city: "Vlorë", birthDate: "1983-07-19", allergies: ["Ibuprofen"], contactConsent: true, isTraveller: false, notes: [], createdAt: "2024-12-03" },
    { id: "pa-elona", firstName: "Elona", lastName: "Zeka", phone: "+355694281637", lang: "sq", city: "Tiranë", birthDate: "1993-10-05", allergies: [], contactConsent: true, isTraveller: false, notes: [], createdAt: "2025-02-19" },
    {
      id: "pa-giulia", firstName: "Giulia", lastName: "Ferraro", phone: "+393478192645", lang: "it", city: "Bari", birthDate: "1984-05-14",
      allergies: [], contactConsent: true, isTraveller: true,
      notes: [
        { id: "no-giulia-1", label: "Plan udhëtimi", body: "Plan implanti me dy udhëtime. Fluturimi i kthimit, e diel.", authorId: "prov-zeqiri", createdAt: "2025-06-02", pinned: true },
      ],
      createdAt: "2025-06-02",
    },
    { id: "pa-marco", firstName: "Marco", lastName: "Bellini", phone: "+393356472819", lang: "it", city: "Milano", birthDate: "1976-08-02", allergies: [], contactConsent: true, isTraveller: true, notes: [], createdAt: "2025-05-26" },
    { id: "pa-sophie", firstName: "Sophie", lastName: "Hargreaves", phone: "+447712489365", lang: "en", city: "Manchester", birthDate: "1990-01-26", allergies: [], contactConsent: true, isTraveller: true, notes: [], createdAt: "2025-07-15" },
    {
      id: "pa-gentian", firstName: "Gentian", lastName: "Malaj", phone: "+355692184735", lang: "sq", city: "Tiranë", birthDate: "1968-04-09",
      allergies: ["Adrenalinë në anestezi lokale"], contactConsent: true, isTraveller: false,
      notes: [
        { id: "no-gentian-1", label: "Presion i lartë", body: "Hipertension nën mjekim. Anestezi pa adrenalinë.", authorId: "prov-tafani", createdAt: "2022-10-09", pinned: true },
        { id: "no-gentian-2", body: "Preferon terminet në mëngjes.", createdAt: "2024-01-30" },
      ],
      createdAt: "2022-10-09",
    },
    { id: "pa-ada", firstName: "Ada", lastName: "Vokshi", phone: "+355685739142", lang: "sq", city: "Tiranë", birthDate: adaBirthday, allergies: [], contactConsent: true, isTraveller: false, notes: [], createdAt: "2025-08-04" },
  ];
}

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
    appointment("ap-p7", "pa-ada", "prov-nushi", ["t-laser"], at(today, -95, 11, 0), "completed", "confirmed"),
  ];

  const visits: Visit[] = [
    { id: "vi-1", patientId: "pa-arta", providerId: "prov-zeqiri", date: at(today, 0, 9, 0).toISOString(), treatmentIds: ["t-kontroll"], note: "Higjienë e mirë. Pa karies." },
    { id: "vi-p1", patientId: "pa-marco", providerId: "prov-zeqiri", date: at(today, -125, 10, 0).toISOString(), treatmentIds: ["t-implant"], note: "Implant në pozicionin 36. Shërim normal." },
    { id: "vi-p2", patientId: "pa-arta", providerId: "prov-nushi", date: at(today, -14, 15, 0).toISOString(), treatmentIds: ["t-buze"], note: "1 ml acid hialuronik. Pa reaksion." },
    { id: "vi-p3", patientId: "pa-klodian", providerId: "prov-zeqiri", date: at(today, -186, 9, 0).toISOString(), treatmentIds: ["t-kontroll"] },
    { id: "vi-p4", patientId: "pa-elona", providerId: "prov-nushi", date: at(today, -18, 16, 0).toISOString(), treatmentIds: ["t-mezo"], note: "Seanca 1 nga 4." },
    { id: "vi-p5", patientId: "pa-giulia", providerId: "prov-zeqiri", date: at(today, -9, 12, 0).toISOString(), treatmentIds: ["t-implant"], note: "Implant 46. Kontroll shërimi pas 10 ditësh." },
    { id: "vi-p6", patientId: "pa-rezarta", providerId: "prov-nushi", date: at(today, -15, 14, 0).toISOString(), treatmentIds: ["t-faqe"], note: "0.8 ml për faqe." },
    { id: "vi-p7", patientId: "pa-ada", providerId: "prov-nushi", date: at(today, -95, 11, 0).toISOString(), treatmentIds: ["t-laser"], note: "Kursi i lazerit, seanca e parë. Gjashtë seanca, një në muaj." },
  ];

  // Generated by the same function the app calls when a visit is logged, so a
  // seeded follow-up can never drift out of step with its protocol: change an
  // offset or a cadence and the demo data follows. Only the status history is
  // written by hand.
  const history: Record<string, Partial<FollowUp>> = {
    // Marco: implant stage 2 is five days overdue and he has been messaged once.
    "fu-vi-p1-s-impl-1": { status: "done" },
    "fu-vi-p1-s-impl-2": { status: "sent" },
    // Rezarta said yes to the filler review; it is waiting to be booked.
    "fu-vi-p6-s-mb-1": { status: "confirmed" },
    // Ada is three sessions into the six-session laser course, and the third
    // is five days late. This is the recurring case: one row in the work list,
    // "session 3 of 6", with the rest queued behind it.
    "fu-vi-p7-s-laz-1-1": { status: "done" },
    "fu-vi-p7-s-laz-1-2": { status: "done" },
    "fu-vi-p7-s-laz-1-3": { status: "sent" },
  };

  const followUps: FollowUp[] = visits
    .flatMap((visit) => followUpsForVisit(visit, protocols, treatments))
    .map((followUp) => ({ ...followUp, ...history[followUp.id] }));

  const recommendations: Recommendation[] = [
    { id: "re-1", patientId: "pa-ledio", providerId: "prov-zeqiri", treatmentIds: ["t-kurore"], note: "Dhëmbi 26 me mbushje të madhe. Kurora do ta mbante.", urgency: "soon", status: "accepted", createdAt: iso(addDays(today, -6)) },
    { id: "re-2", patientId: "pa-arta", providerId: "prov-nushi", treatmentIds: ["t-zbardhim"], note: "E përmendi vetë pas pastrimit.", urgency: "routine", status: "proposed", createdAt: iso(addDays(today, -2)) },
    { id: "re-3", patientId: "pa-giulia", providerId: "prov-zeqiri", treatmentIds: ["t-kurore"], note: "Kurora mbi implantin, në udhëtimin e dytë.", urgency: "soon", status: "accepted", createdAt: iso(addDays(today, -9)) },
    { id: "re-4", patientId: "pa-gentian", providerId: "prov-tafani", treatmentIds: ["t-kontroll"], note: "Nuk ka bërë kontroll prej dy vitesh.", urgency: "routine", status: "declined", createdAt: iso(addDays(today, -40)) },
    { id: "re-5", patientId: "pa-marsida", providerId: "prov-nushi", treatmentIds: ["t-mezo"], note: "Lëkurë e thatë. Kurs mezoterapie do të ndihmonte.", urgency: "watch", status: "proposed", createdAt: iso(addDays(today, -1)) },
    { id: "re-6", patientId: "pa-endrit", providerId: "prov-zeqiri", treatmentIds: ["t-mbushje", "t-kontroll"], note: "Karies fillestar në 36. U krye në vizitën e kaluar.", urgency: "routine", status: "done", createdAt: iso(addDays(today, -70)) },
  ];

  const benefits: Benefit[] = [
    { id: "be-1", patientId: "pa-arta", kind: "discount", label: "Zbritje për rekomandim", percent: 20, treatmentId: "t-zbardhim", reason: "Rekomandoi dy paciente.", grantedBy: "prov-nushi", createdAt: iso(addDays(today, -2)), expiresAt: iso(addDays(today, 60)) },
    { id: "be-2", patientId: "pa-klodian", kind: "gift", label: "Pastrim dhëmbësh falas", amount: 4000, reason: "Pacient prej dhjetë vitesh.", grantedBy: "prov-zeqiri", createdAt: iso(addDays(today, -6)), expiresAt: iso(addDays(today, 24)) },
    { id: "be-3", patientId: "pa-ada", kind: "gift", label: "Seanca e gjashtë e lazerit falas", amount: 6000, reason: "Paketa e kursit.", grantedBy: "prov-nushi", createdAt: iso(addDays(today, -95)) },
    { id: "be-4", patientId: "pa-giulia", kind: "discount", label: "Paketë turizmi dentar", amount: 5000, treatmentId: "t-implant", reason: "Dy udhëtime në një plan.", grantedBy: "prov-zeqiri", createdAt: iso(addDays(today, -30)), usedAt: iso(addDays(today, -9)) },
    { id: "be-5", patientId: "pa-endrit", kind: "discount", label: "Zbritje familjare", percent: 10, reason: "Bashkëshortja pacientja e klinikës.", grantedBy: "prov-zeqiri", createdAt: iso(addDays(today, -80)), expiresAt: iso(addDays(today, -10)) },
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
    patients: buildPatients(base),
    treatments,
    protocols,
    appointments,
    visits,
    followUps,
    recommendations,
    benefits,
    messages: [],
    tokens: [],
    templates,
  };
}

export { providers, treatments, protocols, buildPatients };
