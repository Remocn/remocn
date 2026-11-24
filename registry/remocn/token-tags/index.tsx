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
  type TokenSpec,
  TokenTag,
  useAuditFrame,
} from "@/lib/remocn/audit-core";
import { useSceneConfig } from "@/lib/remocn/frame-rate";
import {
  type ResolvedTimeline,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import { type TokenTagsElementId, tokenTagsTimeline } from "./timeline";

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
  /**
   * Moves, trims or stretches the wash and single tags, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<TokenTagsElementId>;
};

export const tokenTagsDefaults = {
  lineColor: AUDIT_COLORS.ink,
  background: AUDIT_COLORS.stage,
  stagger: 6,
  speed: 1,
};

export const tokenTagsLength = 61;

export function TokenTags(props: TokenTagsProps) {
  const { speed = 1, timing } = props;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    tokenTagsTimeline,
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
  tokens = children ? [] : DEMO.after.tokens,
  focus = children ? null : DEMO.after.cardRow,
  lineColor = tokenTagsDefaults.lineColor,
  background = tokenTagsDefaults.background,
  tl,
}: TokenTagsProps & { tl: ResolvedTimeline<TokenTagsElementId> }) {
  const frame = useAuditFrame();
  const wash = focus ? tl.get("wash") : null;
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={2} />}
      {focus && wash && (
        <Spotlight
          rect={focus}
          color={background}
          opacity={easeInOut(frame, [wash.start, wash.end], [0, 1])}
        />
      )}
      {tokens.map((tag, i) => (
        <TokenTag
          key={`${tag.label}-${tag.anchor.join()}`}
          anchor={tag.anchor}
          at={tag.at}
          label={tag.label}
          swatch={tag.swatch}
          lineColor={lineColor}
          delay={tl.get(`tag:${i}`).start}
        />
      ))}
    </AbsoluteFill>
  );
}
