"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  Clapperboard,
  Gamepad2,
  Gift,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  createCollectionItem,
  deleteCollectionItem,
  updateCollectionItem,
} from "@/lib/actions/collections";
import {
  COLLECTION_STATUSES,
  KIND_LABELS,
  STATUS_LABELS,
  type CollectionItem,
  type CollectionKind,
  type CollectionStatus,
} from "@/types/collections";
import type { CategoryRow } from "@/types/models";
import { cn } from "@/lib/utils";

const KIND_ICON = { game: Gamepad2, movie: Clapperboard, wish: Gift } as const;
const NO_GROUP = "__none__";

export function CollectionsView({
  byKind,
  groups,
  allTags,
  ready,
}: {
  byKind: Record<CollectionKind, CollectionItem[]>;
  groups: CategoryRow[];
  allTags: string[];
  /** False until the migration has been applied. */
  ready: boolean;
}) {
  const [kind, setKind] = useState<CollectionKind>("game");

  if (!ready) {
    return (
      <div className="glass-panel rounded-2xl border-dashed p-8 text-center">
        <p className="text-sm font-medium">Collections aren&apos;t set up yet</p>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
          Run{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            supabase/migrations/0001_collections.sql
          </code>{" "}
          in the Supabase SQL editor, then reload. Everything else keeps working
          in the meantime.
        </p>
      </div>
    );
  }

  return (
    <Tabs value={kind} onValueChange={(v) => setKind(v as CollectionKind)}>
      <TabsList className="glass-panel rounded-full">
        {(Object.keys(KIND_LABELS) as CollectionKind[]).map((k) => {
          const Icon = KIND_ICON[k];
          return (
            <TabsTrigger key={k} value={k} className="gap-1.5 rounded-full">
              <Icon className="size-4" />
              {KIND_LABELS[k]}
              <span className="text-xs text-muted-foreground tabular-nums">
                {byKind[k].length}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {(Object.keys(KIND_LABELS) as CollectionKind[]).map((k) => (
        <TabsContent key={k} value={k} className="mt-4">
          <KindPanel
            kind={k}
            items={byKind[k]}
            groups={groups}
            allTags={allTags}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

type Action =
  | { type: "add"; item: CollectionItem }
  | { type: "patch"; id: string; patch: Partial<CollectionItem> }
  | { type: "remove"; id: string };

function reducer(state: CollectionItem[], a: Action): CollectionItem[] {
  switch (a.type) {
    case "add":
      return [a.item, ...state];
    case "patch":
      return state.map((i) => (i.id === a.id ? { ...i, ...a.patch } : i));
    case "remove":
      return state.filter((i) => i.id !== a.id);
  }
}

function KindPanel({
  kind,
  items,
  groups,
  allTags,
}: {
  kind: CollectionKind;
  items: CollectionItem[];
  groups: CategoryRow[];
  allTags: string[];
}) {
  const [optimistic, dispatch] = useOptimistic(items, reducer);
  const [, startTransition] = useTransition();
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>(NO_GROUP);

  const shown = useMemo(() => {
    let list = optimistic;
    if (tagFilter) list = list.filter((i) => i.tags?.includes(tagFilter));
    if (groupFilter !== NO_GROUP)
      list = list.filter((i) => i.group_id === groupFilter);
    // Unfinished first, then alphabetical — same rule the task list follows.
    return [...list].sort((a, b) => {
      const aDone = a.status === "done";
      const bDone = b.status === "done";
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [optimistic, tagFilter, groupFilter]);

  function setStatus(item: CollectionItem, status: CollectionStatus) {
    startTransition(async () => {
      dispatch({ type: "patch", id: item.id, patch: { status } });
      const res = await updateCollectionItem(item.id, { status });
      if (!res.ok) toast.error(res.error);
    });
  }

  function remove(item: CollectionItem) {
    startTransition(async () => {
      dispatch({ type: "remove", id: item.id });
      const res = await deleteCollectionItem(item.id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Removed");
    });
  }

  return (
    <div className="space-y-4">
      <AddRow kind={kind} groups={groups} />

      {/* Filters */}
      {(allTags.length > 0 || groups.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {groups.length > 0 && (
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GROUP}>All groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                tagFilter === t
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-foreground/10 text-muted-foreground hover:text-foreground",
              )}
            >
              #{t}
            </button>
          ))}
          {tagFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTagFilter(null)}
              className="h-7 gap-1 text-xs text-muted-foreground"
            >
              <X className="size-3" /> Clear
            </Button>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="glass-panel rounded-2xl border-dashed py-12 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </div>
      ) : (
        <ul className="glass-panel divide-y divide-foreground/5 rounded-2xl">
          {shown.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm",
                    item.status === "done" &&
                      "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {item.group && (
                    <span className="flex items-center gap-1">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: item.group.color }}
                      />
                      {item.group.name}
                    </span>
                  )}
                  {item.where_to_watch && <span>· {item.where_to_watch}</span>}
                  {item.price != null && (
                    <span>· {item.price.toLocaleString()}</span>
                  )}
                  {item.tags?.map((t) => (
                    <span key={t} className="text-muted-foreground/70">
                      #{t}
                    </span>
                  ))}
                </p>
              </div>

              <Select
                value={item.status}
                onValueChange={(v) => setStatus(item, v as CollectionStatus)}
              >
                <SelectTrigger size="sm" className="w-32 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[kind][s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(item)}
                aria-label={`Remove ${item.title}`}
                className="touch-target size-8 shrink-0 text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Inline add: title plus the fields that actually differ per kind. */
function AddRow({
  kind,
  groups,
}: {
  kind: CollectionKind;
  groups: CategoryRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [groupId, setGroupId] = useState(NO_GROUP);
  const [where, setWhere] = useState("");
  const [price, setPrice] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;

    startTransition(async () => {
      const res = await createCollectionItem({
        kind,
        title: t,
        group_id: groupId === NO_GROUP ? null : groupId,
        tags: tags
          .split(",")
          .map((s) => s.trim().replace(/^#/, ""))
          .filter(Boolean),
        where_to_watch: kind === "movie" ? where.trim() || null : null,
        price: kind === "wish" && price ? Number(price) : null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setTitle("");
      setTags("");
      setWhere("");
      setPrice("");
    });
  }

  return (
    <form onSubmit={submit} className="glass-panel space-y-3 rounded-2xl p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`c-title-${kind}`} className="text-xs">
            {kind === "game"
              ? "Game"
              : kind === "movie"
                ? "Movie or show"
                : "Something to buy"}
          </Label>
          <Input
            id={`c-title-${kind}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            disabled={pending}
          />
        </div>

        {kind === "movie" && (
          <div className="space-y-1.5">
            <Label htmlFor="c-where" className="text-xs">
              Where to watch
            </Label>
            <Input
              id="c-where"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Netflix, cinema…"
              disabled={pending}
            />
          </div>
        )}

        {kind === "wish" && (
          <div className="space-y-1.5">
            <Label htmlFor="c-price" className="text-xs">
              Price
            </Label>
            <Input
              id="c-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              disabled={pending}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Group</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_GROUP}>No group</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`c-tags-${kind}`} className="text-xs">
            Tags
          </Label>
          <Input
            id={`c-tags-${kind}`}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="co-op, 2026, gift"
            disabled={pending}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={pending || !title.trim()}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Add
      </Button>
    </form>
  );
}
