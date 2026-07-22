"use client";

import { useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";

interface QuickAddProps {
  onAdd: (title: string) => void;
}

/**
 * Floating glass pill, docked to the bottom of the viewport — macOS
 * Spotlight/Raycast style. `md:pl-64` keeps it centered in the content
 * area (not the whole viewport) once the sidebar appears at md.
 */
export function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses quick-add from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    onAdd(t);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:bottom-6 md:pl-64">
      <form
        onSubmit={submit}
        className="glass-panel pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 shadow-2xl shadow-black/20 transition-shadow focus-within:ring-1 focus-within:ring-primary/40 focus-within:shadow-primary/10"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Plus className="size-4" />
        </span>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…  (press /)"
          aria-label="Add a task"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>
    </div>
  );
}
