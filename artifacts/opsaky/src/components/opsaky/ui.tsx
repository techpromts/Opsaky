"use client";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/lib/model";

type Variant = "ink" | "coral" | "ghost" | "soft" | "danger" | "outline";
const variants: Record<Variant, string> = {
  ink: "bg-ink text-paper hover:bg-[#24302d] shadow-[0_10px_24px_-12px_rgba(23,32,30,.7)]",
  coral: "bg-coral text-white hover:bg-coral-deep shadow-[0_12px_26px_-12px_rgba(255,90,54,.8)]",
  ghost: "text-ink hover:bg-ink/5",
  soft: "bg-white/70 text-ink border border-line hover:bg-white",
  danger: "bg-stop text-white hover:brightness-95",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-paper",
};

export function Btn({ variant = "ink", loading, className, children, disabled, size = "md", ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[.97] disabled:opacity-45 disabled:pointer-events-none select-none whitespace-nowrap",
        size === "sm" && "h-8 px-3 text-xs", size === "md" && "h-10 px-4 text-sm", size === "lg" && "h-12 px-6 text-[15px]",
        variants[variant], className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconBtn({ className, label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...rest} aria-label={label} title={label}
      className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition hover:bg-ink/5 hover:text-ink disabled:opacity-30 disabled:pointer-events-none", className)}>
      {children}
    </button>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">{children}</span>
      {hint && <span className="font-mono text-[10.5px] text-muted">{hint}</span>}
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...rest}
      className={cn("h-11 w-full rounded-xl border border-line bg-white/80 px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink focus:bg-white focus:ring-4 focus:ring-ink/5", className)} />
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...rest}
      className={cn("min-h-[84px] w-full resize-y rounded-xl border border-line bg-white/80 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-ink focus:bg-white focus:ring-4 focus:ring-ink/5", className)} />
  );
}

export function Switch({ checked, onChange, label, testId }: { checked: boolean; onChange: (v: boolean) => void; label?: string; testId?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} data-testid={testId}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200", checked ? "bg-teal" : "bg-ink/15")}>
      <span className={cn("inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-[23px]" : "translate-x-[3px]")} />
    </button>
  );
}

export function ToggleRow({ title, desc, checked, onChange, testId }: { title: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line/80 bg-white/55 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{title}</div>
        {desc && <div className="text-xs text-muted">{desc}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} testId={testId} />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, testId }: { value: T; options: { value: T; label: string; icon?: ReactNode }[]; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="flex w-full gap-1 rounded-2xl border border-line bg-paper-2/60 p-1" data-testid={testId}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} data-testid={`${testId}-${o.value}`}
          className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all duration-200",
            value === o.value ? "bg-ink text-paper shadow-md" : "text-ink-2 hover:bg-white/70")}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export function Range({ value, min, max, step = 1, onChange, suffix = "", label, testId }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string; label: string; testId?: string }) {
  return (
    <div>
      <Label hint={`${value}${suffix}`}>{label}</Label>
      <input type="range" className="ops-range" min={min} max={max} step={step} value={value} data-testid={testId}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function ColorField({ label, value, onChange, testId }: { label: string; value: string; onChange: (v: string) => void; testId?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white/80 px-2 transition hover:border-ink/40">
        <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-ink/10" style={{ background: value }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </span>
        <input value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false}
          className="w-full bg-transparent font-mono text-xs uppercase text-ink outline-none" />
      </label>
    </div>
  );
}

export function StatusBadge({ status, className }: { status: AccountStatus; className?: string }) {
  const map = {
    PENDING: { label: "Pending approval", cls: "bg-stop/10 text-stop border-stop/25", dot: "bg-stop" },
    APPROVED: { label: "Active", cls: "bg-go/10 text-go border-go/25", dot: "bg-go" },
    REJECTED: { label: "Rejected", cls: "bg-ink/5 text-muted border-ink/15", dot: "bg-muted" },
  }[status];
  return (
    <span data-testid={`status-${status.toLowerCase()}`} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", map.cls, className)}>
      <span className="relative flex h-2 w-2">
        {status !== "REJECTED" && <span className={cn("absolute inset-0 rounded-full pulse-dot", map.dot)} />}
        <span className={cn("relative h-2 w-2 rounded-full", map.dot)} />
      </span>
      {map.label}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="fade absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-label={title}
        className={cn("pop relative w-full rounded-t-[28px] border border-white/70 bg-paper p-6 shadow-2xl sm:rounded-[28px]", wide ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <IconBtn label="Close" onClick={onClose} data-testid="button-close-modal"><X className="h-4 w-4" /></IconBtn>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass rounded-[28px]", className)}>{children}</div>;
}
