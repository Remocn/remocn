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
      className={`absolute inset-x-0 -top-22 h-screen [mask-composite:intersect] ${MASK}`}
    >
      <FaultyTerminal
        className="h-full w-full mix-blend-multiply dark:mix-blend-normal"
        lightMode={light}
        tint={light ? "#e879f9" : "#701a75"}
        scale={1.5}
        digitSize={1.2}
        timeScale={reduced ? 0 : 0.3}
        pause={reduced}
        scanlineIntensity={0.28}
        glitchAmount={1}
        flickerAmount={1}
        noiseAmp={1}
        chromaticAberration={0}
        dither={0}
        curvature={0.1}
        brightness={0.45}
        mouseReact={!reduced}
        mouseStrength={0.5}
        pageLoadAnimation={false}
        timeOffset={0}
      />
    </div>
  );
}
