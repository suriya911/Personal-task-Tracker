"use client";

import { useTheme } from "next-themes";
import { Images, Moon, Sun, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BACKDROPS, PHOTOS, useBackdrop, type BackdropId } from "./backdrop";

/** Tiny gradient swatch that hints at each drawn scene; photo scenes use a
 *  thumbnail of the actual image instead. */
const SWATCH: Partial<Record<BackdropId, string>> = {
  aurora: "bg-gradient-to-br from-violet-500 via-fuchsia-400 to-blue-500",
  "winter-night": "bg-gradient-to-b from-indigo-900 via-indigo-700 to-slate-200",
  snowfall: "bg-gradient-to-b from-slate-300 to-blue-200",
  forest: "bg-gradient-to-b from-teal-400 to-emerald-800",
  minimal: "bg-gradient-to-b from-background to-muted",
};

export function BackdropPicker() {
  const { id, set } = useBackdrop();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              aria-label="Background & theme"
            >
              <Images className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Background & theme</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Background</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={id}
          onValueChange={(v) => set(v as BackdropId)}
        >
          {BACKDROPS.map((b) => (
            <DropdownMenuRadioItem key={b.id} value={b.id}>
              <span
                className={cn(
                  "mr-2 inline-block size-4 rounded-full border border-foreground/15 bg-cover bg-center",
                  SWATCH[b.id],
                )}
                style={
                  PHOTOS[b.id]
                    ? { backgroundImage: `url(${PHOTOS[b.id]})` }
                    : undefined
                }
              />
              {b.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme ?? "dark"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 size-4" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 size-4" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorSmartphone className="mr-2 size-4" /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
