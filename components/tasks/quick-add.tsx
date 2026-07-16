"use client";

import { useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface QuickAddProps {
  onAdd: (title: string) => void;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses quick-add from anywhere (Phase 9 shortcut, cheap to add now).
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
    <form onSubmit={submit} className="relative">
      <Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…  (press /)"
        aria-label="Add a task"
        className="pl-9"
      />
    </form>
  );
}
