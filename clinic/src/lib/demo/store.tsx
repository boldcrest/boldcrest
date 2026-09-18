"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { addDays, addMinutes, startOfDay } from "date-fns";
import { buildSeed } from "./seed";
import { followUpsForVisit } from "../protocols";
import { makeToken } from "../whatsapp";
import { dictionaries, type Dict } from "../i18n";
import type {
  Appointment,
  DemoState,
  FollowUp,
  Lang,
  Message,
  Patient,
  TemplateKey,
  Visit,
} from "./types";

const STORAGE_KEY = "arnika.demo.v1";

type Action =
  | { type: "hydrate"; state: DemoState }
  | { type: "reset" }
  | { type: "setLang"; lang: Lang }
  | { type: "advanceDays"; days: number }
  | { type: "addPatient"; patient: Patient }
  | { type: "addAppointment"; appointment: Appointment }
  | { type: "patchAppointment"; id: string; patch: Partial<Appointment> }
  | { type: "logVisit"; visit: Visit; followUps: FollowUp[] }
  | { type: "addMessage"; message: Message; token?: DemoState["tokens"][number] }
  | { type: "markMessageSent"; id: string }
  | { type: "patchFollowUp"; id: string; patch: Partial<FollowUp> }
  | { type: "useToken"; token: string; outcome: "confirmed" | "reschedule" };

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "reset":
      return buildSeed(startOfDay(new Date()));
    case "setLang":
      return { ...state, lang: action.lang };
    case "advanceDays":
      return { ...state, now: addDays(new Date(state.now), action.days).toISOString() };
    case "addPatient":
      return { ...state, patients: [action.patient, ...state.patients] };
    case "addAppointment":
      return { ...state, appointments: [...state.appointments, action.appointment] };
    case "patchAppointment":
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a,
        ),
      };
    case "logVisit":
      return {
        ...state,
        visits: [...state.visits, action.visit],
        followUps: [...state.followUps, ...action.followUps],
      };
    case "addMessage":
      return {
        ...state,
        messages: [...state.messages, action.message],
        tokens: action.token ? [...state.tokens, action.token] : state.tokens,
      };
    case "markMessageSent":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, sentAt: new Date(state.now).toISOString() } : m,
        ),
      };
    case "patchFollowUp":
      return {
        ...state,
        followUps: state.followUps.map((f) =>
          f.id === action.id ? { ...f, ...action.patch } : f,
        ),
      };
    case "useToken": {
      const token = state.tokens.find((t) => t.token === action.token);
      if (!token || token.usedAt) return state;
      const usedAt = new Date().toISOString();
      const tokens = state.tokens.map((t) =>
        t.token === action.token ? { ...t, usedAt, outcome: action.outcome } : t,
      );
      if (token.purpose === "appointment") {
        return {
          ...state,
          tokens,
          appointments: state.appointments.map((a) =>
            a.id === token.targetId
              ? { ...a, confirmation: action.outcome === "confirmed" ? "confirmed" : "reschedule" }
              : a,
          ),
        };
      }
      return {
        ...state,
        tokens,
        followUps: state.followUps.map((f) =>
          f.id === token.targetId
            ? { ...f, status: action.outcome === "confirmed" ? "confirmed" : "declined" }
            : f,
        ),
      };
    }
    default:
      return state;
  }
}

export function readStoredState(): DemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoState) : null;
  } catch {
    return null;
  }
}

export function writeStoredState(state: DemoState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or full quota: the demo still works in memory */
  }
}

