"use client";

import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import {
  AUDIT_COLORS,
  AuditClock,
  DEMO,
  DemoDashboard,
  easeInOut,
  FONT,
  type Measure,
  MeasureMarks,
  type RadiusMark,
  useAuditFrame,
} from "@/lib/remocn/audit-core";
import { useSceneConfig } from "@/lib/remocn/frame-rate";
import {
  type ResolvedTimeline,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  MARK_STAGGER,
  type RedlineMeasureElementId,
  redlineMeasureTimeline,
} from "./timeline";

export type RedlineMeasureProps = {
  /** UI to measure, laid out in a 1280x720 frame. Defaults to a demo calendar dashboard. */
  children?: ReactNode;
  /** Distances to draw, in frame pixels. Defaults to spacing on the demo dashboard. */
  measures?: Measure[];
  /** Corners whose radius gets an arc and a label. */
  radii?: RadiusMark[];
  color?: string;
  background?: string;
  /** How far the UI fades toward the background so the marks read, 0 to 1. */
  dim?: number;
  /** Frames between one mark and the next. */
  stagger?: number;
  speed?: number;
  /**
   * Moves, trims or stretches the dimming and the marks, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<RedlineMeasureElementId>;
};

export const redlineMeasureDefaults = {
  color: AUDIT_COLORS.audit,
  background: AUDIT_COLORS.stage,
  dim: 0.18,
  stagger: MARK_STAGGER,
  speed: 1,
};

export const redlineMeasureLength = 63;

export function RedlineMeasure(props: RedlineMeasureProps) {
  const { speed = 1, timing } = props;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    redlineMeasureTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  return (
    <AuditClock speed={speed}>
      <Scene {...props} tl={tl} />
    </AuditClock>
  );
}

function Scene({
  children,
  measures = children ? [] : DEMO.before.measures,
  radii = children ? [] : DEMO.before.radii,
  color = redlineMeasureDefaults.color,
  background = redlineMeasureDefaults.background,
  dim = redlineMeasureDefaults.dim,
  tl,
}: RedlineMeasureProps & { tl: ResolvedTimeline<RedlineMeasureElementId> }) {
  const frame = useAuditFrame();
  const dimEl = tl.get("dim");
  const marks = tl.get("marks");
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={1} />}
      <AbsoluteFill
        style={{
          background,
          opacity: easeInOut(frame, [dimEl.start, dimEl.end], [0, dim]),
        }}
      />
      <MeasureMarks
        measures={measures}
        radii={radii}
        color={color}
        start={marks.start}
        stagger={marks.beat("stagger")}
      />
    </AbsoluteFill>
  );
}
