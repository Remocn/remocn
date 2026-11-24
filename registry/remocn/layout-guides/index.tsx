"use client";

import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import {
  AUDIT_COLORS,
  AuditClock,
  DEMO,
  DemoDashboard,
  FONT,
  Guide,
  type GuideSpec,
  OutlineBox,
  Pill,
  Ruler,
} from "@/lib/remocn/audit-core";
import { useSceneConfig } from "@/lib/remocn/frame-rate";
import {
  type ResolvedTimeline,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import { type LayoutGuidesElementId, layoutGuidesTimeline } from "./timeline";

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
  /**
   * Moves, trims or stretches single column guides, the highlight, the
   * ruler and the now line, by the ids in `./timeline`. Frames on the scene
   * timeline, after `speed`.
   */
  timing?: Timing<LayoutGuidesElementId>;
};

export const layoutGuidesDefaults = {
  color: AUDIT_COLORS.fix,
  nowColor: AUDIT_COLORS.scan,
  background: AUDIT_COLORS.stage,
  speed: 1,
};

export const layoutGuidesLength = 54;

export function LayoutGuides(props: LayoutGuidesProps) {
  const { speed = 1, timing } = props;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    layoutGuidesTimeline,
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
  guides = children ? undefined : DEMO.after.guides,
  color = layoutGuidesDefaults.color,
  nowColor = layoutGuidesDefaults.nowColor,
  background = layoutGuidesDefaults.background,
  tl,
}: LayoutGuidesProps & { tl: ResolvedTimeline<LayoutGuidesElementId> }) {
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      {children ?? <DemoDashboard v={2} />}
      {guides && (
        <Marks guides={guides} color={color} nowColor={nowColor} tl={tl} />
      )}
    </AbsoluteFill>
  );
}

/** Column guides drop in, the highlight fills, then the now line slides across. */
function Marks({
  guides,
  color,
  nowColor,
  tl,
}: {
  guides: GuideSpec;
  color: string;
  nowColor: string;
  tl: ResolvedTimeline<LayoutGuidesElementId>;
}) {
  const { columns, top, bottom, highlight, ruler, now } = guides;
  const h = highlight?.rect;
  const lit = h && highlight ? tl.get("highlight") : undefined;
  const nowEl = now ? tl.get("now") : undefined;
  return (
    <>
      {columns.map((x, i) => (
        <Guide
          key={x}
          x={x}
          y={top}
          length={bottom - top}
          vertical
          color={color}
          dashed
          delay={tl.get(`column:${i}`).start}
        />
      ))}
      {h && highlight && lit && (
        <>
          <OutlineBox
            rect={h}
            color={color}
            fill={`${color}14`}
            inset={0}
            radius={0}
            delay={lit.start}
          />
          <OutlineBox
            rect={{ x: h.x + 6, y: h.y + 4, w: h.w - 12, h: 22 }}
            color={color}
            radius={4}
            inset={0}
            delay={lit.start + lit.beat("headerAt")}
          />
          <Pill
            x={h.x + h.w / 2}
            y={h.y + 4}
            text={highlight.label}
            color={color}
            delay={lit.start + lit.beat("labelAt")}
            anchor="above"
          />
        </>
      )}
      {ruler && (
        <Ruler
          from={ruler.from}
          to={ruler.to}
          label={ruler.label}
          color={color}
          delay={tl.get("ruler").start}
          labelSide={ruler.side}
        />
      )}
      {now && nowEl && (
        <>
          <Guide
            x={now.from}
            y={now.y}
            length={now.to - now.from}
            color={nowColor}
            width={1.5}
            delay={nowEl.start}
          />
          <Pill
            x={now.from}
            y={now.y}
            text={now.label}
            color={nowColor}
            delay={nowEl.start}
            anchor="left"
          />
        </>
      )}
    </>
  );
}
