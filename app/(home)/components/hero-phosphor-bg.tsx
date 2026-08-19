"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const Dithering = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.Dithering),
  { ssr: false },
);

const PHOSPHOR_INK = {
  light: "#0000001c",
  dark: "#ffffff28",
};

const MASKS = {
  screen:
    "[mask-image:radial-gradient(ellipse_92%_68%_at_50%_58%,black_14%,transparent_84%),linear-gradient(to_bottom,transparent_4%,black_30%,black_88%,transparent_100%),radial-gradient(ellipse_44%_30%_at_50%_31%,transparent_46%,black_92%)]",
  field:
    "[mask-image:radial-gradient(ellipse_86%_60%_at_50%_24%,black_18%,transparent_86%),linear-gradient(to_bottom,black_0%,black_46%,transparent_94%),radial-gradient(ellipse_42%_26%_at_50%_33%,transparent_48%,black_92%)]",
};

export function HeroPhosphorBg({
  variant = "screen",
}: {
  variant?: keyof typeof MASKS;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 -top-22 h-screen [mask-composite:intersect] ${MASKS[variant]}`}
    >
      <Dithering
        className="h-full w-full"
        colorBack="#00000000"
        colorFront={PHOSPHOR_INK[resolvedTheme === "dark" ? "dark" : "light"]}
        shape="simplex"
        type="4x4"
        size={3}
        scale={1.8}
        speed={reduced ? 0 : 0.1}
      />
    </div>
  );
}
