"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CalendarDays,
  CalendarRange,
  Star,
  Sun,
  FolderKanban,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/lib/actions/projects";
import { createCategory } from "@/lib/actions/categories";
import type { SidebarData } from "@/lib/queries/sidebar";

const VIEWS = [
  { href: "/", label: "Today", icon: Sun, key: "today" as const },
  {
    href: "/scheduled",
    label: "Scheduled",
    icon: CalendarRange,
    key: "scheduled" as const,
  },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, key: null },
  {
    href: "/important",
    label: "Important",
    icon: Star,
    key: "important" as const,
  },
];

const SWATCHES = [
  "#8b5cf6",
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
];

export function Sidebar({ data }: { data: SidebarData }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r border-foreground/10 bg-card/40 px-3 py-4 backdrop-blur-2xl backdrop-saturate-150 md:flex">
      <nav className="space-y-0.5">
        {VIEWS.map((v) => (
          <NavLink
            key={v.href}
            href={v.href}
            label={v.label}
            icon={<v.icon className="size-4" />}
            active={pathname === v.href}
            count={v.key ? data.counts[v.key] : undefined}
          />
        ))}
        <NavLink
          href="/projects"
          label="Projects"
          icon={<FolderKanban className="size-4" />}
          active={pathname === "/projects"}
        />
      </nav>

      {data.categories.length > 0 && (
        <Section label="Categories" action={<NewCategoryDialog />}>
          {data.categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="flex-1 truncate">{c.name}</span>
              {c.count > 0 && (
                <span className="text-xs tabular-nums">{c.count}</span>
              )}
            </div>
          ))}
        </Section>
      )}

      <Section label="Projects" action={<NewProjectDialog data={data} />}>
        {data.projects.length === 0 ? (
          <p className="px-3 py-1 text-xs text-muted-foreground">
            No projects yet
          </p>
        ) : (
          data.projects.map((p) => (
            <NavLink
              key={p.id}
              href={`/projects/${p.id}`}
              label={p.name}
              icon={
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
              }
              active={pathname === `/projects/${p.id}`}
              count={p.count || undefined}
            />
          ))
        )}
      </Section>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  count,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-gradient-to-r from-primary/20 to-fuchsia-500/10 font-medium text-foreground ring-1 ring-primary/15"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
      )}
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NewProjectDialog({ data }: { data: SidebarData }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("__none__");
  const [pending, start] = useTransition();

  function submit() {
    const n = name.trim();
    if (!n) return;
    start(async () => {
      const res = await createProject({
        name: n,
        description: description.trim() || null,
        category_id: categoryId === "__none__" ? null : categoryId,
      });
      if (res.ok) {
        toast.success("Project created");
        setName("");
        setDescription("");
        setCategoryId("__none__");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="size-6" aria-label="New project">
          <Plus className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Portfolio site"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {data.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [pending, start] = useTransition();

  function submit() {
    const n = name.trim();
    if (!n) return;
    start(async () => {
      const res = await createCategory({ name: n, color });
      if (res.ok) {
        toast.success("Category created");
        setName("");
        setColor(SWATCHES[0]);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="size-6" aria-label="New category">
          <Plus className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fitness"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setColor(s)}
                  className={cn(
                    "size-6 rounded-full ring-offset-2 ring-offset-background transition",
                    color === s && "ring-2 ring-primary",
                  )}
                  style={{ backgroundColor: s }}
                  aria-label={`Pick ${s}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
