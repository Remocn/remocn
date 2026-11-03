"use client";

import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import {
  AUDIT_COLORS,
  AuditClock,
  DEMO,
  DemoDashboard,
  FONT,
  GuideMarks,
  type GuideSpec,
} from "@/lib/remocn/audit-core";

export type LayoutGuidesProps = {
  /** UI to lay guides over, in a 1280x720 frame. Defaults to a demo calendar dashboard. */
  children?: ReactNode;
  /** Column edges, highlight, ruler and now line, in frame pixels. */
  guides?: GuideSpec;
  color?: string;
  /** Color of the now line and its label. */
  nowColor?: string;
  background?: string;
  speed?: number;
};

export const layoutGuidesDefaults = {
  color: AUDIT_COLORS.fix,
  nowColor: AUDIT_COLORS.scan,
  background: AUDIT_COLORS.stage,
  speed: 1,
};

export const layoutGuidesLength = 54;

export function LayoutGuides(props: LayoutGuidesProps) {
  const { speed = 1 } = props;
  return (
    <AuditClock speed={speed}>
      <Scene {...props} />
    </AuditClock>
  );
}

function Scene({
  children,
  guides = children ? undefined : DEMO.after.guides,
  color = layoutGuidesDefaults.color,
  nowColor = layoutGuidesDefaults.nowColor,
  background = layoutGuidesDefaults.background,
}: LayoutGuidesProps) {
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={2} />}
      {guides && (
        <GuideMarks
          guides={guides}
          color={color}
          nowColor={nowColor}
          start={8}
        />
      )}
    </AbsoluteFill>
  );
}
