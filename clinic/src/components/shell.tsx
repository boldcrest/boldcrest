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
import { Button, Pill, cx, useToast } from "./ui";
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
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="grid size-8 place-items-center rounded-card bg-accent text-[13px] font-bold text-accent-fg">
          A
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">
            {state.clinic.name}
          </p>
          <p className="truncate text-[11px] text-ink-3">Tiranë</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex items-center gap-2.5 rounded-card px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} />
              {t.nav[key]}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <p className="px-2 text-[11px] leading-relaxed text-ink-3">{t.clock.hint}</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useDemo();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 lg:hidden">
      {NAV.map(({ href, key, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-card px-2.5 py-1.5 text-[13px] transition-colors",
              active ? "bg-accent-soft font-medium text-accent" : "text-ink-2",
            )}
          >
            <Icon size={16} weight={active ? "fill" : "regular"} />
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
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Theme">
      {dark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
    </Button>
  );
}

export function Topbar() {
  const { t, state, now, actions } = useDemo();
  const toast = useToast();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-tight text-ink">
            <span>{capitalizeFirst(formatWeekday(now, state.lang))}</span>
            {", "}
            {formatDate(now, state.lang)}
          </p>
          <Pill tone="accent">{t.demoBadge}</Pill>
        </div>
        <p className="truncate text-[11px] text-ink-3">{t.clock.label}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="secondary" onClick={() => actions.advanceDays(1)}>
          <CaretDoubleRight size={14} weight="bold" />
          <span className="hidden sm:inline">{t.clock.advanceDay}</span>
          <span className="sm:hidden">+1</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={() => actions.advanceDays(7)}>
          <span className="hidden sm:inline">{t.clock.advanceWeek}</span>
          <span className="sm:hidden">+7</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            actions.reset();
            toast.push(t.toast.reset);
          }}
          aria-label={t.clock.reset}
          title={t.clock.reset}
        >
          <ArrowCounterClockwise size={15} weight="bold" />
        </Button>

        <div className="mx-1 h-5 w-px bg-line" />

        <div className="flex items-center rounded-card border border-line p-0.5">
          {(["sq", "en"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => actions.setLang(lang)}
              className={cx(
                "rounded-[7px] px-2 py-1 text-[11px] font-semibold uppercase transition-colors",
                state.lang === lang
                  ? "bg-accent text-accent-fg"
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
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
