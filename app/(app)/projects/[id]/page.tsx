import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries/projects";
import { getCategories } from "@/lib/queries/categories";
import { ProjectView } from "@/components/projects/project-view";
import { Badge } from "@/components/ui/badge";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ project, tasks, authed }, categories] = await Promise.all([
    getProject(id),
    getCategories(),
  ]);

  if (authed && !project) notFound();

  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-10 sm:pt-16">
      <div className="w-full max-w-[720px] space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {project?.name ?? "Project"}
            </h1>
            {project && (
              <Badge variant="secondary" className="capitalize">
                {project.status}
              </Badge>
            )}
          </div>
          {project?.description && (
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </header>

        {project && (
          <ProjectView
            projectId={project.id}
            initial={tasks}
            categories={categories}
          />
        )}
      </div>
    </main>
  );
}
