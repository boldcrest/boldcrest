"use client";

import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { X } from "@phosphor-icons/react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------------- Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap " +
    "transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease)] " +
    "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-40";
  const sizes = { sm: "h-8 px-3.5 text-[13px]", md: "h-10 px-5 text-[13.5px]" };
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-accent text-accent-fg shadow-[var(--shadow-card)] hover:bg-accent-hover hover:shadow-[var(--shadow-raised)]",
    secondary:
      "bg-surface text-ink shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)] " +
      "dark:hairline",
    ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
    danger: "bg-surface text-danger shadow-[var(--shadow-card)] hover:bg-danger-soft",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

/** Circular control for a single icon: toolbars, close buttons, row actions. */
export function IconButton({
  className,
  children,
  tone = "surface",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "surface" | "ghost" }) {
  return (
    <button
      className={cx(
        "inline-grid size-9 shrink-0 place-items-center rounded-full transition-all duration-200 ease-[var(--ease)]",
        "active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40",
        tone === "surface"
          ? "bg-surface text-ink-2 shadow-[var(--shadow-card)] hover:text-ink hover:shadow-[var(--shadow-raised)] dark:hairline"
          : "text-ink-3 hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ Card */

export function Card({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={cx(
        "rounded-panel bg-surface shadow-[var(--shadow-card)] dark:hairline",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  action,
  hint,
}: {
  title: ReactNode;
  action?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
        {hint ? <p className="mt-1 text-[12.5px] text-ink-3">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ Pill */

export type Tone = "neutral" | "lime" | "accent" | "ok" | "warn" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted-soft text-ink-2",
  lime: "bg-lime text-lime-ink",
  accent: "bg-ink/[0.07] text-ink dark:bg-white/10",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

export function Pill({
  tone = "neutral",
  children,
  icon,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[11px] font-medium leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon ? <div className="text-ink-3">{icon}</div> : null}
      <p className="text-sm font-medium text-ink">{title}</p>
      {body ? <p className="max-w-[46ch] text-sm text-ink-3">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx("animate-pulse rounded-panel bg-surface-2", className)}
      aria-hidden="true"
    />
  );
}

/* -------------------------------------------------------------- Form bits */

export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && !error ? <span className="text-xs text-ink-3">{hint}</span> : null}
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}

const controlClass =
  "h-11 w-full rounded-card border border-transparent bg-surface-2 px-4 text-sm text-ink " +
  "placeholder:text-ink-3 transition-colors duration-200 hover:border-line-strong " +
  "focus:border-accent focus:outline-none focus-visible:outline-none";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(controlClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(controlClass, "cursor-pointer pr-8", props.className)} />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(controlClass, "h-auto min-h-20 py-2 leading-relaxed", props.className)}
    />
  );
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        {...props}
        className="size-4 cursor-pointer accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

/* ----------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-stone-950/40 backdrop-blur-[2px]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cx(
              "relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-surface shadow-[var(--shadow-pop)] dark:hairline",
              "rounded-t-tile sm:rounded-tile",
              wide ? "sm:max-w-2xl" : "sm:max-w-md",
            )}
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-4">
              <h2 id={titleId} className="text-base font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <IconButton tone="ghost" onClick={onClose} aria-label="Close">
                <X size={16} weight="bold" />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-3">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ----------------------------------------------------------------- Toast */

interface ToastValue {
  push: (text: string) => void;
}
const ToastContext = createContext<ToastValue>({ push: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const reduce = useReducedMotion();

  function push(text: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-bg shadow-[var(--shadow-pop)]"
            >
              {toast.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
