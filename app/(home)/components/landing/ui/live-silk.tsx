"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";
import Silk from "@/components/Silk";
import { cn } from "@/lib/utils";

const RESTORE_DELAY_MS = 400;
const MAX_RESTORES = 3;

export function LiveSilk({
  className,
  ...props
}: Omit<ComponentProps<typeof Silk>, "className"> & { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Mounted the first time it comes near and kept after that: Silk stops
    // drawing off screen by itself, while unmounting would rebuild the WebGL
    // context and recompile its shaders on every return (a ~400ms freeze).
    // Coming back replays the intro instead, as a fresh mount used to.
    let mounted = false;
    let left = false;
    const view = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          left = mounted;
          return;
        }
        if (left) setIntroKey((value) => value + 1);
        mounted = true;
        left = false;
        setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    view.observe(host);

    let timer = 0;
    let restores = 0;
    const onLost = () => {
      if (restores >= MAX_RESTORES) return;
      restores += 1;
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => setGeneration((value) => value + 1),
        RESTORE_DELAY_MS,
      );
    };
    host.addEventListener("webglcontextlost", onLost, true);

    return () => {
      view.disconnect();
      window.clearTimeout(timer);
      host.removeEventListener("webglcontextlost", onLost, true);
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden="true" className={cn(className)}>
      {near && <Silk key={generation} introKey={introKey} {...props} />}
    </div>
  );
}
