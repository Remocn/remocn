"use client";

import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Freeze,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DashboardPopulate } from "@/registry/remocn/dashboard-populate";
import { FrostedGlassWipe } from "@/registry/remocn/frosted-glass-wipe";
import { SpatialPush } from "@/registry/remocn/spatial-push";
import { TerminalToBrowserDeploy } from "@/registry/remocn/terminal-to-browser-deploy";

export interface LandingCodeShowcaseProps {
  accentColor?: string;
  speed?: number;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";
const MONO_FAMILY =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

/* -------------------------------------------------------------------------- */
/*                                  Tokens                                    */
/* -------------------------------------------------------------------------- */

const PEACH = "#FFB38E";
const LAVENDER = "#D4B3FF";
const MINT = "#A1EEBD";
const STAGE_BG = "#0A090E";
const PANEL_BG = "#141318";

/* -------------------------------------------------------------------------- */
/*                              Timeline schedule                             */
/* -------------------------------------------------------------------------- */
/*
   Frame layout (30fps base):
     0   ────────────────────────────►  90    BlurReveal
                                    70 ────►  130   SpatialPush overlay
                                          130 ────────────►  240   Dashboard
                                                          230 ────►  290   FrostedGlassWipe overlay
                                                              290 ────────────►  410  MaskedSlideReveal
                                                                              400 ────►  460   KineticTypeMask overlay
                                                                                  460 ────────────────►  640  TerminalToBrowserDeploy
*/

interface SceneWindow {
  start: number;
  duration: number;
}

const SCENES = {
  blur: { start: 0, duration: 90 } as SceneWindow,
  push1: { start: 70, duration: 60 } as SceneWindow,
  dashboard: { start: 130, duration: 110 } as SceneWindow,
  glassWipe: { start: 230, duration: 60 } as SceneWindow,
  maskedSlide: { start: 290, duration: 120 } as SceneWindow,
  push2: { start: 400, duration: 60 } as SceneWindow,
  terminal: { start: 460, duration: 180 } as SceneWindow,
  // Quiet hold at the very end so the loop never restarts mid-action.
  endHold: 80,
};

const TOTAL_DURATION =
  SCENES.terminal.start + SCENES.terminal.duration + SCENES.endHold; // 720

/* -------------------------------------------------------------------------- */
/*                              Code timeline                                 */
/* -------------------------------------------------------------------------- */

interface CodeStep {
  /** Frame at which this fragment STARTS being typed */
  startFrame: number;
  /** Code fragment to append to the visible buffer */
  code: string;
  /** Token within the fragment that pulses lavender briefly when typed */
  highlight?: string;
}

const HEADER = `import { BlurReveal, DashboardPopulate, MaskedSlideReveal,
  TerminalToBrowserDeploy, Transition } from "@/components/remocn";

export default function Scene() {
  return (
    <>
`;

const FOOTER = `    </>
  );
}`;

const STEPS: CodeStep[] = [
  {
    startFrame: 4,
    code: `      <BlurReveal text="Build faster." />\n`,
  },
  {
    startFrame: SCENES.push1.start,
    code: `      <Transition type="spatial-push" />\n`,
    highlight: "spatial-push",
  },
  {
    startFrame: SCENES.dashboard.start,
    code: `      <DashboardPopulate data={metrics} />\n`,
  },
  {
    startFrame: SCENES.glassWipe.start,
    code: `      <Transition type="glass-wipe" />\n`,
    highlight: "glass-wipe",
  },
  {
    startFrame: SCENES.maskedSlide.start,
    code: `      <MaskedSlideReveal text="Ship to production." />\n`,
  },
  {
    startFrame: SCENES.push2.start,
    code: `      <Transition type="spatial-push" direction="left" />\n`,
    highlight: "spatial-push",
  },
  {
    startFrame: SCENES.terminal.start,
    code: `      <TerminalToBrowserDeploy />\n`,
  },
];

const CHARS_PER_FRAME = 2.2;

interface BuiltStep extends CodeStep {
  endFrame: number;
}

const BUILT_STEPS: BuiltStep[] = STEPS.map((s) => ({
  ...s,
  endFrame: s.startFrame + Math.ceil(s.code.length / CHARS_PER_FRAME),
}));

/* -------------------------------------------------------------------------- */
/*                              Syntax highlight                              */
/* -------------------------------------------------------------------------- */

interface Token {
  text: string;
  color: string;
  glow?: boolean;
}

function tokenizeLine(
  line: string,
  accentColor: string,
  highlightedToken: string | null,
): Token[] {
  const tokens: Token[] = [];
  const regex =
    /(\bimport\b|\bfrom\b|\bexport\b|\bdefault\b|\bfunction\b|\breturn\b|\bconst\b)|("[^"]*")|(\b[A-Z][a-zA-Z0-9_]*)|(\b[a-zA-Z_][a-zA-Z0-9_]*)(?==)|(\{|\}|\(|\)|<|>|\/|;)|([0-9]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null = regex.exec(line);
  while (m !== null) {
    if (m.index > lastIndex) {
      tokens.push({
        text: line.slice(lastIndex, m.index),
        color: "#e4e4e7",
      });
    }
    if (m[1]) tokens.push({ text: m[1], color: LAVENDER });
    else if (m[2]) {
      // String literal — check if it matches the active highlight
      const inner = m[2].slice(1, -1);
      if (highlightedToken && inner === highlightedToken) {
        tokens.push({ text: m[2], color: LAVENDER, glow: true });
      } else {
        tokens.push({ text: m[2], color: MINT });
      }
    } else if (m[3]) tokens.push({ text: m[3], color: PEACH });
    else if (m[4]) tokens.push({ text: m[4], color: accentColor });
    else if (m[5]) tokens.push({ text: m[5], color: "#71717a" });
    else if (m[6]) tokens.push({ text: m[6], color: "#fbbf24" });
    lastIndex = regex.lastIndex;
    m = regex.exec(line);
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: "#e4e4e7" });
  }
  return tokens;
}

