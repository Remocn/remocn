"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const RemocnShader = dynamic(
  () => import("@/components/RemocnShader.webgl").then((m) => m.RemocnShader),
  { ssr: false },
);

const BACKGROUND = { dark: "#090b0c", light: "#ffffff" };

const MASK =
  "[mask-image:radial-gradient(ellipse_92%_68%_at_50%_58%,black_14%,transparent_84%),linear-gradient(to_bottom,transparent_4%,black_30%,black_88%,transparent_100%),radial-gradient(ellipse_44%_30%_at_50%_31%,transparent_46%,black_92%)]";

export function HeroTerminalBg() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`absolute inset-x-0 -top-[388px] h-[150vh] [mask-composite:intersect] ${MASK}`}
    >
      <RemocnShader
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        background={BACKGROUND}
      />
    </div>
  );
}
