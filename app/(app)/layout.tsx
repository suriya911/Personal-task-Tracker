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
    <div className="relative flex min-h-full flex-1 flex-col">
      {/* Ambient wallpaper glow — sits behind every glass surface (header,
          sidebar, cards, floating pill) so the blur has color to catch. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute top-1/3 -right-24 size-96 rounded-full bg-blue-500/10 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 size-96 rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-foreground/10 bg-card/40 px-4 backdrop-blur-2xl backdrop-saturate-150 sm:px-6">
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
