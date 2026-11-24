"use client";

import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import {
  AUDIT_COLORS,
  AuditClock,
  DEMO,
  DEMO_WINDOW,
  DemoDashboard,
  easeInOut,
  FONT,
  GuideMarks,
  type GuideSpec,
  type Issue,
  IssueMarks,
  type Measure,
  MeasureMarks,
  midway,
  progress,
  type RadiusMark,
  type Rect,
  ScanBand,
  SplitAt,
  Spotlight,
  TokenMarks,
  type TokenSpec,
  useAuditFrame,
  VersionChip,
} from "@/lib/remocn/audit-core";
import { useSceneConfig } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DESIGN_AUDIT_LENGTH,
  type DesignAuditElementId,
  designAuditTimeline,
} from "./timeline";

export type DesignAuditMarks = {
  measures?: Measure[];
  radii?: RadiusMark[];
};

export type DesignAuditFocus = {
  /** Element the camera pushes in on. */
  rect: Rect;
  measures?: Measure[];
  radii?: RadiusMark[];
  tokens?: TokenSpec[];
};

export type DesignAuditProps = {
  /** UI before the fix, 1280x720. Defaults to a demo dashboard with drifted spacing. */
  before?: ReactNode;
  /** The fixed UI, same layout. */
  after?: ReactNode;
  /** Red redlines drawn over `before`. */
  beforeMarks?: DesignAuditMarks;
  /** Off-spec elements boxed on `before`. */
  issues?: Issue[];
  /** Blue redlines over `after`, shown once the scan lands. */
  afterMarks?: DesignAuditMarks;
  /** Close-up the camera pushes into, with its specs and tokens. `null` skips the zoom. */
  focus?: DesignAuditFocus | null;
  /** Guides drawn after the camera pulls back. */
  guides?: GuideSpec | null;
  /** Four step names lit one by one across the top. */
  steps?: string[];
  /** Name next to the version chip. Empty hides the top bar. */
  brand?: string;
  versions?: [string, string];
  auditColor?: string;
  fixColor?: string;
  scanColor?: string;
  background?: string;
  speed?: number;
  /**
   * Moves, trims or stretches the audit's steps, scan and camera moves, by
   * the ids in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<DesignAuditElementId>;
};

export const designAuditDefaults = {
  steps: ["Audit", "Layout", "Components", "Tokens"],
  brand: "Synergy",
  versions: ["v1.0", "v2.0"] as [string, string],
  auditColor: AUDIT_COLORS.audit,
  fixColor: AUDIT_COLORS.fix,
  scanColor: AUDIT_COLORS.scan,
  background: AUDIT_COLORS.stage,
  speed: 1,
};

export const designAuditLength = DESIGN_AUDIT_LENGTH;

export function DesignAudit(props: DesignAuditProps) {
  const { speed = 1 } = props;
  return (
    <AuditClock speed={speed}>
      <Scene {...props} />
    </AuditClock>
  );
}

function Scene(props: DesignAuditProps) {
  const {
    before,
    after,
    beforeMarks,
    issues,
    afterMarks,
    focus,
    guides,
    steps = designAuditDefaults.steps,
    brand = designAuditDefaults.brand,
    versions = designAuditDefaults.versions,
    auditColor = designAuditDefaults.auditColor,
    fixColor = designAuditDefaults.fixColor,
    scanColor = designAuditDefaults.scanColor,
    background = designAuditDefaults.background,
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useAuditFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    designAuditTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const enterEl = tl.get("enter");
  const redlines = tl.get("redlines");
  const issuesEl = tl.get("issues");
  const scan = tl.get("scan");
  const zoomIn = tl.get("zoom-in");
  const callouts = tl.get("callouts");
  const tokens = tl.get("tokens");
  const zoomOut = tl.get("zoom-out");
  const guidesEl = tl.get("guides");
  const demo = !before && !after;
  const redBefore = beforeMarks ?? (demo ? DEMO.before : {});
  const blueAfter = afterMarks ?? (demo ? DEMO.after : {});
  const flagged = issues ?? (demo ? DEMO.before.issues : []);
  const zoomed = focus === undefined ? (demo ? DEMO.after.focus : null) : focus;
  const grid =
    guides === undefined ? (demo ? DEMO.after.guides : null) : guides;

  const y = easeInOut(frame, [scan.start, scan.end], [-20, 760]);
  const band = easeInOut(
    frame,
    [
      scan.start + scan.beat("lead"),
      scan.start + scan.beat("lit"),
      scan.end - scan.beat("fade"),
      scan.end,
    ],
    [0, 1, 1, 0],
  );
  const enter = progress(frame, enterEl.start, enterEl.length);
  const zoom = zoomed
    ? easeInOut(
        frame,
        [zoomIn.start, zoomIn.end, zoomOut.start, zoomOut.end],
        [0, 1, 1, 0],
      )
    : 0;
  const card = zoomed?.rect ?? { x: 640, y: 360, w: 0, h: 0 };
  const center = { x: card.x + card.w / 2 + 40, y: card.y + card.h / 2 + 46 };
  // The push eases in and out so gently that its first and last frames sit
  // within a hair of rest, so "moving" is read off the clock, not off `zoom`.
  const zooming =
    zoomed !== null &&
    (midway((frame - zoomIn.start) / zoomIn.length) ||
      midway((frame - zoomOut.start) / zoomOut.length));
  const camera = `translate(${(640 - center.x) * zoom}px, ${(360 - center.y) * zoom}px) scale(${1 + zoom * 1.35})${glide(zooming)}`;
  const fadeOut = (from: number, to: number) =>
    easeInOut(frame, [from, to], [1, 0]);

  const active =
    frame < scan.start
      ? 0
      : frame < zoomIn.start
        ? 1
        : frame < tokens.start
          ? 2
          : 3;

  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      <AbsoluteFill
        style={{
          transform: camera,
          transformOrigin: `${center.x}px ${center.y}px`,
        }}
      >
        <AbsoluteFill
          style={{
            opacity: enter,
            transform: `translateY(${(1 - enter) * 18}px) scale(${0.97 + 0.03 * enter})${glide(midway(enter))}`,
          }}
        >
          <SplitAt
            y={y}
            bottom={
              <>
                {before ?? <DemoDashboard v={1} />}
                <MeasureMarks
                  measures={redBefore.measures ?? []}
                  radii={redBefore.radii}
                  color={auditColor}
                  start={redlines.start}
                />
                <IssueMarks
                  issues={flagged}
                  color={auditColor}
                  start={issuesEl.start}
                />
              </>
            }
            top={
              <>
                {after ?? <DemoDashboard v={2} />}
                <AbsoluteFill
                  style={{
                    opacity: zoomed
                      ? fadeOut(
                          zoomIn.start + zoomIn.beat("clear"),
                          zoomIn.start,
                        )
                      : 1,
                  }}
                >
                  <MeasureMarks
                    measures={blueAfter.measures ?? []}
                    radii={blueAfter.radii}
                    color={fixColor}
                    start={-200}
                  />
                </AbsoluteFill>
              </>
            }
          />
          <ScanBand y={y} color={scanColor} opacity={band} />
          {zoomed && (
            <>
              <Spotlight rect={zoomed.rect} color={background} opacity={zoom} />
              {frame >= callouts.start && (
                <AbsoluteFill
                  style={{
                    opacity: fadeOut(
                      zoomOut.start + zoomOut.beat("hide"),
                      zoomOut.start + zoomOut.beat("gone"),
                    ),
                  }}
                >
                  <MeasureMarks
                    measures={zoomed.measures ?? []}
                    radii={zoomed.radii}
                    color={fixColor}
                    start={callouts.start}
                    stagger={callouts.beat("stagger")}
                  />
                  <TokenMarks
                    tokens={zoomed.tokens ?? []}
                    start={tokens.start}
                  />
                </AbsoluteFill>
              )}
            </>
          )}
          {grid && (
            <GuideMarks guides={grid} color={fixColor} start={guidesEl.start} />
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      {brand && (
        <AbsoluteFill style={{ opacity: enter * (1 - zoom) }}>
          <VersionChip
            brand={brand}
            versions={versions}
            fixed={y > 36}
            colors={[auditColor, fixColor]}
          />
          <StepBar
            steps={steps}
            active={active}
            colors={[auditColor, fixColor]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

function StepBar({
  steps,
  active,
  colors,
}: {
  steps: string[];
  active: number;
  colors: [string, string];
}) {
  return (
    <div
      style={{
        position: "absolute",
        right: 1280 - DEMO_WINDOW.x - DEMO_WINDOW.w,
        top: 28,
        display: "flex",
        gap: 18,
        fontSize: 12.5,
      }}
    >
      {steps.map((step, i) => {
        const on = i <= active;
        return (
          <span
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: on ? AUDIT_COLORS.ink : "#99A0AE",
              fontWeight: i === active ? 600 : 400,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: on
                  ? active === 0
                    ? colors[0]
                    : colors[1]
                  : "#E1E4EA",
              }}
            />
            {step}
          </span>
        );
      })}
    </div>
  );
}
