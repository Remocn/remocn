"use client";

import { AbsoluteFill } from "remotion";
import { ValueSwap } from "@/registry/remocn/value-swap";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

export function ValueSwapExampleScene({
  duration,
  distance,
  direction,
}: {
  duration?: number;
  distance?: number;
  direction?: "up" | "down";
}) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 40,
          fontWeight: 600,
          color: "#f2f2f2",
        }}
      >
        <ValueSwap
          values={["Draft", "In review", "Shipped"]}
          at={[30, 60]}
          duration={duration}
          distance={distance}
          direction={direction}
        />
      </span>
    </AbsoluteFill>
  );
}

export const valueSwapExampleCode = (
  values: Record<string, unknown>,
): string => {
  const duration = (values.duration as number) ?? 10;
  const distance = (values.distance as number) ?? 12;
  const direction = (values.direction as string) ?? "up";
  return `import { ValueSwap } from "@/components/remocn/value-swap";

export const MyScene = () => (
  <span style={{ fontSize: 40, fontWeight: 600 }}>
    <ValueSwap
      values={["Draft", "In review", "Shipped"]}
      at={[30, 60]}
      duration={${duration}}
      distance={${distance}}
      direction="${direction}"
    />
  </span>
);`;
};
