/**
 * Full-viewport backdrop for the public pages (home, login) — the same
 * holiday-scenery photo theme the app uses, veiled so the glass panels stay
 * readable, with the signature drifting color orbs layered on top.
 */
export function Scenery() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative fixed wallpaper */}
      <img
        src="/backdrops/village.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-white/55 dark:bg-black/65" />
      <div className="animate-drift absolute -top-24 left-[6%] size-[26rem] rounded-full bg-violet-600/25 blur-[110px]" />
      <div className="animate-drift-late absolute top-[28%] -right-28 size-[26rem] rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="animate-drift absolute -bottom-36 left-[28%] size-[30rem] rounded-full bg-fuchsia-500/15 blur-[130px] [animation-duration:30s]" />
    </div>
  );
}
