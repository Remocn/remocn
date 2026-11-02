"use client";

import {
  installInStudio,
  isInsideStudio,
  type StudioElementPayload,
  setStudioDragData,
} from "@remotion/studio-protocol";
import { Loader2Icon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Status = "idle" | "pending" | "success" | "error";

/** Raised button on the dark player toolbar. */
const STUDIO_BUTTON =
  "flex h-[34px] shrink-0 cursor-pointer items-center rounded-control-sm border border-dark-border bg-dark-raised text-caption whitespace-nowrap text-[#fafafa] outline-none transition-colors duration-150 hover:bg-[#25282b] focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default dark:border-hairline dark:bg-secondary dark:hover:bg-[#33363b]";

const GRIP_DOTS = [
  [9, 6],
  [15, 6],
  [9, 12],
  [15, 12],
  [9, 18],
  [15, 18],
] as const;

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
    <div className="flex min-w-0 items-center gap-1">
      <output
        aria-live="polite"
        className="truncate text-mono text-dark-subtle max-md:sr-only"
      >
        {message}
      </output>
      <button
        type="button"
        onClick={handleInstall}
        disabled={status === "pending"}
        className={cn(STUDIO_BUTTON, "gap-2 px-3 max-md:h-11 max-md:gap-[7px]")}
      >
        {status === "pending" ? (
          <Loader2Icon className="size-3.5 animate-spin motion-reduce:animate-[spin_2s_linear_infinite]" />
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
            <path
              d="M7 4.5v15l12.5-7.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {status === "success"
          ? "Sent to Remotion Studio"
          : "Add to Remotion Studio"}
      </button>
      {isEmbeddedInStudio === false ? (
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          aria-label="Drag into Remotion Studio"
          title="Drag into Remotion Studio"
          className={cn(
            STUDIO_BUTTON,
            "w-[34px] cursor-grab justify-center text-dark-subtle active:cursor-grabbing max-md:hidden",
          )}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
            {GRIP_DOTS.map(([cx, cy]) => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="1.5"
                fill="currentColor"
              />
            ))}
          </svg>
        </button>
      ) : null}
    </div>
  );
}
