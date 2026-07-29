import { ViewTransition } from "react";

/** Re-mounts on every route change so view switches get the glassy
 *  dissolve/condense transition. Header + sidebar live in layout.tsx and
 *  stay anchored; only the page content animates. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="glass-enter" exit="glass-exit" default="none">
      {children}
    </ViewTransition>
  );
}
