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
    "inline-flex items-center justify-center gap-2 rounded-card font-medium whitespace-nowrap " +
    "transition-[background-color,border-color,color,transform] duration-150 " +
    "active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-45";
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm" };
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-accent text-accent-fg hover:bg-accent-hover",
    secondary:
      "border border-line bg-surface text-ink hover:bg-surface-2 hover:border-line-strong",
    ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
    danger: "border border-line bg-surface text-danger hover:bg-danger-soft",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...props}>
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
        "rounded-card border border-line bg-surface shadow-[var(--shadow-card)]",
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
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-ink-3">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ Pill */

export type Tone = "neutral" | "accent" | "ok" | "warn" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted-soft text-ink-2",
  accent: "bg-accent-soft text-accent",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
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
      className={cx("animate-pulse rounded-card bg-surface-2", className)}
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
  "h-10 w-full rounded-card border border-line bg-surface px-3 text-sm text-ink " +
  "placeholder:text-ink-3 transition-colors hover:border-line-strong " +
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
              "relative flex max-h-[92vh] w-full flex-col overflow-hidden border border-line bg-surface shadow-[var(--shadow-pop)]",
              "rounded-t-2xl sm:rounded-card",
              wide ? "sm:max-w-2xl" : "sm:max-w-md",
            )}
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
              <h2 id={titleId} className="text-sm font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
                <X size={16} weight="bold" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-4 py-3">
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
              className="pointer-events-auto rounded-card border border-line bg-ink px-3.5 py-2 text-[13px] font-medium text-bg shadow-[var(--shadow-pop)]"
            >
              {toast.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
