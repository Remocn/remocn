"use client";

import { spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  columnsOf,
  DEFAULT_FROM,
  DEFAULT_TO,
  type SlotMachineRollElementId,
  slotMachineRollTimeline,
} from "./timeline";

export interface SlotMachineRollProps {
  from?: string;
  to?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches single columns, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<SlotMachineRollElementId>;
}

export function SlotMachineRoll(props: SlotMachineRollProps) {
  const {
    from = DEFAULT_FROM,
    to = DEFAULT_TO,
    fontSize = 120,
    color = "#171717",
    fontWeight = 700,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const current = useSceneFrame();
  const { fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    slotMachineRollTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const { len, from: paddedFrom, to: paddedTo } = columnsOf(from, to);

  const columns = [];
  for (let i = 0; i < len; i++) {
    const { start } = tl.get(`column:${i}`);
    const roll = (f: number) => {
      const raw = spring({
        frame: f * speed - start,
        fps,
        config: { damping: 14 },
      });
      return Math.max(0, Math.min(1, raw)) * fontSize * 1.1;
    };
    const y = roll(current);
    const moving =
      Math.abs(roll(current + 1) - y) > 1e-3 ||
      Math.abs(y - roll(current - 1)) > 1e-3;
    columns.push(
      <span
        key={i}
        style={{
          display: "inline-block",
          overflow: "hidden",
          height: "1.1em",
          lineHeight: "1.1em",
          verticalAlign: "top",
          width: "0.7em",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            transform: `translateY(${-y}px)${glide(moving)}`,
          }}
        >
          <span>{paddedFrom[i]}</span>
          <span>{paddedTo[i]}</span>
        </span>
      </span>,
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.03em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
          lineHeight: 1.1,
        }}
      >
        {columns}
      </span>
    </div>
  );
}
