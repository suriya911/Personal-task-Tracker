"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Paperclip, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number | null;
  storage_path: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const BUCKET = "task-attachments";

function humanSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsPanel({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("task_attachments")
      .select("id, file_name, file_size, storage_path")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setItems(data ?? []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) return void toast.error("File exceeds 5 MB");
    if (!ALLOWED.includes(file.type))
      return void toast.error("Unsupported file type");

    start(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return void toast.error("Not signed in");

      const path = `${user.id}/${taskId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);
      if (upErr) return void toast.error(upErr.message);

      const { data, error } = await supabase
        .from("task_attachments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          storage_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .select("id, file_name, file_size, storage_path")
        .single();
      if (error) return void toast.error(error.message);
      setItems((x) => [...x, data]);
    });
  }

  function download(item: Attachment) {
    start(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(item.storage_path, 60);
      if (error || !data) return void toast.error(error?.message ?? "Failed");
      window.open(data.signedUrl, "_blank");
    });
  }

  function remove(item: Attachment) {
    start(async () => {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([item.storage_path]);
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", item.id);
      if (error) return void toast.error(error.message);
      setItems((x) => x.filter((i) => i.id !== item.id));
    });
  }

  return (
    <div className="space-y-2">
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading files…</p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
          >
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{item.file_name}</span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {humanSize(item.file_size)}
            </span>
            <button
              type="button"
              onClick={() => download(item)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Download"
            >
              <Download className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => remove(item)}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              aria-label="Delete file"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onPick}
        accept={ALLOWED.join(",")}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Paperclip className="size-4" />
        )}
        Attach file
      </Button>
    </div>
  );
}
