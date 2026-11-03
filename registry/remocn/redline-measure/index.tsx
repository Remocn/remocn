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
};

export const redlineMeasureDefaults = {
  color: AUDIT_COLORS.audit,
  background: AUDIT_COLORS.stage,
  dim: 0.18,
  stagger: 5,
  speed: 1,
};

export const redlineMeasureLength = 63;

const START = 8;

export function RedlineMeasure(props: RedlineMeasureProps) {
  const { speed = 1 } = props;
  return (
    <AuditClock speed={speed}>
      <Scene {...props} />
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
  stagger = redlineMeasureDefaults.stagger,
}: RedlineMeasureProps) {
  const frame = useAuditFrame();
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={1} />}
      <AbsoluteFill
        style={{ background, opacity: easeInOut(frame, [0, 10], [0, dim]) }}
      />
      <MeasureMarks
        measures={measures}
        radii={radii}
        color={color}
        start={START}
        stagger={stagger}
      />
    </AbsoluteFill>
  );
}
