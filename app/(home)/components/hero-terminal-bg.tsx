"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const FaultyTerminal = dynamic(() => import("@/components/FaultyTerminal"), {
  ssr: false,
});

const MASK =
  "[mask-image:radial-gradient(ellipse_92%_68%_at_50%_58%,black_14%,transparent_84%),linear-gradient(to_bottom,transparent_4%,black_30%,black_88%,transparent_100%),radial-gradient(ellipse_44%_30%_at_50%_31%,transparent_46%,black_92%)]";

export function HeroTerminalBg() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!mounted) return null;

  const light = resolvedTheme !== "dark";

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 -top-22 h-screen [mask-composite:intersect] ${MASK}`}
    >
      <FaultyTerminal
        className="h-full w-full opacity-35 mix-blend-multiply dark:opacity-[0.18] dark:mix-blend-normal"
        lightMode={light}
        tint="#e5e5e5"
        timeScale={reduced ? 0 : 0.2}
        pause={reduced}
        scanlineIntensity={0.25}
        glitchAmount={0.6}
        flickerAmount={0.5}
        curvature={0.15}
        brightness={light ? 1 : 0.7}
        mouseReact={false}
        pageLoadAnimation={false}
        timeOffset={0}
      />
    </div>
  );
}
