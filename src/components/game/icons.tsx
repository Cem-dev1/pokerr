"use client";

import { cn } from "@/lib/utils";

export function ChipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" className="fill-current opacity-90" />
      <circle cx="12" cy="12" r="6" className="stroke-white/80" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.2" className="fill-white/85" />
    </svg>
  );
}

export function GoldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" className="fill-current" />
      <circle cx="12" cy="12" r="9" className="stroke-amber-900/40" strokeWidth="1" />
      <text x="12" y="16" textAnchor="middle" className="fill-amber-900 font-bold" fontSize="11">
        ¢
      </text>
    </svg>
  );
}

export function SwordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} fill="currentColor" aria-hidden>
      <path d="M14.5 3l6 6-1.4 1.4-1.1-1.1-7 7-1 3.7-2.3 2.3-1.4-1.4 2.3-2.3 3.7-1 7-7-1.1-1.1L14.5 3z" />
    </svg>
  );
}
