"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Holiday themes. Each one is a real photograph (Unsplash license) plus an
 * accent hue that retints the whole UI — buttons, links, rings, charts — via
 * `html[data-accent]` rules in globals.css. Light and dark steps of every
 * accent are defined there. The choice is per-device, kept in localStorage.
 */
export const BACKDROPS = [
  { id: "village", name: "Christmas village", when: "Dec · worldwide" },
  { id: "lights", name: "Christmas lights", when: "Dec · worldwide" },
  { id: "cabin", name: "Winter cabin", when: "Winter" },
  { id: "night", name: "Starry winter night", when: "Winter" },
  { id: "mountains", name: "Snowy peaks", when: "Winter" },
  { id: "newyear", name: "New Year fireworks", when: "1 Jan · global" },
  { id: "lunar", name: "Lunar New Year", when: "Jan–Feb · E/SE Asia" },
  { id: "carnival", name: "Carnival · Rio", when: "Feb · Brazil" },
  { id: "stpatricks", name: "St. Patrick's Day", when: "17 Mar · Ireland" },
  { id: "holi", name: "Holi colors", when: "Mar · India, Nepal" },
  { id: "easter", name: "Easter spring", when: "Mar–Apr · Christian" },
  { id: "eid", name: "Ramadan & Eid", when: "Lunar · Muslim world" },
  { id: "vesak", name: "Vesak lanterns", when: "May · Buddhist" },
  { id: "oktoberfest", name: "Oktoberfest", when: "Sep–Oct · Germany" },
  { id: "midautumn", name: "Mid-Autumn Festival", when: "Sep–Oct · China, Vietnam" },
  { id: "diwali", name: "Diwali lamps", when: "Oct–Nov · India" },
  { id: "halloween", name: "Halloween", when: "31 Oct · Americas, Europe" },
  { id: "muertos", name: "Day of the Dead", when: "1–2 Nov · Mexico" },
  { id: "thanksgiving", name: "Thanksgiving", when: "Nov · US, Canada" },
] as const;

export type BackdropId = (typeof BACKDROPS)[number]["id"];

export const DEFAULT_BACKDROP: BackdropId = "village";

export const photoUrl = (id: BackdropId) => `/backdrops/${id}.jpg`;

const KEY = "tm-backdrop";
const EVENT = "tm-backdrop-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function getSnapshot(): BackdropId {
  const saved = localStorage.getItem(KEY) as BackdropId | null;
  return saved && BACKDROPS.some((b) => b.id === saved)
    ? saved
    : DEFAULT_BACKDROP;
}

export function useBackdrop() {
  // Server render always uses the default; the stored choice hydrates in.
  const id = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_BACKDROP,
  );

  const set = (v: BackdropId) => {
    localStorage.setItem(KEY, v);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
  };

  return { id, set };
}

export function Backdrop() {
  const { id } = useBackdrop();

  // Retint the UI: globals.css keys every accent off html[data-accent].
  useEffect(() => {
    document.documentElement.dataset.accent = id;
  }, [id]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative fixed wallpaper; next/image adds nothing for a single full-bleed background */}
      <img
        src={photoUrl(id)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Veil keeps glass panels and text readable over any photo, in either theme. */}
      <div className="absolute inset-0 bg-white/55 dark:bg-black/65" />
    </div>
  );
}