/* -------------------------------------------------------------------------- */
/*                                Code editor                                 */
/* -------------------------------------------------------------------------- */

function CodeEditor({
  frame,
  accentColor,
}: {
  frame: number;
  accentColor: string;
}) {
  // Compose the visible code: header + per-step typed amounts + footer (only when fully typed)
  const dynamicChunks: string[] = [];
  let activeHighlight: string | null = null;

  for (const step of BUILT_STEPS) {
    if (frame < step.startFrame) break;
    const elapsed = frame - step.startFrame;
    const charsTyped = Math.min(
      step.code.length,
      Math.floor(elapsed * CHARS_PER_FRAME),
    );
    dynamicChunks.push(step.code.slice(0, charsTyped));

    // Lavender pulse: active for ~24 frames after fragment finishes typing
    if (step.highlight) {
      const sinceStart = frame - step.startFrame;
      if (sinceStart >= 0 && sinceStart < 60) {
        activeHighlight = step.highlight;
      }
    }
  }

  const allTyped = dynamicChunks.join("");
  const lastStep = BUILT_STEPS[BUILT_STEPS.length - 1];
  const showFooter = frame > lastStep.endFrame + 4;
  const visibleCode = HEADER + allTyped + (showFooter ? FOOTER : "");
  const lines = visibleCode.split("\n");
  const lastLineIdx = lines.length - 1;
  const caretOn = Math.floor(frame / 12) % 2 === 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 540,
        position: "relative",
        borderRadius: 16,
        padding: 1,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.06) 100%)",
        boxShadow: "0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          borderRadius: 15,
          background: "rgba(12,12,14,0.9)",
          backdropFilter: "blur(20px)",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: 40,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            gap: 8,
          }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div
              key={c}
              style={{
                width: 11,
                height: 11,
                borderRadius: 6,
                background: c,
                opacity: 0.65,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 12,
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              fontFamily: MONO_FAMILY,
            }}
          >
            scene.tsx
          </div>
        </div>

        {/* Code body */}
        <div
          style={{
            padding: "20px 22px",
            fontFamily: MONO_FAMILY,
            fontSize: 12.5,
            lineHeight: 1.7,
            color: "#e4e4e7",
            minHeight: 480,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {lines.map((line, i) => {
            const tokens = tokenizeLine(line, accentColor, activeHighlight);
            const isLast = i === lastLineIdx;
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable per frame
                key={i}
                style={{ display: "flex", whiteSpace: "pre" }}
              >
                <span
                  style={{
                    width: 26,
                    color: "rgba(255,255,255,0.18)",
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span>
                  {tokens.length === 0 ? (
                    <span> </span>
                  ) : (
                    tokens.map((t, j) => (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: stable per line
                        key={j}
                        style={{
                          color: t.color,
                          textShadow: t.glow
                            ? `0 0 12px ${LAVENDER}, 0 0 24px ${LAVENDER}80`
                            : undefined,
                        }}
                      >
                        {t.text}
                      </span>
                    ))
                  )}
                  {isLast && caretOn && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 7,
                        height: 14,
                        marginLeft: 1,
                        verticalAlign: "text-bottom",
                        background: accentColor,
                      }}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Soft pastel scene wrappers                        */
/* -------------------------------------------------------------------------- */

/** Warm pastel canvas — the dark stage every scene sits on */
function PastelStage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(255,179,142,0.08), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(212,179,255,0.06), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Scene factories                               */
/* -------------------------------------------------------------------------- */
/*
   Note: BlurReveal and MaskedSlideReveal primitives bake in a `background:
   white` div. To keep the warm-dark stage we re-implement just the visual
   here (not a fork — both effects are simple text + filter). The orchestrator
   advertises the primitives in code; the rendered output is faithful to them.
*/

function BlurRevealScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const blurAmount = interpolate(frame, [0, 50], [22, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          opacity,
          filter: `blur(${blurAmount}px)`,
          fontSize: 96,
          fontWeight: 600,
          color: PEACH,
          letterSpacing: "-0.04em",
          fontFamily: FONT_FAMILY,
          textShadow: `0 0 60px ${PEACH}40`,
        }}
      >
        Build faster.
      </span>
    </div>
  );
}

function DashboardScene() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <DashboardPopulate accentColor={PEACH} />
    </div>
  );
}

function MaskedSlideScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = "Ship to production.".split(" ");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: 92,
          fontWeight: 700,
          color: MINT,
          letterSpacing: "-0.03em",
          fontFamily: FONT_FAMILY,
          textShadow: `0 0 40px ${MINT}30`,
        }}
      >
        {words.map((word, i) => {
          const t = spring({
            frame: frame - i * 4,
            fps,
            config: { damping: 18, stiffness: 120 },
          });
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: stable word list
              key={i}
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "bottom",
                lineHeight: 1.05,
                marginRight: "0.25em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - t) * 110}%)`,
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </span>
    </div>
  );
}

function TerminalScene() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <TerminalToBrowserDeploy accentColor={MINT} siteUrl="remocn.dev" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Right pane                                  */
/* -------------------------------------------------------------------------- */

function RightPane() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: STAGE_BG,
        overflow: "hidden",
        borderRadius: 18,
      }}
    >
      {/* ── BASE LAYER: each scene runs in its own Sequence so its
            internal useCurrentFrame() starts at 0 within the window. ── */}

      <Sequence
        from={SCENES.blur.start}
        durationInFrames={SCENES.blur.duration + SCENES.push1.duration}
      >
        <PastelStage>
          <BlurRevealScene />
        </PastelStage>
      </Sequence>

      <Sequence
        from={SCENES.dashboard.start}
        durationInFrames={SCENES.dashboard.duration + SCENES.glassWipe.duration}
      >
        <PastelStage>
          <DashboardScene />
        </PastelStage>
      </Sequence>

      <Sequence
        from={SCENES.maskedSlide.start}
        durationInFrames={SCENES.maskedSlide.duration + SCENES.push2.duration}
      >
        <PastelStage>
          <MaskedSlideScene />
        </PastelStage>
      </Sequence>

      <Sequence
        from={SCENES.terminal.start}
        durationInFrames={SCENES.terminal.duration + SCENES.endHold}
      >
        <PastelStage>
          <TerminalScene />
        </PastelStage>
      </Sequence>

      {/* ── TRANSITION OVERLAYS: each one displays the previous scene's
            end-state (Freeze) while wiping in the next scene's start-state. ── */}

      <Sequence
        from={SCENES.push1.start}
        durationInFrames={SCENES.push1.duration}
      >
        <SpatialPush
          transitionStart={0}
          transitionDuration={SCENES.push1.duration}
          direction="up"
          from={
            <Freeze frame={SCENES.push1.start - SCENES.blur.start - 1}>
              <PastelStage>
                <BlurRevealScene />
              </PastelStage>
            </Freeze>
          }
          to={
            <Freeze frame={0}>
              <PastelStage>
                <DashboardScene />
              </PastelStage>
            </Freeze>
          }
        />
      </Sequence>

      <Sequence
        from={SCENES.glassWipe.start}
        durationInFrames={SCENES.glassWipe.duration}
      >
        <FrostedGlassWipe
          transitionStart={0}
          transitionDuration={SCENES.glassWipe.duration}
          glassBlur={28}
          from={
            <Freeze frame={SCENES.dashboard.duration - 1}>
              <PastelStage>
                <DashboardScene />
              </PastelStage>
            </Freeze>
          }
          to={
            <Freeze frame={0}>
              <PastelStage>
                <MaskedSlideScene />
              </PastelStage>
            </Freeze>
          }
        />
      </Sequence>

      <Sequence
        from={SCENES.push2.start}
        durationInFrames={SCENES.push2.duration}
      >
        <SpatialPush
          transitionStart={0}
          transitionDuration={SCENES.push2.duration}
          direction="left"
          from={
            <Freeze frame={SCENES.maskedSlide.duration - 1}>
              <PastelStage>
                <MaskedSlideScene />
              </PastelStage>
            </Freeze>
          }
          to={
            <Freeze frame={0}>
              <PastelStage>
                <TerminalScene />
              </PastelStage>
            </Freeze>
          }
        />
      </Sequence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Main                                      */
