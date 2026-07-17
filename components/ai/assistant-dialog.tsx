"use client";

import { useRef, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Sparkles, Upload, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { planFromImage, commitAiTasks } from "@/lib/actions/ai";
import { cn } from "@/lib/utils";
import type { AiTask } from "@/lib/ai/types";

type Row = AiTask & { include: boolean };

export function AssistantDialog() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [analyzing, startAnalyze] = useTransition();
  const [committing, startCommit] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const payload = useRef<{ base64: string; mimeType: string } | null>(null);

  function reset() {
    setPreview(null);
    setHint("");
    setSummary(null);
    setRows([]);
    payload.current = null;
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image exceeds 5 MB");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      payload.current = {
        base64: dataUrl.split(",")[1],
        mimeType: file.type,
      };
      setSummary(null);
      setRows([]);
    };
    reader.readAsDataURL(file);
  }

  function analyze() {
    if (!payload.current) return toast.error("Pick an image first");
    startAnalyze(async () => {
      const res = await planFromImage({ ...payload.current!, hint: hint.trim() });
      if (!res.ok) return void toast.error(res.error);
      setSummary(res.plan.summary);
      setRows(res.plan.tasks.map((t) => ({ ...t, include: true })));
    });
  }

  function commit() {
    const chosen = rows.filter((r) => r.include);
    if (chosen.length === 0) return toast.error("Select at least one task");
    startCommit(async () => {
      const res = await commitAiTasks(
        chosen.map((r) => ({
          title: r.title,
          due_date: r.due_date,
          priority: r.priority,
          notes: r.notes,
        })),
      );
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Added ${res.created} task${res.created === 1 ? "" : "s"}`);
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-primary"
          aria-label="AI assistant"
        >
          <Sparkles className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI assistant
          </DialogTitle>
          <DialogDescription>
            Share a screenshot — an interview invite, a schedule, a flyer — and
            I&apos;ll plan tasks for the week. Your image is analyzed and
            discarded, never stored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onPick}
          />
          {preview ? (
            <div className="overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Selected"
                className="max-h-48 w-full object-contain bg-muted/30"
              />
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="h-24 w-full border-dashed"
            >
              <Upload className="size-4" />
              Choose an image
            </Button>
          )}

          {preview && (
            <>
              <Input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Optional: add context (e.g. 'Backend role, remote')"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  onClick={analyze}
                  disabled={analyzing}
                  className="flex-1"
                >
                  {analyzing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {rows.length ? "Re-analyze" : "Analyze & plan"}
                </Button>
              </div>
            </>
          )}

          {/* Plan */}
          {summary && (
            <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              {summary}
            </p>
          )}

          {rows.length > 0 && (
            <div className="space-y-1.5">
              {rows.map((r, i) => (
                <label
                  key={i}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 text-sm transition-colors",
                    r.include ? "border-primary/40 bg-primary/5" : "opacity-60",
                  )}
                >
                  <Checkbox
                    checked={r.include}
                    onCheckedChange={(v) =>
                      setRows((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, include: v === true } : x,
                        ),
                      )
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.title}</span>
                      <Badge
                        variant="secondary"
                        className="capitalize"
                      >
                        {r.priority}
                      </Badge>
                    </div>
                    {r.due_date && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {format(parseISO(r.due_date), "EEE, MMM d")}
                      </span>
                    )}
                    {r.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.notes}
                      </p>
                    )}
                  </div>
                </label>
              ))}

              <Button
                type="button"
                onClick={commit}
                disabled={committing}
                className="mt-2 w-full"
              >
                {committing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Add {rows.filter((r) => r.include).length} tasks
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
