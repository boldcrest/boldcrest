"use client";

import { CheckCircle, Clock, PaperPlaneTilt, Prohibit, SealCheck, UserCheck, Warning, CalendarCheck, HourglassMedium } from "@phosphor-icons/react";
import { Pill, type Tone } from "./ui";
import { useDemo } from "@/lib/demo/store";
import type { AppointmentStatus, Confirmation, FollowUpStatus } from "@/lib/demo/types";

const ICON = 12;

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useDemo();
  const map: Record<AppointmentStatus, { tone: Tone; icon: React.ReactNode }> = {
    scheduled: { tone: "neutral", icon: <Clock size={ICON} weight="bold" /> },
    arrived: { tone: "accent", icon: <UserCheck size={ICON} weight="bold" /> },
    completed: { tone: "ok", icon: <CheckCircle size={ICON} weight="bold" /> },
    noshow: { tone: "danger", icon: <Prohibit size={ICON} weight="bold" /> },
    cancelled: { tone: "neutral", icon: <Prohibit size={ICON} weight="bold" /> },
  };
  return (
    <Pill tone={map[status].tone} icon={map[status].icon}>
      {t.status[status]}
    </Pill>
  );
}

export function ConfirmationBadge({ confirmation }: { confirmation: Confirmation }) {
  const { t } = useDemo();
  const map: Record<Confirmation, { tone: Tone; icon: React.ReactNode }> = {
    pending: { tone: "warn", icon: <Warning size={ICON} weight="bold" /> },
    sent: { tone: "accent", icon: <PaperPlaneTilt size={ICON} weight="bold" /> },
    confirmed: { tone: "ok", icon: <SealCheck size={ICON} weight="bold" /> },
    reschedule: { tone: "danger", icon: <HourglassMedium size={ICON} weight="bold" /> },
  };
  return (
    <Pill tone={map[confirmation].tone} icon={map[confirmation].icon}>
      {t.confirmation[confirmation]}
    </Pill>
  );
}

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  const { t } = useDemo();
  const map: Record<FollowUpStatus, { tone: Tone; icon: React.ReactNode }> = {
    due: { tone: "warn", icon: <Clock size={ICON} weight="bold" /> },
    sent: { tone: "accent", icon: <PaperPlaneTilt size={ICON} weight="bold" /> },
    confirmed: { tone: "ok", icon: <SealCheck size={ICON} weight="bold" /> },
    declined: { tone: "neutral", icon: <Prohibit size={ICON} weight="bold" /> },
    booked: { tone: "ok", icon: <CalendarCheck size={ICON} weight="bold" /> },
    done: { tone: "neutral", icon: <CheckCircle size={ICON} weight="bold" /> },
    snoozed: { tone: "neutral", icon: <HourglassMedium size={ICON} weight="bold" /> },
  };
  return (
    <Pill tone={map[status].tone} icon={map[status].icon}>
      {t.fu[status]}
    </Pill>
  );
}
