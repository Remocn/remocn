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
  IssueMarks,
  MONO,
  progress,
  useAuditFrame,
} from "@/lib/remocn/audit-core";

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
};

export const auditBoxesDefaults = {
  color: AUDIT_COLORS.audit,
  background: AUDIT_COLORS.stage,
  counterLabel: "issues",
  stagger: 4,
  speed: 1,
};

export const auditBoxesLength = 56;

const START = 10;

export function AuditBoxes(props: AuditBoxesProps) {
  const { speed = 1 } = props;
  return (
    <AuditClock speed={speed}>
      <Scene {...props} />
    </AuditClock>
  );
}

function Scene({
  children,
  issues = children ? [] : DEMO.before.issues,
  color = auditBoxesDefaults.color,
  background = auditBoxesDefaults.background,
  counterLabel = auditBoxesDefaults.counterLabel,
  stagger = auditBoxesDefaults.stagger,
}: AuditBoxesProps) {
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={1} />}
      <IssueMarks
        issues={issues}
        color={color}
        start={START}
        stagger={stagger}
      />
      {counterLabel && (
        <Counter
          total={issues.length}
          stagger={stagger}
          color={color}
          label={counterLabel}
        />
      )}
    </AbsoluteFill>
  );
}

/** Count chip above the frame's top right that ticks up with every box. */
function Counter({
  total,
  stagger,
  color,
  label,
}: {
  total: number;
  stagger: number;
  color: string;
  label: string;
}) {
  const frame = useAuditFrame();
  const count = Math.min(
    total,
    Math.max(0, Math.floor((frame - START) / stagger) + 1),
  );
  const show = progress(frame, START - 6, 10);
  return (
    <div
      style={{
        position: "absolute",
        right: 1280 - DEMO_WINDOW.x - DEMO_WINDOW.w,
        top: 24,
        opacity: show,
        transform: `translateY(${(1 - show) * -6}px)`,
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
