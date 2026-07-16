"use client";

interface ProgressRingProps {
  done: number;
  total: number;
  size?: number;
}

/** Violet→fuchsia gradient ring. Animates stroke-dashoffset on change. */
export function ProgressRing({ done, total, size = 56 }: ProgressRingProps) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  const offset = c * (1 - pct);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${done} of ${total} done`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(263 70% 62%)" />
            <stop offset="100%" stopColor="hsl(291 70% 62%)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted) / 1)"
          className="stroke-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}