interface DemoContextValue {
  state: DemoState;
  ready: boolean;
  now: Date;
  t: Dict;
  dispatch: (action: Action) => void;
  actions: ReturnType<typeof buildActions>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function buildActions(state: DemoState, dispatch: (a: Action) => void) {
  const now = () => new Date(state.now);

  return {
    setLang: (lang: Lang) => dispatch({ type: "setLang", lang }),
    advanceDays: (days: number) => dispatch({ type: "advanceDays", days }),
    reset: () => dispatch({ type: "reset" }),

    addPatient: (input: Omit<Patient, "id" | "createdAt">) => {
      const patient: Patient = {
        ...input,
        id: `pa-${makeToken().slice(0, 6)}`,
        createdAt: now().toISOString().slice(0, 10),
      };
      dispatch({ type: "addPatient", patient });
      return patient;
    },

    bookAppointment: (input: {
      patientId: string;
      providerId: string;
      treatmentIds: string[];
      start: Date;
      note?: string;
      followUpId?: string;
    }) => {
      const minutes = input.treatmentIds.reduce(
        (sum, id) => sum + (state.treatments.find((t) => t.id === id)?.minutes ?? 30),
        0,
      );
      const appointment: Appointment = {
        id: `ap-${makeToken().slice(0, 6)}`,
        patientId: input.patientId,
        providerId: input.providerId,
        treatmentIds: input.treatmentIds,
        start: input.start.toISOString(),
        end: addMinutes(input.start, minutes || 30).toISOString(),
        status: "scheduled",
        confirmation: "pending",
        note: input.note,
        followUpId: input.followUpId,
      };
      dispatch({ type: "addAppointment", appointment });
      if (input.followUpId) {
        dispatch({
          type: "patchFollowUp",
          id: input.followUpId,
          patch: { status: "booked", appointmentId: appointment.id },
        });
      }
      return appointment;
    },

    patchAppointment: (id: string, patch: Partial<Appointment>) =>
      dispatch({ type: "patchAppointment", id, patch }),

    logVisit: (input: {
      patientId: string;
      providerId: string;
      treatmentIds: string[];
      note?: string;
      appointmentId?: string;
    }) => {
      const visit: Visit = {
        id: `vi-${makeToken().slice(0, 6)}`,
        patientId: input.patientId,
        providerId: input.providerId,
        date: now().toISOString(),
        treatmentIds: input.treatmentIds,
        note: input.note,
      };
      const followUps = followUpsForVisit(visit, state.protocols, state.treatments);
      dispatch({ type: "logVisit", visit, followUps });
      if (input.appointmentId) {
        dispatch({
          type: "patchAppointment",
          id: input.appointmentId,
          patch: { status: "completed" },
        });
      }
      return { visit, followUps };
    },

    /** Creates the message plus, when the template carries a link, its single-use token. */
    createMessage: (input: {
      patientId: string;
      template: TemplateKey;
      body: string;
      appointmentId?: string;
      followUpId?: string;
      token?: string;
      tokenPurpose?: "appointment" | "followup";
      tokenTargetId?: string;
    }) => {
      const message: Message = {
        id: `ms-${makeToken().slice(0, 6)}`,
        patientId: input.patientId,
        channel: "whatsapp",
        template: input.template,
        body: input.body,
        createdAt: now().toISOString(),
        appointmentId: input.appointmentId,
        followUpId: input.followUpId,
        token: input.token,
      };
      const token =
        input.token && input.tokenPurpose && input.tokenTargetId
          ? {
              token: input.token,
              purpose: input.tokenPurpose,
              targetId: input.tokenTargetId,
              createdAt: now().toISOString(),
              expiresAt: addDays(now(), 7).toISOString(),
            }
          : undefined;
      dispatch({ type: "addMessage", message, token });
      return message;
    },

    markMessageSent: (id: string) => dispatch({ type: "markMessageSent", id }),
    patchFollowUp: (id: string, patch: Partial<FollowUp>) =>
      dispatch({ type: "patchFollowUp", id, patch }),
    snoozeFollowUp: (id: string) =>
      dispatch({
        type: "patchFollowUp",
        id,
        patch: {
          status: "snoozed",
          snoozeUntil: addDays(now(), 7).toISOString().slice(0, 10),
        },
      }),
  };
}

const subscribeNoop = () => () => {};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => buildSeed(startOfDay(new Date())));

  // False while rendering on the server and during hydration, true once mounted,
  // so the first client paint matches the server's.
  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  // Load persisted state after mount.
  useEffect(() => {
    const stored = readStoredState();
    if (stored) dispatch({ type: "hydrate", state: stored });
  }, []);

  // Skip the very first pass so the freshly built seed cannot overwrite a saved demo.
  const skipFirstWrite = useRef(true);
  useEffect(() => {
    if (skipFirstWrite.current) {
      skipFirstWrite.current = false;
      return;
    }
    writeStoredState(state);
  }, [state]);

  // The patient confirmation page runs in its own tab. This keeps the clinic view live.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        dispatch({ type: "hydrate", state: JSON.parse(event.newValue) as DemoState });
      } catch {
        /* ignore malformed payloads */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const actions = useMemo(() => buildActions(state, dispatch), [state]);
  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      ready,
      now: new Date(state.now),
      t: dictionaries[state.lang],
      dispatch,
      actions,
    }),
    [state, ready, actions],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

/** Convenience selectors. Kept out of components so pages stay about layout. */
export function useSelectors() {
  const { state, now } = useDemo();

  return useMemo(() => {
    const patientById = (id: string) => state.patients.find((p) => p.id === id);
    const providerById = (id: string) => state.providers.find((p) => p.id === id);
    const treatmentById = (id: string) => state.treatments.find((t) => t.id === id);
    const protocolById = (id: string) => state.protocols.find((p) => p.id === id);
    const visitById = (id: string) => state.visits.find((v) => v.id === id);

    return {
      patientById,
      providerById,
      treatmentById,
      protocolById,
      visitById,
      patientName: (id: string) => {
        const p = patientById(id);
        return p ? `${p.firstName} ${p.lastName}` : "";
      },
      treatmentNames: (ids: string[]) =>
        ids.map((id) => treatmentById(id)?.name[state.lang] ?? "").filter(Boolean),
      stepLabel: (protocolId: string, stepId: string) => {
        const step = protocolById(protocolId)?.steps.find((s) => s.id === stepId);
        return step?.label[state.lang] ?? "";
      },
      appointmentsOn: (day: Date) => {
        const key = startOfDay(day).toDateString();
        return state.appointments
          .filter((a) => new Date(a.start).toDateString() === key)
          .sort((a, b) => a.start.localeCompare(b.start));
      },
      messagesForPatient: (patientId: string) =>
        state.messages.filter((m) => m.patientId === patientId),
      now,
    };
  }, [state, now]);
}

export { STORAGE_KEY };