/* -------------------------------------------------------------------------- */

export function LandingCodeShowcase({
  accentColor = "#FFB38E",
  speed = 1,
}: LandingCodeShowcaseProps) {
  const rawFrame = useCurrentFrame();
  const frame = rawFrame * speed;

  /* ---- Final "deploy success" glow on both panes ---- */
  const successGlow = interpolate(
    frame,
    [SCENES.terminal.start + 70, SCENES.terminal.start + 100],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: PANEL_BG,
        fontFamily: FONT_FAMILY,
        overflow: "hidden",
      }}
    >
      {/* Backdrop wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(255,179,142,0.06), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(212,179,255,0.06), transparent 55%)",
        }}
      />

      {/* ---------------- LEFT: code editor ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "38%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <CodeEditor frame={frame} accentColor={accentColor} />
      </div>

      {/* ---------------- RIGHT: live preview ---------------- */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "62%",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Preview label */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: MINT,
              boxShadow: `0 0 ${10 + successGlow * 12}px ${MINT}`,
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontFamily: MONO_FAMILY,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Preview · HMR
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            boxShadow: `inset 0 0 ${60 * successGlow}px rgba(161,238,189,${successGlow * 0.45})`,
          }}
        >
          <RightPane />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// Re-export the schedule so config.ts (or callers) can read the canonical
// total length without duplicating constants.
export const LANDING_CODE_SHOWCASE_DURATION = TOTAL_DURATION;
