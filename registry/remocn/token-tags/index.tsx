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
  type Rect,
  Spotlight,
  TokenMarks,
  type TokenSpec,
  useAuditFrame,
} from "@/lib/remocn/audit-core";

export type TokenTagsProps = {
  /** UI to tag, laid out in a 1280x720 frame. Defaults to a demo calendar dashboard. */
  children?: ReactNode;
  /** Token tags: a dot on `anchor`, the chip centered on `at`, in frame pixels. */
  tokens?: TokenSpec[];
  /** Area kept bright while the rest washes out. `null` skips the wash. */
  focus?: Rect | null;
  lineColor?: string;
  background?: string;
  /** Frames between one tag and the next. */
  stagger?: number;
  speed?: number;
};

export const tokenTagsDefaults = {
  lineColor: AUDIT_COLORS.ink,
  background: AUDIT_COLORS.stage,
  stagger: 6,
  speed: 1,
};

export const tokenTagsLength = 61;

const START = 12;

export function TokenTags(props: TokenTagsProps) {
  const { speed = 1 } = props;
  return (
    <AuditClock speed={speed}>
      <Scene {...props} />
    </AuditClock>
  );
}

function Scene({
  children,
  tokens = children ? [] : DEMO.after.tokens,
  focus = children ? null : DEMO.after.cardRow,
  lineColor = tokenTagsDefaults.lineColor,
  background = tokenTagsDefaults.background,
  stagger = tokenTagsDefaults.stagger,
}: TokenTagsProps) {
  const frame = useAuditFrame();
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={2} />}
      {focus && (
        <Spotlight
          rect={focus}
          color={background}
          opacity={easeInOut(frame, [0, 12], [0, 1])}
        />
      )}
      <TokenMarks
        tokens={tokens}
        start={START}
        stagger={stagger}
        lineColor={lineColor}
      />
    </AbsoluteFill>
  );
}
