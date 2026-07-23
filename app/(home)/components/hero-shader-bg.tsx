"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// `@paper-design/shaders-react` pulls in a WebGL runtime — heavy and useless on
// the server. Load it client-only so it stays out of the initial landing bundle;
// the `mounted` gate below already keeps it from rendering before hydration.
const NeuroNoise = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.NeuroNoise),
  { ssr: false },
);

const NEURO_COLORS = {
  light: { front: "#8f8f94", mid: "#e7e7e9", back: "#ffffff" },
  dark: { front: "#6e6e74", mid: "#28282c", back: "#191919" },
};

export function HeroNeuroBg() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const colors = NEURO_COLORS[resolvedTheme === "dark" ? "dark" : "light"];
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-22 h-screen opacity-90 [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,black_55%,transparent_98%),radial-gradient(ellipse_60%_45%_at_50%_32%,transparent_38%,black_82%)]">
      <NeuroNoise
        className="h-full w-full"
        colorFront={colors.front}
        colorMid={colors.mid}
        colorBack={colors.back}
        brightness={0.05}
        contrast={0.35}
        speed={0.3}
      />
    </div>
  );
}
