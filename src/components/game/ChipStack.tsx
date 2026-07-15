"use client";

import { cn } from "@/lib/utils";

type Denom = 5 | 25 | 100 | 500;

const DENOM_META: Record<Denom, { color: string; ring: string; label: string }> = {
  5: { color: "bg-blue-600", ring: "ring-blue-200/40", label: "5" },
  25: { color: "bg-emerald-600", ring: "ring-emerald-200/40", label: "25" },
  100: { color: "bg-orange-600", ring: "ring-orange-200/40", label: "100" },
  500: { color: "bg-fuchsia-700", ring: "ring-fuchsia-200/40", label: "500" },
};

/** Break a chip total into a stack of denominations (greedy, capped count). */
export function breakChips(total: number): Denom[] {
  const denoms: Denom[] = [500, 100, 25, 5];
  const stack: Denom[] = [];
  let rest = Math.max(0, Math.floor(total));
  for (const d of denoms) {
    let count = Math.floor(rest / d);
    // cap each denom to keep the visual tidy
    const cap = d >= 500 ? 3 : d >= 100 ? 5 : 6;
    count = Math.min(count, cap);
    for (let i = 0; i < count; i++) stack.push(d);
    rest -= count * d;
  }
  // always show at least one chip if total > 0
  if (stack.length === 0 && total > 0) stack.push(5);
  return stack;
}

/** A single 3D-ish casino chip. */
export function CasinoChip({
  denom,
  size = 44,
  className,
}: {
  denom: Denom;
  size?: number;
  className?: string;
}) {
  const meta = DENOM_META[denom];
  return (
    <div
      className={cn("casino-chip ring-2", meta.color, meta.ring, className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-white drop-shadow">
          {meta.label}
        </span>
      </div>
    </div>
  );
}

/** Stacked casino chips with a 3D offset illusion. */
export function ChipStack({
  total,
  size = 44,
  className,
}: {
  total: number;
  size?: number;
  className?: string;
}) {
  const stack = breakChips(total).slice(0, 14);
  return (
    <div className={cn("relative", className)} style={{ height: size + stack.length * 5 }}>
      {stack.map((d, i) => (
        <div
          key={i}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: i * 5 }}
        >
          <CasinoChip denom={d} size={size} />
        </div>
      ))}
    </div>
  );
}
