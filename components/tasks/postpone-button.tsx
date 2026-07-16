"use client";

import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PostponeButton({ onPostpone }: { onPostpone: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onPostpone}
          className="size-8 text-muted-foreground"
          aria-label="Postpone to tomorrow"
        >
          <CalendarClock className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Tomorrow</TooltipContent>
    </Tooltip>
  );
}
