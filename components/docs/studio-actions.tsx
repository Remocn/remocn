"use client";

import {
  installInStudio,
  type StudioElementPayload,
  setStudioDragData,
} from "@remotion/studio-protocol";
import { GripVerticalIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Remotion } from "@/components/ui/svgs/remotion";
import { useTrackEvent } from "@/lib/analytics";

type Status = "idle" | "pending" | "error";

export function StudioActions({
  name,
  payload,
}: {
  name: string;
  payload: StudioElementPayload;
}) {
  const trackEvent = useTrackEvent();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleInstall = async () => {
    if (status === "pending") return;
    setStatus("pending");
    setMessage(null);
    trackEvent("studio_install_clicked", { component: name });
    const result = await installInStudio({ payload });
    if (result.success) {
      setStatus("idle");
    } else {
      setStatus("error");
      setMessage(result.message);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setStatus("idle");
        setMessage(null);
      }, 6000);
    }
  };

  const handleDragStart = (event: React.DragEvent) => {
    setStudioDragData({ dataTransfer: event.dataTransfer, payload });
    trackEvent("studio_drag_started", { component: name });
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {message ? (
        <output
          aria-live="polite"
          className="truncate text-xs text-muted-foreground"
        >
          {message}
        </output>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        disabled={status === "pending"}
        className="text-muted-foreground hover:text-foreground"
      >
        {status === "pending" ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <Remotion className="size-3.5" />
        )}
        Add to Remotion Studio
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        draggable
        onDragStart={handleDragStart}
        aria-label="Drag into Remotion Studio"
        title="Drag into Remotion Studio"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-3.5" />
      </Button>
    </div>
  );
}
