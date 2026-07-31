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
 * desktop. A frosted thumb slides to whichever segment is active; the segment
 * itself is a plain link, so it still works before hydration and with JS off.
 */
export function ViewSlider() {
  const pathname = usePathname();
  const active = VIEWS.findIndex((v) => v.href === pathname);
  const listRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);

  // Position the thumb by writing to the node directly rather than through
  // state: measuring is a layout read, and a re-render would only repeat it.
  // Layout effect (not effect) so it never paints in the wrong place first.
  useLayoutEffect(() => {
    const list = listRef.current;
    const thumb = thumbRef.current;
    if (!list || !thumb) return;

    if (active < 0) {
      thumb.style.opacity = "0";
      return;
    }

    const place = () => {
      // Query the anchors, don't index `children` — the thumb is a child too
      // (absolute positioning takes it out of flow, not out of the collection),
      // which would shift every index by one.
      const el = list.querySelectorAll("a")[active];
      if (!el) return;

      thumb.style.left = `${el.offsetLeft}px`;
      thumb.style.width = `${el.offsetWidth}px`;
      thumb.style.opacity = "1";
      el.scrollIntoView({ block: "nearest", inline: "center" });
    };
    place();

    // Re-measure when the control resizes (rotation, window drag, font swap).
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [active]);

  /**
   * Dock-style proximity response: segments swell as the cursor nears, with a
   * smooth falloff, exactly like icons in the macOS Dock. Pointer-fine only —
   * a finger has no hover, and the effect would fight the tap. Writes
   * transforms straight to the nodes (no state) so it stays on the compositor.
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

    const links = () => [...list.querySelectorAll("a")];
    const MAX_LIFT = 0.14; // peak scale bump directly under the cursor
    // Wider than one segment on purpose: the Dock's character comes from
    // neighbours swelling too, so the bump reads as a wave, not a spotlight.
    const REACH = 220;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const a of links()) {
          const r = a.getBoundingClientRect();
          const d = Math.abs(e.clientX - (r.left + r.width / 2));
          // Falloff eases to zero at the edge instead of clipping.
          const t = Math.max(0, 1 - d / REACH);
          const lift = MAX_LIFT * (t * t * (3 - 2 * t)); // smoothstep
          a.style.transform = `scale(${1 + lift}) translateY(${-lift * 6}px)`;
        }
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      for (const a of links()) a.style.transform = "";
    };

    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  }, []);

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
              "transition-[left,width,opacity] duration-500",
              "motion-reduce:transition-none",
            )}
          />

          {VIEWS.map((v, i) => {
            const isActive = i === active;
            return (
              <Link
                key={v.href}
                href={v.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap sm:px-4 sm:text-sm",
                  // transform eases separately from the Dock-proximity writes,
                  // and origin-bottom makes the swell grow up out of the pill.
                  "origin-bottom transition-[color,transform] duration-200 ease-out",
                  "active:scale-95 motion-reduce:transition-none",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* Content is magnified rather than the whole segment: the
                    glass capsule keeps its measured size while what sits under
                    it swells, which is how a loupe behaves. Rides the same
                    spring as the thumb so they arrive together. */}
                <span
                  className={cn(
                    "flex items-center gap-1.5 transition-transform duration-500 motion-reduce:transition-none",
                    isActive && "scale-[1.14]",
                  )}
                  style={{
                    transitionTimingFunction: "cubic-bezier(.34,1.42,.5,1)",
                  }}
                >
                  <v.icon className="size-4 shrink-0" />
                  {/* The label is the point of the control, so it stays at
                      every width — the strip scrolls instead of shedding it. */}
                  {v.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
