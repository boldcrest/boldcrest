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
import { IconButton, cx, useToast } from "./ui";
import { useDemo } from "@/lib/demo/store";
import { capitalizeFirst, formatDate, formatWeekday } from "@/lib/i18n";

const NAV = [
  { href: "/paneli", key: "dashboard", Icon: SquaresFour },
  { href: "/orari", key: "schedule", Icon: CalendarBlank },
  { href: "/pacientet", key: "patients", Icon: Users },
  { href: "/ndjekjet", key: "followups", Icon: Repeat },
  { href: "/cilesimet", key: "settings", Icon: Gear },
] as const;

/* -------------------------------------------------------------- app mark */

/** The clinic's mark: a bloom squircle rather than a flat brand colour, so the
 *  identity is made of the same light the rest of the interface is made of. */
export function AppMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "mesh mesh-green grid size-9 shrink-0 place-items-center rounded-[13px] text-[13px] font-bold text-white",
        className,
      )}
      style={{ ["--m-y" as string]: "34%" }}
      aria-hidden="true"
    >
      A
    </span>
  );
}

/* --------------------------------------------------------------- sidebar */

export function Sidebar() {
  const pathname = usePathname();
  const { t, state } = useDemo();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col px-4 py-5 lg:flex">
      <div className="flex items-center gap-3 px-2 py-2">
        <AppMark />
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
            {state.clinic.name}
          </p>
          <p className="truncate text-[11px] text-ink-3">Tiranë</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 pt-7">
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "group relative flex items-center gap-3 rounded-full py-2.5 pl-3.5 pr-4",
                "text-[13.5px] transition-all duration-200 ease-[var(--ease)]",
                active
                  ? "bg-accent font-medium text-accent-fg shadow-[var(--shadow-card)]"
                  : "text-ink-2 hover:bg-surface/70 hover:text-ink",
              )}
            >
              <Icon size={17} weight={active ? "fill" : "regular"} />
              {t.nav[key]}
            </Link>
          );
        })}
      </nav>

      <p className="px-3 py-3 text-[11px] leading-relaxed text-ink-3">{t.clock.hint}</p>
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
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] transition-colors duration-200",
              active
                ? "bg-accent font-medium text-accent-fg"
                : "bg-surface text-ink-2 shadow-[var(--shadow-card)] dark:hairline",
            )}
          >
            <Icon size={15} weight={active ? "fill" : "regular"} />
            {t.nav[key]}
          </Link>
        );
      })}
    </nav>
  );
}

/* ----------------------------------------------------------------- theme */

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
      {dark ? <Sun size={15} weight="bold" /> : <Moon size={15} weight="bold" />}
    </IconButton>
  );
}

/* ---------------------------------------------------------------- topbar */

export function Topbar() {
  const { t, state, now, actions } = useDemo();
  const toast = useToast();

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-2 bg-bg/70 px-4 py-3 backdrop-blur-xl sm:flex-nowrap sm:px-8 sm:py-4">
      <div className="flex min-w-0 basis-full items-center gap-2.5 sm:flex-1 sm:basis-auto">
        <span className="lg:hidden">
          <AppMark className="size-8 rounded-[11px] text-xs" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-ink">
            <span>{capitalizeFirst(formatWeekday(now, state.lang))}</span>
            {", "}
            {formatDate(now, state.lang)}
          </p>
          <p className="truncate text-[11px] text-ink-3">{t.clock.label}</p>
        </div>
        <span className="rounded-full bg-lime px-2 py-[3px] text-[10px] font-semibold tracking-wide text-lime-ink">
          {t.demoBadge}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* The demo clock: one capsule holding both jumps and the reset. */}
        <div className="flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-[var(--shadow-card)] dark:hairline">
          <button
            onClick={() => actions.advanceDays(1)}
            className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:bg-surface-2 hover:text-ink"
          >
            <CaretDoubleRight size={12} weight="bold" />
            <span className="hidden sm:inline">{t.clock.advanceDay}</span>
            <span className="sm:hidden">+1</span>
          </button>
          <button
            onClick={() => actions.advanceDays(7)}
            className="h-7 rounded-full px-2.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:bg-surface-2 hover:text-ink"
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
            className="grid size-7 place-items-center rounded-full text-ink-3 transition-colors duration-200 hover:bg-surface-2 hover:text-ink"
          >
            <ArrowCounterClockwise size={13} weight="bold" />
          </button>
        </div>

        <div className="flex items-center rounded-full bg-surface p-1 shadow-[var(--shadow-card)] dark:hairline">
          {(["sq", "en"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => actions.setLang(lang)}
              className={cx(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors duration-200",
                state.lang === lang ? "bg-accent text-accent-fg" : "text-ink-3 hover:text-ink",
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

/* ------------------------------------------------------------ page header */

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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="display text-[34px] text-ink sm:text-[42px]">{title}</h1>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.32, 0.72, 0, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
