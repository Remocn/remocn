"use client";

import { AbsoluteFill } from "remotion";
import { RolodexFlip } from "@/registry/remocn/rolodex-flip";

const MONO_FONT =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

export function RolodexFlipExampleScene({
  interval,
  flipDuration,
}: {
  interval?: number;
  flipDuration?: number;
}) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: MONO_FONT, fontSize: 36 }}>
        <span style={{ color: "#6f6c7a" }}>$ </span>
        <span style={{ color: "#8a8794" }}>npx shadcn add </span>
        <span style={{ color: "#f2f2f2" }}>
          <RolodexFlip
            items={["button", "dialog", "command", "tabs", "chart-area"]}
            interval={interval}
            flipDuration={flipDuration}
          />
        </span>
      </span>
    </AbsoluteFill>
  );
}

export const rolodexFlipExampleCode = (
  values: Record<string, unknown>,
): string => {
  const interval = (values.interval as number) ?? 20;
  const flipDuration = (values.flipDuration as number) ?? 10;
  return `import { RolodexFlip } from "@/components/remocn/rolodex-flip";

export const MyScene = () => (
  <span style={{ fontFamily: "monospace", fontSize: 36 }}>
    $ npx shadcn add{" "}
    <RolodexFlip
      items={["button", "dialog", "command", "tabs", "chart-area"]}
      interval={${interval}}
      flipDuration={${flipDuration}}
    />
  </span>
);`;
};
