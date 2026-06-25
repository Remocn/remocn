"use client";

import { BlurIn } from "@/registry/remocn-ui/blur-in";
import { useBlurInTransition } from "@/registry/remocn-ui/blur-in/use-blur-in-transition";

export const blurInExampleControls = ["blur", "distance", "direction"] as const;

export interface BlurInExampleProps {
  blur?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
}

export const BlurInExampleScene = (p: BlurInExampleProps = {}) => {
  const style = useBlurInTransition(
    [
      { at: 0, state: "hidden" },
      { at: 8, state: "revealed", duration: 18 },
    ],
    {
      blur: p.blur,
      distance: p.distance,
      direction: p.direction ?? "up",
    },
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <BlurIn style={style}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 120,
            borderRadius: 16,
            border: "1px solid #e5e5e5",
            background: "#fafafa",
            color: "#171717",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          Blur In
        </div>
      </BlurIn>
    </div>
  );
};

export const blurInExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const blur = values.blur as number | undefined;
  const distance = values.distance as number | undefined;
  const direction = values.direction as string | undefined;

  const hookOpts: string[] = [];
  if (direction !== undefined && direction !== "up")
    hookOpts.push(`direction: "${direction}"`);
  if (blur !== undefined && blur !== 8) hookOpts.push(`blur: ${blur}`);
  if (distance !== undefined && distance !== 12)
    hookOpts.push(`distance: ${distance}`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { BlurIn } from "@/components/remocn/blur-in";
import { useBlurInTransition } from "@/components/remocn/use-blur-in-transition";

export const Scene = () => {
  const style = useBlurInTransition([
    { at: 0, state: "hidden" },
    { at: 8, state: "revealed", duration: 18 },
  ]${optsStr});

  return (
    <BlurIn style={style}>
      <div className="rounded-2xl border px-8 py-6">Blur In</div>
    </BlurIn>
  );
};`;
};
