import {
  linearTiming,
  type TransitionPresentation,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Studio review shelves for the motion pack. Each shelf file exports a list of
 * these entries; `motion-pack-root.tsx` turns them into Studio compositions.
 */
export interface DraftEntry {
  id: string;
  // biome-ignore lint/suspicious/noExplicitAny: demo props differ per draft
  component: React.ComponentType<any>;
  durationInFrames: number;
  defaultProps?: Record<string, unknown>;
}

export interface DraftShelf {
  id: string;
  entries: DraftEntry[];
}

export const INK = "#111111";
export const BRAND = "#E5322D";
export const PAPER = "#FFFFFF";
export const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function Label({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        fontFamily: FONT,
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color,
      }}
    >
      {text}
    </span>
  );
}

/** Outgoing demo scene: ink background, white square. */
export function SceneA({ label = "Scene A" }: { label?: string }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: INK,
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div style={{ width: 160, height: 160, backgroundColor: PAPER }} />
      <Label text={label} color={PAPER} />
    </AbsoluteFill>
  );
}

/** Incoming demo scene: brand red background, white circle. */
export function SceneB({ label = "Scene B" }: { label?: string }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND,
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div
        style={{
          width: 170,
          height: 170,
          borderRadius: "50%",
          backgroundColor: PAPER,
        }}
      />
      <Label text={label} color={PAPER} />
    </AbsoluteFill>
  );
}

/** Placeholder brand lockup: red rounded mark plus a wordmark. */
export function DemoLogo({
  scale = 1,
  color = PAPER,
}: {
  scale?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28 * scale,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 32,
          backgroundColor: BRAND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: INK,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 104,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color,
        }}
      >
        remocn
      </span>
    </div>
  );
}

const HOLD = 40;

export function transitionDemoDuration(transitionFrames: number) {
  return HOLD * 2 + transitionFrames;
}

/** Scene A -> transition -> Scene B, holding each scene for a beat. */
export function TransitionDemo({
  presentation,
  transitionFrames,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: presentations carry their own prop types
  presentation: TransitionPresentation<any>;
  transitionFrames: number;
}) {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={HOLD + transitionFrames}>
        <SceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: transitionFrames })}
        presentation={presentation}
      />
      <TransitionSeries.Sequence durationInFrames={HOLD + transitionFrames}>
        <SceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
