"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  Star,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VIEWS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Today", icon: Sun },
  { href: "/scheduled", label: "Scheduled", icon: CalendarRange },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/important", label: "Important", icon: Star },
] as const;

/**
 * Glass segmented control for the five main views — identical on phone and
 * desktop. The glass rides the cursor from segment to segment and falls back
 * to the current route on the way out. Each segment is a plain link, so the
 * control still works before hydration and with JS off.
 *
 * Everything the pointer drives — thumb position, the Dock-style swell, which
 * segment reads as lit — is written straight to the DOM in one animation
 * frame. Routing it through React state instead meant the batched re-render
 * could land a frame late or not at all, and the glass would visibly stall
 * behind the cursor partway across the strip.
 */
export function ViewSlider() {
  const pathname = usePathname();
  const active = VIEWS.findIndex((v) => v.href === pathname);
  const listRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);

  // Park the glass on a segment: move the thumb onto it and mark it lit.
  // `data-glass` is the single source of truth for the lit look, so React's
  // render (which only knows the route) can never fight the pointer.
  const glassTo = (index: number, scrollIntoView = false) => {
    const list = listRef.current;
    const thumb = thumbRef.current;
    if (!list || !thumb) return;

    const links = [...list.querySelectorAll("a")];
    const el = links[index];
    if (!el) {
      thumb.style.opacity = "0";
      return;
    }

    thumb.style.left = `${el.offsetLeft}px`;
    thumb.style.width = `${el.offsetWidth}px`;
    thumb.style.opacity = "1";

    links.forEach((a, i) =>
      i === index
        ? a.setAttribute("data-glass", "")
        : a.removeAttribute("data-glass"),
    );

    // Only chase the strip's scroll for the real route — doing it on hover
    // would yank the list out from under the cursor.
    if (scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "center" });
  };

  // Settle the glass on the current route, and keep it there through resizes
  // (rotation, window drag, a late font swap changing segment widths).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    glassTo(active, true);
    const ro = new ResizeObserver(() => glassTo(active));
    ro.observe(list);
    return () => ro.disconnect();
  }, [active]);

  /**
   * The cursor drives the glass and the swell together. Pointer-fine only —
   * a finger has no hover, and both effects would fight the tap.
   */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const MAX_LIFT = 0.14; // peak scale bump directly under the cursor
    // Wider than one segment on purpose: the Dock's character comes from
    // neighbours swelling too, so the bump reads as a wave, not a spotlight.
    const REACH = 220;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const links = [...list.querySelectorAll("a")];
        let nearest = 0;
        let nearestDist = Infinity;

        links.forEach((a, i) => {
          const r = a.getBoundingClientRect();
          const d = Math.abs(e.clientX - (r.left + r.width / 2));
          if (d < nearestDist) {
            nearestDist = d;
            nearest = i;
          }
          // Falloff eases to zero at the edge instead of clipping.
          const t = Math.max(0, 1 - d / REACH);
          const lift = MAX_LIFT * (t * t * (3 - 2 * t)); // smoothstep
          a.style.transform = `scale(${1 + lift}) translateY(${-lift * 6}px)`;
        });

        // Nearest centre rather than hit-testing, so the glass keeps up with
        // the cursor across the gaps between segments too.
        glassTo(nearest);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      for (const a of list.querySelectorAll("a")) a.style.transform = "";
      glassTo(active, true); // hand the glass back to the real route
    };

    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
      for (const a of list.querySelectorAll("a")) a.style.transform = "";
    };
    // Re-bound on route change so onLeave restores the new active segment.
  }, [active]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pl-64">
      {/* Heavier blur + a lit rim than the standard panel: this pill floats
          over content, so it needs to read as thick glass, like the Dock. */}
      <nav
        aria-label="Views"
        className={cn(
          "pointer-events-auto max-w-full overflow-x-auto rounded-full p-1",
          "border border-white/15 bg-card/40 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10",
          "shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_8px_32px_-8px_rgba(0,0,0,.45)]",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <div ref={listRef} className="relative flex items-center gap-0.5">
          {/* The glass thumb. Starts transparent so it never flashes at 0
              before the first measurement lands. The spring easing overshoots
              a few percent and settles — the give a physical control has, and
              what separates this from a linear slide. */}
          <span
            ref={thumbRef}
            aria-hidden
            style={{
              opacity: 0,
              transitionTimingFunction: "cubic-bezier(.34,1.42,.5,1)",
            }}
            className={cn(
              "absolute inset-y-0 left-0 w-0 rounded-full",
              // Liquid glass: a lit top edge, a soft floor, and a tint faint
              // enough that the wallpaper still reads through it.
              "bg-gradient-to-b from-white/25 to-white/5 dark:from-white/20 dark:to-white/[0.04]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,.5),inset_0_-1px_0_rgba(0,0,0,.06),0_2px_8px_-2px_rgba(0,0,0,.25)]",
              "ring-1 ring-white/25 backdrop-blur-sm dark:ring-white/10",
              // Quick enough to feel attached to the cursor as it sweeps
              // across; the spring still gives it a settle at the end.
              "transition-[left,width,opacity] duration-300",
              "motion-reduce:transition-none",
            )}
          />

          {VIEWS.map((v, i) => (
            <Link
              key={v.href}
              href={v.href}
              aria-current={i === active ? "page" : undefined}
              // The lit state comes from data-glass, set by the pointer layer,
              // so hover and route never disagree about which one is lit.
              className={cn(
                "group relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap sm:px-4 sm:text-sm",
                // transform eases separately from the Dock-proximity writes,
                // and origin-bottom makes the swell grow up out of the pill.
                "origin-bottom transition-[color,transform] duration-200 ease-out",
                "text-muted-foreground data-glass:text-foreground",
                "active:scale-95 motion-reduce:transition-none",
              )}
            >
              <span className="flex items-center gap-1.5 transition-transform duration-300 group-data-glass:scale-[1.14] motion-reduce:transition-none">
                <v.icon className="size-4 shrink-0" />
                {/* The label is the point of the control, so it stays at every
                    width — the strip scrolls instead of dropping to icons. */}
                {v.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
