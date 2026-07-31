import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * App mark — a rounded "checkbox" tile with a check drawn as one confident
 * stroke, plus a small progress arc for the "nothing slips" idea. Uses the
 * live accent token, so it retints with the holiday theme like everything else.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      role="img"
      aria-label="Task Manager"
    >
      <defs>
        <linearGradient id="tm-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop
            offset="1"
            stopColor="var(--primary)"
            stopOpacity="0.55"
          />
        </linearGradient>
      </defs>

      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="url(#tm-logo)" />
      {/* Specular top edge — the same gloss the glass panels have. */}
      <path
        d="M10.5 1.5h11a9 9 0 0 1 9 9v0a13 13 0 0 0-29 0v0a9 9 0 0 1 9-9Z"
        fill="#fff"
        opacity="0.22"
      />
      <path
        d="m9.5 16.5 4.5 4.5 8.5-9"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Mark + wordmark, linking home. `href` differs by context: signed-in users
 * go to the dashboard, visitors to the landing page.
 */
export function Logo({
  href = "/dashboard",
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Task Manager — home"
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80",
        className,
      )}
    >
      <LogoMark />
      {showText && <span>Task Manager</span>}
    </Link>
  );
}
