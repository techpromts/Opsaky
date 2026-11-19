import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#17201e" />
      <circle cx="20" cy="20" r="10.5" fill="none" stroke="#f1eee7" strokeWidth="3.2" />
      <path d="M20 9.5a10.5 10.5 0 0 1 10.5 10.5H20z" fill="#ff5a36" />
      <circle cx="29.5" cy="10.5" r="3.2" fill="#d6f264" />
    </svg>
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "paper" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("font-display text-[22px] font-extrabold tracking-tight", tone === "ink" ? "text-ink" : "text-paper")}>
        opsaky
      </span>
    </span>
  );
}
