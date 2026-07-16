"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Note {
  id: string;
  body: string;
  created_at: string;
}

export function NotesPanel({ taskId }: { taskId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("task_notes")
      .select("id, body, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setNotes(data ?? []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  function add() {
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return void toast.error("Not signed in");
      const { data, error } = await supabase
        .from("task_notes")
        .insert({ task_id: taskId, user_id: user.id, body: text })
        .select("id, body, created_at")
        .single();
      if (error) return void toast.error(error.message);
      setNotes((n) => [...n, data]);
      setBody("");
    });
  }

  function remove(id: string) {
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("task_notes").delete().eq("id", id);
      if (error) return void toast.error(error.message);
      setNotes((n) => n.filter((x) => x.id !== id));
    });
  }

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading notes…</p>
      ) : (
        notes.map((n) => (
          <div
            key={n.id}
            className="group flex items-start gap-2 rounded-md bg-muted/40 p-2 text-sm"
          >
            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
              {n.body}
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {format(new Date(n.created_at), "MMM d")}
              </span>
              <button
                type="button"
                onClick={() => remove(n.id)}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                aria-label="Delete note"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))
      )}

      <div className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          disabled={pending || !body.trim()}
        >
          {pending ? <Loader2 className="animate-spin" /> : "Add"}
        </Button>
      </div>
    </div>
  );
}
