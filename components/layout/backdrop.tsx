"use client";

import { useEffect, useState } from "react";

/**
 * User-selectable app backgrounds. Each scene is drawn with CSS/SVG in the
 * app's palette and has a light and dark treatment (via `dark:` classes), so
 * it works in both themes. The choice is per-device, kept in localStorage.
 */
export const BACKDROPS = [
  { id: "aurora", name: "Aurora glow" },
  { id: "winter-night", name: "Winter night" },
  { id: "snowfall", name: "Snowfall" },
  { id: "forest", name: "Misty forest" },
  { id: "minimal", name: "Minimal" },
] as const;

export type BackdropId = (typeof BACKDROPS)[number]["id"];

const KEY = "tm-backdrop";
const EVENT = "tm-backdrop-change";

export function useBackdrop() {
  const [id, setId] = useState<BackdropId>("aurora");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(KEY) as BackdropId | null;
    if (saved && BACKDROPS.some((b) => b.id === saved)) setId(saved);
    const onChange = (e: Event) =>
      setId((e as CustomEvent<BackdropId>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const set = (v: BackdropId) => {
    localStorage.setItem(KEY, v);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
  };

  return { id: mounted ? id : ("aurora" as BackdropId), set };
}

export function Backdrop() {
  const { id } = useBackdrop();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {id === "aurora" && <Aurora />}
      {id === "winter-night" && <WinterNight />}
      {id === "snowfall" && <Snowfall />}
      {id === "forest" && <Forest />}
      {id === "minimal" && <Minimal />}
    </div>
  );
}

/* ----- Scenes -------------------------------------------------------- */

function Aurora() {
  return (
    <>
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="absolute top-1/3 -right-24 size-96 rounded-full bg-blue-500/10 blur-[110px]" />
      <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-fuchsia-500/10 blur-[120px]" />
    </>
  );
}

function WinterNight() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-blue-100 to-slate-50 dark:from-[#0a0f2b] dark:via-[#111737] dark:to-[#181d3f]" />
      {/* Moon / sun */}
      <div className="absolute top-[10%] right-[14%] size-20 rounded-full bg-amber-200/80 blur-[2px] shadow-[0_0_60px_20px_rgba(253,230,138,0.35)] dark:bg-slate-100/90 dark:shadow-[0_0_60px_18px_rgba(226,232,240,0.25)]" />
      {/* Stars — dark only */}
      <div
        className="absolute inset-x-0 top-0 hidden h-1/2 opacity-70 dark:block"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 12% 22%, #fff, transparent), radial-gradient(1px 1px at 28% 10%, #fff, transparent), radial-gradient(1.5px 1.5px at 44% 30%, #fff, transparent), radial-gradient(1px 1px at 63% 14%, #fff, transparent), radial-gradient(1.5px 1.5px at 81% 26%, #fff, transparent), radial-gradient(1px 1px at 92% 8%, #fff, transparent)",
        }}
      />
      <svg
        viewBox="0 0 1440 520"
        preserveAspectRatio="none"
        className="absolute bottom-0 h-[55%] w-full"
      >
        <polygon
          points="0,300 260,110 520,300 760,160 1030,330 1250,190 1440,320 1440,520 0,520"
          className="fill-blue-300/70 dark:fill-[#232a56]"
        />
        <polygon
          points="0,380 200,240 430,390 700,250 980,400 1210,290 1440,400 1440,520 0,520"
          className="fill-blue-200/80 dark:fill-[#2b3266]"
        />
        {/* Pines */}
        {[140, 320, 950, 1120, 1300].map((x) => (
          <g key={x} className="fill-indigo-400/50 dark:fill-[#171c40]">
            <polygon
              points={`${x},420 ${x - 26},480 ${x + 26},480`}
            />
            <polygon
              points={`${x},395 ${x - 20},445 ${x + 20},445`}
            />
          </g>
        ))}
        {/* Snow ground */}
        <path
          d="M0,470 C 300,430 500,500 760,465 C 1020,430 1240,495 1440,460 L1440,520 L0,520 Z"
          className="fill-white dark:fill-[#343c72]"
        />
      </svg>
      <div className="absolute inset-0 bg-background/20 dark:bg-background/40" />
    </>
  );
}

function Snowfall() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-blue-50 dark:from-[#101527] dark:to-[#1a2140]" />
      <div
        className="animate-snow absolute inset-0 opacity-70 dark:opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(2px 2px at 20% 20%, #fff 50%, transparent 100%), radial-gradient(1.5px 1.5px at 60% 45%, #fff 50%, transparent 100%), radial-gradient(2px 2px at 85% 70%, #fff 50%, transparent 100%)",
          backgroundSize: "220px 220px",
        }}
      />
      <div
        className="animate-snow-slow absolute inset-0 opacity-50 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 35% 60%, #fff 50%, transparent 100%), radial-gradient(1px 1px at 75% 25%, #fff 50%, transparent 100%)",
          backgroundSize: "140px 140px",
        }}
      />
      {/* Drifts */}
      <div className="absolute -bottom-24 -left-1/4 h-48 w-3/4 rounded-[100%] bg-white/80 blur-sm dark:bg-[#2a3160]" />
      <div className="absolute -bottom-28 -right-1/4 h-52 w-3/4 rounded-[100%] bg-blue-50 blur-sm dark:bg-[#232a52]" />
    </>
  );
}

function Forest() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-teal-100 via-emerald-50 to-slate-100 dark:from-[#0a1a1c] dark:via-[#0e2124] dark:to-[#122b2b]" />
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        className="absolute bottom-0 h-[45%] w-full"
      >
        {[0, 180, 360, 540, 720, 900, 1080, 1260].map((x) => (
          <polygon
            key={`far-${x}`}
            points={`${x + 90},60 ${x - 20},400 ${x + 200},400`}
            className="fill-teal-300/40 dark:fill-teal-900/40"
          />
        ))}
        {[90, 300, 510, 740, 960, 1180, 1380].map((x) => (
          <polygon
            key={`near-${x}`}
            points={`${x},140 ${x - 90},400 ${x + 90},400`}
            className="fill-teal-400/50 dark:fill-[#0c3a34]"
          />
        ))}
      </svg>
      {/* Mist bands */}
      <div className="absolute bottom-[18%] h-16 w-full bg-white/50 blur-2xl dark:bg-teal-100/10" />
      <div className="absolute bottom-[6%] h-20 w-full bg-white/40 blur-2xl dark:bg-teal-100/5" />
      <div className="absolute inset-0 bg-background/15 dark:bg-background/35" />
    </>
  );
}

function Minimal() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,hsl(263_70%_62%/0.08),transparent)]" />
  );
}
