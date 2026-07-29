/**
 * Full-viewport glassmorphism scenery — a deep night gradient with large
 * drifting color orbs. Sits behind the glass panels on the public pages
 * (home, login) so their blur and sheen have something to catch.
 */
export function Scenery() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,hsl(258_55%_16%),hsl(240_10%_4%)_65%)]" />
      <div className="animate-drift absolute -top-24 left-[6%] size-[26rem] rounded-full bg-violet-600/30 blur-[110px]" />
      <div className="animate-drift-late absolute top-[28%] -right-28 size-[26rem] rounded-full bg-blue-500/25 blur-[120px]" />
      <div className="animate-drift absolute -bottom-36 left-[28%] size-[30rem] rounded-full bg-fuchsia-500/20 blur-[130px] [animation-duration:30s]" />
      <div className="animate-drift-late absolute right-[22%] bottom-[12%] size-60 rounded-full bg-teal-400/15 blur-[90px] [animation-duration:26s]" />
    </div>
  );
}
