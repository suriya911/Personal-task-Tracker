"use client";

import { useTheme } from "next-themes";
import { Images, Moon, Sun, MonitorSmartphone } from "lucide-react";
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
import {
  BACKDROPS,
  photoUrl,
  useBackdrop,
  type BackdropId,
} from "./backdrop";

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
              aria-label="Holiday theme"
            >
              <Images className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Holiday theme</TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className="max-h-[75vh] w-64 overflow-y-auto"
      >
        <DropdownMenuRadioGroup
          value={id}
          onValueChange={(v) => set(v as BackdropId)}
        >
          <DropdownMenuLabel>Holidays around the world</DropdownMenuLabel>
          {BACKDROPS.map((b) => (
            <DropdownMenuRadioItem key={b.id} value={b.id} className="gap-2">
              <span
                className="size-6 shrink-0 rounded-md border border-foreground/15 bg-cover bg-center"
                style={{ backgroundImage: `url(${photoUrl(b.id)})` }}
              />
              <span className="min-w-0">
                <span className="block truncate">{b.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {b.when}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={theme ?? "dark"}
          onValueChange={setTheme}
        >
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
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
