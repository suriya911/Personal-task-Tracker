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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pl-64">
      <nav
        aria-label="Views"
        className="glass-panel pointer-events-auto max-w-full overflow-x-auto rounded-full p-1 shadow-2xl shadow-black/20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={listRef} className="relative flex items-center gap-0.5">
          {/* The sliding thumb — starts transparent so it never flashes at 0
              before the first measurement lands. */}
          <span
            ref={thumbRef}
            aria-hidden
            style={{ opacity: 0 }}
            className="absolute inset-y-0 left-0 w-0 rounded-full bg-primary/15 ring-1 ring-primary/25 transition-[left,width,opacity] duration-300 ease-out motion-reduce:transition-none"
          />

          {VIEWS.map((v, i) => {
            const isActive = i === active;
            return (
              <Link
                key={v.href}
                href={v.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-sm",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="size-4 shrink-0" />
                {/* The label is the point of the control, so it stays at every
                    width — the strip scrolls instead of dropping to icons. */}
                {v.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
