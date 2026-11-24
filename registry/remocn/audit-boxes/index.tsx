"use client";

import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import {
  AUDIT_COLORS,
  AuditClock,
  DEMO,
  DEMO_WINDOW,
  DemoDashboard,
  FONT,
  type Issue,
  MONO,
  midway,
  OutlineBox,
  Pill,
  progress,
  type Rect,
  useAuditFrame,
} from "@/lib/remocn/audit-core";
import { useSceneConfig } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import {
  type ResolvedTimeline,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import { type AuditBoxesElementId, auditBoxesTimeline } from "./timeline";

export type AuditBoxesProps = {
  /** UI to audit, laid out in a 1280x720 frame. Defaults to a demo calendar dashboard. */
  children?: ReactNode;
  /** Off-spec elements, in frame pixels, with the fix each one needs. */
  issues?: Issue[];
  color?: string;
  background?: string;
  /** Word after the running count. Empty hides the counter. */
  counterLabel?: string;
  /** Frames between one box and the next. */
  stagger?: number;
  speed?: number;
  /**
   * Moves, trims or stretches the counter and single boxes, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<AuditBoxesElementId>;
};

export const auditBoxesDefaults = {
  color: AUDIT_COLORS.audit,
  background: AUDIT_COLORS.stage,
  counterLabel: "issues",
  stagger: 4,
  speed: 1,
};

export const auditBoxesLength = 56;

type BoxesSchedule = ResolvedTimeline<AuditBoxesElementId>;

export function AuditBoxes(props: AuditBoxesProps) {
  const { speed = 1, timing } = props;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    auditBoxesTimeline,
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

/** Where an issue's note sits against its box. */
const BOX_NOTE_SPOT = {
  start: (r: Rect) => ({
    x: r.x - 3,
    y: r.y - 3,
    anchor: "aboveStart" as const,
  }),
  end: (r: Rect) => ({
    x: r.x + r.w + 3,
    y: r.y - 3,
    anchor: "aboveEnd" as const,
  }),
  below: (r: Rect) => ({
    x: r.x - 3,
    y: r.y + r.h + 3,
    anchor: "belowStart" as const,
  }),
};

function Scene({
  children,
  issues = children ? [] : DEMO.before.issues,
  color = auditBoxesDefaults.color,
  background = auditBoxesDefaults.background,
  counterLabel = auditBoxesDefaults.counterLabel,
  tl,
}: AuditBoxesProps & { tl: BoxesSchedule }) {
  const boxes = issues.map((_, i) => tl.get(`box:${i}`));
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={1} />}
      {/* Every issue boxed, with its note popping on once the box closes. */}
      {issues.map((issue, i) => (
        <div key={`${issue.rect.x}-${issue.rect.y}-${issue.note}`}>
          <OutlineBox rect={issue.rect} color={color} delay={boxes[i].start} />
          <Pill
            {...BOX_NOTE_SPOT[issue.side ?? "start"](issue.rect)}
            text={issue.note}
            color={color}
            delay={boxes[i].start + boxes[i].beat("note")}
          />
        </div>
      ))}
      {counterLabel && (
        <Counter
          starts={boxes.map((b) => b.start)}
          tl={tl}
          color={color}
          label={counterLabel}
        />
      )}
    </AbsoluteFill>
  );
}

/** Count chip above the frame's top right that ticks up with every box. */
function Counter({
  starts,
  tl,
  color,
  label,
}: {
  starts: number[];
  tl: BoxesSchedule;
  color: string;
  label: string;
}) {
  const glide = useGlide();
  const frame = useAuditFrame();
  // One more for every box that has started drawing.
  let count = 0;
  while (count < starts.length && frame >= starts[count]) count++;
  const counter = tl.get("counter");
  const show = progress(frame, counter.start, counter.length);
  return (
    <div
      style={{
        position: "absolute",
        right: 1280 - DEMO_WINDOW.x - DEMO_WINDOW.w,
        top: 24,
        opacity: show,
        transform: `translateY(${(1 - show) * -6}px)${glide(midway(show))}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: MONO,
        fontSize: 12,
        color: AUDIT_COLORS.ink,
      }}
    >
      <span
        style={{
          background: color,
          color: "#fff",
          borderRadius: 4,
          padding: "2px 7px",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </span>
      {label}
    </div>
  );
}
