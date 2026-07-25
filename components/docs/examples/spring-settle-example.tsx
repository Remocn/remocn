"use client";

import { AbsoluteFill } from "remotion";
import {
  SpringSettleItem,
  SpringSettleScenes,
} from "@/registry/remocn/spring-settle";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function Scene({
  title,
  note,
  accent,
}: {
  title: string;
  note: string;
  accent: string;
}) {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <SpringSettleItem
        index={0}
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 88,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "#f2f2f2",
        }}
      >
        {title}
      </SpringSettleItem>
      <SpringSettleItem
        index={1}
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 26,
          fontWeight: 400,
          color: "rgba(242,242,242,0.5)",
        }}
      >
        {note}
      </SpringSettleItem>
      <SpringSettleItem index={2} style={{ marginTop: 8 }}>
        <div style={{ width: 120, height: 3, background: accent }} />
      </SpringSettleItem>
    </AbsoluteFill>
  );
}

interface SpringSettleExampleProps {
  enterScale?: number;
  enterStagger?: number;
  exitScale?: number;
  exitFrames?: number;
}

export function SpringSettleExampleScene({
  enterScale = 1.24,
  enterStagger = 3,
  exitScale = 0.84,
  exitFrames = 6,
}: SpringSettleExampleProps) {
  return (
    <SpringSettleScenes
      loop
      config={{ enterScale, enterStagger, exitScale, exitFrames }}
      scenes={[
        {
          name: "a",
          bg: "#141318",
          content: (
            <Scene
              title="Shrink"
              note="the scene leaves as one group"
              accent="#6c6ae8"
            />
          ),
        },
        {
          name: "b",
          bg: "#1a1922",
          content: (
            <Scene
              title="Hold"
              note="one empty frame, the stage changes colour"
              accent="#e8776c"
            />
          ),
        },
        {
          name: "c",
          bg: "#12171a",
          content: (
            <Scene
              title="Land"
              note="items settle in, staggered, from above"
              accent="#6ce8b0"
            />
          ),
        },
      ]}
    />
  );
}

export const springSettleExampleCode = (
  values: Record<string, unknown>,
): string => {
  const enterScale = (values.enterScale as number) ?? 1.24;
  const enterStagger = (values.enterStagger as number) ?? 3;
  const exitScale = (values.exitScale as number) ?? 0.84;
  const exitFrames = (values.exitFrames as number) ?? 6;
  return `import {
  SpringSettleScenes,
  SpringSettleItem,
} from "@/components/remocn/spring-settle";

const Scene = ({ title, note }: { title: string; note: string }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <SpringSettleItem index={0}>{title}</SpringSettleItem>
    <SpringSettleItem index={1}>{note}</SpringSettleItem>
  </AbsoluteFill>
);

export const MyVideo = () => (
  <SpringSettleScenes
    config={{
      enterScale: ${enterScale},
      enterStagger: ${enterStagger},
      exitScale: ${exitScale},
      exitFrames: ${exitFrames},
    }}
    scenes={[
      { name: "a", bg: "#141318", durationInFrames: 70, content: <Scene title="Shrink" note="…" /> },
      { name: "b", bg: "#1a1922", durationInFrames: 70, content: <Scene title="Hold" note="…" /> },
      { name: "c", bg: "#12171a", durationInFrames: 70, content: <Scene title="Land" note="…" /> },
    ]}
  />
);`;
};
