import { redirect } from "next/navigation";
import { CheckCircle2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { getSidebarData } from "@/lib/queries/sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandMenu } from "@/components/layout/command-menu";
import { AssistantDialog } from "@/components/ai/assistant-dialog";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Belt-and-suspenders with middleware. When Supabase isn't configured yet,
  // fall through and let the page render its "not connected" panel.
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  const email = user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = email.charAt(0).toUpperCase() || "?";

  const sidebar = user ? await getSidebarData() : null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-card/60 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-5 text-primary" />
          <span>Task Manager</span>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <AssistantDialog />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {email}
            </span>
            <Avatar className="size-7">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={email} />}
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
            <form action={signOut}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    aria-label="Sign out"
                  >
                    <LogOut className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </form>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {sidebar && <Sidebar data={sidebar} />}
        <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>
      </div>

      {sidebar && <MobileNav />}
      {sidebar && (
        <CommandMenu
          projects={sidebar.projects.map((p) => ({ id: p.id, name: p.name }))}
        />
      )}
    </div>
  );
}
