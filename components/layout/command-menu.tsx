"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  CalendarRange,
  CalendarDays,
  Star,
  FolderKanban,
  Moon,
  Monitor,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";

interface TaskHit {
  id: string;
  title: string;
  project_id: string | null;
}

export function CommandMenu({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<TaskHit[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "F1") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced task search. setState lives inside the timeout (not the effect
  // body) so it doesn't trigger a synchronous cascading render.
  useEffect(() => {
    const q = query.trim();
    const id = setTimeout(async () => {
      if (q.length < 2) {
        setHits([]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("tasks")
        .select("id, title, project_id")
        .ilike("title", `%${q}%`)
        .eq("status", "todo")
        .limit(8);
      setHits(data ?? []);
    }, 200);
    return () => clearTimeout(id);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search tasks or jump to…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {hits.length > 0 && (
          <>
            <CommandGroup heading="Tasks">
              {hits.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`task-${t.id}-${t.title}`}
                  onSelect={() =>
                    go(t.project_id ? `/projects/${t.project_id}` : "/")
                  }
                >
                  <Search className="size-4" />
                  {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go("/")}>
            <Sun className="size-4" />
            Today
          </CommandItem>
          <CommandItem onSelect={() => go("/scheduled")}>
            <CalendarRange className="size-4" />
            Scheduled
          </CommandItem>
          <CommandItem onSelect={() => go("/calendar")}>
            <CalendarDays className="size-4" />
            Calendar
          </CommandItem>
          <CommandItem onSelect={() => go("/important")}>
            <Star className="size-4" />
            Important
          </CommandItem>
          <CommandItem onSelect={() => go("/projects")}>
            <FolderKanban className="size-4" />
            Projects
          </CommandItem>
        </CommandGroup>

        {projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project-${p.name}`}
                onSelect={() => go(`/projects/${p.id}`)}
              >
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => {
              setTheme("light");
              setOpen(false);
            }}
          >
            <Sun className="size-4" />
            Light
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("dark");
              setOpen(false);
            }}
          >
            <Moon className="size-4" />
            Dark
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("system");
              setOpen(false);
            }}
          >
            <Monitor className="size-4" />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
