"use client";

import { NeuroNoise } from "@paper-design/shaders-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const NEURO_COLORS = {
  light: { front: "#8d87b8", mid: "#e2e1ee", back: "#ffffff" },
  dark: { front: "#6a6390", mid: "#2a2740", back: "#1a1920" },
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
