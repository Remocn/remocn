"use client";

import {
  installInStudio,
  isInsideStudio,
  type StudioElementPayload,
  setStudioDragData,
} from "@remotion/studio-protocol";
import { GripVerticalIcon, Loader2Icon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Remotion } from "@/components/ui/svgs/remotion";
import { useTrackEvent } from "@/lib/analytics";

type Status = "idle" | "pending" | "success" | "error";

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
  const [isEmbeddedInStudio, setIsEmbeddedInStudio] = useState<boolean | null>(
    null,
  );
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    setIsEmbeddedInStudio(isInsideStudio());
  }, []);

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
      setStatus("success");
      setMessage(
        `Sent to Remotion Studio${result.target.projectName === null ? "" : ` (${result.target.projectName})`}.`,
      );
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
        {status === "success"
          ? "Sent to Remotion Studio"
          : "Add to Remotion Studio"}
      </Button>
      {isEmbeddedInStudio === false ? (
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
      ) : null}
    </div>
  );
}
