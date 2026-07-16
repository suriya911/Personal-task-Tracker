import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { getProjects } from "@/lib/queries/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-10 sm:pt-16">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center gap-2">
          <FolderKanban className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Projects</h1>
        </header>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create one from the sidebar to group related tasks.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => {
              const pct =
                p.taskCount === 0 ? 0 : (p.doneCount / p.taskCount) * 100;
              return (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="truncate text-base">
                          {p.name}
                        </CardTitle>
                        <Badge variant="secondary" className="capitalize">
                          {p.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {p.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {p.doneCount} / {p.taskCount} done
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
