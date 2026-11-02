"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const geist = loadGeist("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const MORPH = { damping: 200 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const B = {
  words: -8,
  part: 18,
  ignite: 20,
  fill: 26,
  card: 32,
  recede: 34,
  recedeLen: 16,
  type: 60,
  press: 90,
  done: 96,
  end: 136,
};

export const GLOW_BORN_CARD_DURATION = B.end;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export interface GlowBornCardProps {
  theme?: "dark" | "light";
  accent?: string;
  primary?: string;
  before?: string;
  after?: string;
  title?: string;
  label?: string;
  value?: string;
  hint?: string;
  branch?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  colors: ["#9fd8ff", "#3f7dff", "#1c3bb0", "#8ff0e0"],
  background: "#eef1f6",
};

function Words({
  text,
  frame,
  start,
  size,
  color,
}: {
  text: string;
  frame: number;
  start: number;
  size: number;
  color: string;
}) {
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        const p = ramp(frame, start + i * 2, 14);
        return (
          <span
            key={`${w}-${i.toString()}`}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: size * 0.12,
              marginBottom: -size * 0.12,
              marginRight: i < words.length - 1 ? size * 0.26 : 0,
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${mix(105, 0, p)}%)`,
                filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
                color,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function RepoIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <g
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={6.5} cy={5.5} r={2} />
        <circle cx={6.5} cy={18.5} r={2} />
        <circle cx={17.5} cy={8.5} r={2} />
        <path d="M6.5 7.5v9M17.5 10.5c0 3.5-4 3-8.6 6.2" />
      </g>
    </svg>
  );
}

export function GlowBornCard({
  theme = "dark",
  accent = "#45f0d6",
  primary = "#3B5BFD",
  before = "Or import a scene from",
  after = "your repo",
  title = "Import from repository",
  label = "Repository",
  value = "lumen-labs/launch",
  hint = "Public or private, any branch",
  branch = "main · 214 commits · 3h ago",
  ground,
  groundParams,
}: GlowBornCardProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;
  const u = portrait ? 2.1 : 1.12;

  const ink = dark ? "#f3f6ff" : "#10131c";
  const cardInk = dark ? "#eef1f8" : "#141822";
  const muted = dark ? "rgba(226,232,248,0.52)" : "rgba(20,24,34,0.5)";
  const hair = dark ? "rgba(255,255,255,0.1)" : "rgba(20,24,48,0.1)";
  const fieldBg = dark ? "rgba(255,255,255,0.035)" : "#f7f8fa";
  const surface = dark ? "#12151c" : "#ffffff";
  const footerBg = dark ? "rgba(255,255,255,0.025)" : "#f9fafb";

  const cardW = (portrait ? 420 : 380) * u;
  const cardH = 236 * u;
  const pad = 20 * u;
  const fontSize = portrait ? 80 : 42;
  const margin = portrait ? 34 : 22;

  const part = spring({
    frame: frame - B.part,
    fps,
    config: MORPH,
    durationInFrames: 18,
  });
  const gap = mix(
    portrait ? 0 : fontSize * 0.26,
    (portrait ? cardH : cardW) + margin * 2,
    part,
  );

  const ignite = ramp(frame, B.ignite, 10, LIGHT);
  const fill = ramp(frame, B.fill, 12, LIGHT);
  const recede = ramp(frame, B.recede, B.recedeLen, MOVE);
  const glowFade = 1 - ramp(frame, B.recede + 8, 16, EXIT);
  const cardOn = ramp(frame, B.card, 4);
  const halo =
    ramp(frame, B.recede + 4, 12, LIGHT) *
    (1 - ramp(frame, B.recede + 16, 20, EXIT));

  const blobW =
    mix(36 * u, mix(cardW * 0.4, cardW * 1.04, fill), ignite) *
    (1 - 0.55 * recede);
  const blobX = cardW * 0.3 * recede;
  const blobH = mix(36 * u, mix(cardH * 0.6, cardH * 1.04, fill), ignite);
  const blobR = mix(blobW / 2, 18 * u, fill);
  const blobBlur = mix(26, 10, fill) * u;
  const edge = mix(4, 120, recede);

  const typed = Math.round(
    interpolate(
      frame,
      [B.type, B.type + value.length * 1.5],
      [0, value.length],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );
  const shown = value.slice(0, typed);
  const caret =
    frame >= B.recede + 10 &&
    frame < B.press &&
    (typed < value.length || Math.floor(frame / 8) % 2 === 0);
  const focus =
    ramp(frame, B.type - 6, 8) * (1 - ramp(frame, B.press + 4, 10, EXIT));
  const press = Math.max(
    0,
    spring({ frame: frame - B.press, fps, config: CHIP }) -
      spring({ frame: frame - B.press - 3, fps, config: CHIP }),
  );
  const done = spring({ frame: frame - B.done, fps, config: CHIP });
  const doneIn = ramp(frame, B.done, 5);
  const metaIn = ramp(frame, B.type + value.length * 1.5 + 2, 10, LIGHT);

  const push =
    1 +
    (portrait ? 0.05 : 0.03) * ramp(frame, B.part, B.done - B.part, SWAY) +
    0.02 * ramp(frame, B.done, B.end - B.done, SWAY);
  const settle = ramp(frame, -6, 30, MOVE);
  const tilt = mix(8, 0, settle);

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "film-blue" : "glasswork");
  const resolvedParams = groundParams ?? (dark ? undefined : LIGHT_GROUND);

  const glowCore = dark ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,1)";

  const card = (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: cardW,
        height: cardH,
        marginLeft: -cardW / 2,
        marginTop: -cardH / 2,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18 * u,
          opacity: halo * 0.8,
          boxShadow: `0 0 ${26 * u}px ${4 * u}px color-mix(in oklab, ${accent} ${dark ? 60 : 45}%, transparent), 0 0 ${80 * u}px ${22 * u}px color-mix(in oklab, ${accent} ${dark ? 26 : 20}%, transparent)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16 * u,
          background: surface,
          boxShadow: dark
            ? "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 56px rgba(2,6,24,0.55)"
            : "0 0 0 1px rgba(20,24,48,0.07), 0 1px 2px rgba(20,30,90,0.06), 0 22px 50px rgba(20,30,90,0.14)",
          opacity: cardOn,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: geist.fontFamily,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
        }}
      >
        <div style={{ padding: `${pad}px ${pad}px 0` }}>
          <div style={{ fontSize: 20 * u, color: cardInk }}>{title}</div>
          <div style={{ fontSize: 15 * u, color: muted, marginTop: 16 * u }}>
            {label}
          </div>
          <div
            style={{
              marginTop: 8 * u,
              height: 42 * u,
              borderRadius: 8 * u,
              border: `1px solid ${focus > 0 ? `color-mix(in oklab, ${primary} ${Math.round(focus * 75)}%, ${hair})` : hair}`,
              boxShadow: `0 0 0 ${3 * u * focus}px color-mix(in oklab, ${primary} ${Math.round(focus * 22)}%, transparent)`,
              background: fieldBg,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              padding: `0 ${12 * u}px`,
              fontFamily: mono.fontFamily,
              fontSize: 15 * u,
              letterSpacing: 0,
              color: typed > 0 ? cardInk : muted,
            }}
          >
            <div style={{ order: -2, display: "flex" }}>
              <RepoIcon size={18 * u} color={muted} />
            </div>
            {typed > 0 ? shown : "owner/name"}
            <span
              style={{
                display: "inline-block",
                width: 2 * u,
                height: 20 * u,
                margin: typed > 0 ? `0 0 0 ${-8 * u}px` : `0 ${-8 * u}px 0 0`,
                order: typed > 0 ? 1 : -1,
                background: primary,
                opacity: caret ? 1 : 0,
              }}
            />
          </div>
          <div
            style={{
              position: "relative",
              marginTop: 8 * u,
              height: 18 * u,
              fontSize: 14 * u,
              color: muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <div
              style={{ position: "absolute", inset: 0, opacity: 1 - metaIn }}
            >
              {hint}
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: metaIn,
                transform: `translateY(${(1 - metaIn) * 4 * u}px)`,
              }}
            >
              {branch}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10 * u,
            fontSize: 16 * u,
            padding: `${11 * u}px ${pad}px`,
            borderTop: `1px solid ${hair}`,
            background: footerBg,
          }}
        >
          <div
            style={{
              padding: `${7 * u}px ${14 * u}px`,
              borderRadius: 9 * u,
              border: `1px solid ${hair}`,
              color: cardInk,
            }}
          >
            Cancel
          </div>
          <div
            style={{
              position: "relative",
              padding: `${7 * u}px ${16 * u}px`,
              borderRadius: 9 * u,
              background: primary,
              color: "#fff",
              transform: `scale(${1 - 0.06 * press})`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 2px rgba(4,8,30,${dark ? 0.4 : 0.18})`,
              display: "flex",
              alignItems: "center",
              gap: 7 * u,
            }}
          >
            <div
              style={{
                width: 16 * u * doneIn,
                height: 16 * u,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                transform: `scale(${done})`,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={16 * u}
                height={16 * u}
                aria-hidden
              >
                <path
                  d="m5 12.5 4.5 4.5L19 7.5"
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={22}
                  strokeDashoffset={22 * (1 - ramp(frame, B.done + 1, 8))}
                />
              </svg>
            </div>
            {doneIn > 0.5 ? "Imported" : "Import"}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          opacity: ignite * glowFade,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -cardW * 0.7,
            top: -cardH * 0.9,
            width: cardW * 1.4,
            height: cardH * 1.8,
            maskImage: `linear-gradient(90deg, transparent ${edge - 10}%, black ${edge + 34}%)`,
            WebkitMaskImage: `linear-gradient(90deg, transparent ${edge - 10}%, black ${edge + 34}%)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: blobW * 1.25,
              height: blobH * 1.35,
              marginLeft: (-blobW * 1.25) / 2 + blobX,
              marginTop: (-blobH * 1.35) / 2,
              borderRadius: blobR * 1.4,
              background: accent,
              filter: `blur(${blobBlur * 1.8}px)`,
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: blobW,
              height: blobH,
              marginLeft: -blobW / 2 + blobX,
              marginTop: -blobH / 2,
              borderRadius: blobR,
              background: `radial-gradient(70% 70% at 50% 50%, ${glowCore} 0%, color-mix(in oklab, ${accent} 55%, white) 55%, ${accent} 100%)`,
              filter: `blur(${blobBlur}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ fontFamily: geist.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={4}
        timeScale={0.5}
      />
      <AbsoluteFill
        style={{
          background: dark
            ? "radial-gradient(60% 50% at 50% 50%, rgba(3,7,18,0.35) 0%, rgba(3,7,18,0) 100%)"
            : "radial-gradient(60% 50% at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${sc})`,
          transformOrigin: "0 0",
          perspective: 1800,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            fontSize,
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            transform: `scale(${push}) rotateX(${portrait ? tilt : 0}deg) rotateY(${portrait ? 0 : -tilt}deg)`,
            transformOrigin: "50% 50%",
          }}
        >
          <Words
            text={before}
            frame={frame}
            start={B.words}
            size={fontSize}
            color={ink}
          />
          <div
            style={{
              position: "relative",
              width: portrait ? 0 : gap,
              height: portrait ? gap : 0,
              flexShrink: 0,
            }}
          >
            {frame >= B.ignite ? card : null}
          </div>
          <Words
            text={after}
            frame={frame}
            start={B.words + 10}
            size={fontSize}
            color={ink}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default GlowBornCard;
