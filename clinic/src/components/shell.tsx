"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  ArrowCounterClockwise,
  CalendarBlank,
  CaretDoubleRight,
  Gear,
  Moon,
  Repeat,
  SquaresFour,
  Sun,
  Users,
} from "@phosphor-icons/react";
import { IconButton, Pill, cx, useToast } from "./ui";
import { useDemo } from "@/lib/demo/store";
import { capitalizeFirst, formatDate, formatWeekday } from "@/lib/i18n";

const NAV = [
  { href: "/paneli", key: "dashboard", Icon: SquaresFour },
  { href: "/orari", key: "schedule", Icon: CalendarBlank },
  { href: "/pacientet", key: "patients", Icon: Users },
  { href: "/ndjekjet", key: "followups", Icon: Repeat },
  { href: "/cilesimet", key: "settings", Icon: Gear },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { t, state } = useDemo();

  return (
    <aside className="hidden w-64 shrink-0 flex-col px-3 py-4 lg:flex">
      <div className="flex items-center gap-3 px-3 py-3">
        <span className="grid size-9 place-items-center rounded-2xl bg-accent text-sm font-bold text-accent-fg">
          A
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">
            {state.clinic.name}
          </p>
          <p className="truncate text-[11px] text-ink-3">Tiranë</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 pt-4">
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex items-center gap-3 rounded-full py-2.5 pl-3.5 pr-4 text-sm transition-all duration-150",
                active
                  ? "bg-surface font-medium text-ink shadow-[var(--shadow-card)] dark:border dark:border-line"
                  : "text-ink-2 hover:bg-surface/60 hover:text-ink",
              )}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} className={active ? "text-accent" : undefined} />
              {t.nav[key]}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3">
        <p className="text-[11px] leading-relaxed text-ink-3">{t.clock.hint}</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useDemo();
  return (
    <nav className="flex gap-1.5 overflow-x-auto px-4 pb-1 pt-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV.map(({ href, key, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors",
              active
                ? "bg-surface font-medium text-ink shadow-[var(--shadow-card)] dark:border dark:border-line"
                : "text-ink-2",
            )}
          >
            <Icon
              size={16}
              weight={active ? "fill" : "regular"}
              className={active ? "text-accent" : undefined}
            />
            {t.nav[key]}
          </Link>
        );
      })}
    </nav>
  );
}

const THEME_EVENT = "arnika:theme";

/** The document class is set by the blocking script in the layout, so it is the
 *  source of truth here. No effect, no flash of the wrong theme. */
function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    try {
      window.localStorage.setItem("arnika.theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable: the choice simply will not persist */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <IconButton onClick={toggle} aria-label="Theme">
      {dark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
    </IconButton>
  );
}

export function Topbar() {
  const { t, state, now, actions } = useDemo();
  const toast = useToast();

  return (
    <header className="sticky top-0 z-30 flex h-auto flex-wrap items-center gap-x-3 gap-y-2 bg-bg/80 px-4 py-3 backdrop-blur-xl sm:h-18 sm:flex-nowrap sm:py-0 sm:px-7">
      <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
        <div className="flex items-center gap-2.5">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">
            <span>{capitalizeFirst(formatWeekday(now, state.lang))}</span>
            {", "}
            {formatDate(now, state.lang)}
          </p>
          <Pill tone="lime">{t.demoBadge}</Pill>
        </div>
        <p className="truncate text-[11px] text-ink-3">{t.clock.label}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* The demo clock: one white capsule holding both jumps and the reset. */}
        <div className="flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-[var(--shadow-card)] dark:border dark:border-line">
          <button
            onClick={() => actions.advanceDays(1)}
            className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <CaretDoubleRight size={13} weight="bold" />
            <span className="hidden sm:inline">{t.clock.advanceDay}</span>
            <span className="sm:hidden">+1</span>
          </button>
          <button
            onClick={() => actions.advanceDays(7)}
            className="h-7 rounded-full px-2.5 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <span className="hidden sm:inline">{t.clock.advanceWeek}</span>
            <span className="sm:hidden">+7</span>
          </button>
          <button
            onClick={() => {
              actions.reset();
              toast.push(t.toast.reset);
            }}
            aria-label={t.clock.reset}
            title={t.clock.reset}
            className="grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
          </button>
        </div>

        <div className="flex items-center rounded-full bg-surface p-1 shadow-[var(--shadow-card)] dark:border dark:border-line">
          {(["sq", "en"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => actions.setLang(lang)}
              className={cx(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors",
                state.lang === lang
                  ? "bg-ink text-bg"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {lang}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
          {title}
        </h1>
        {children}
      </div>
      {action}
    </div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
