"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/Oswald";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: oswald } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

export interface WalkoutNameProps {
  /** The fighter name, one stacked line per entry. Three short lines read best. */
  name?: string[];
  /** The nickname, set in quotes in a serif italic beside the last line. */
  nickname?: string;
  /** The record, slammed in beside the name. */
  record?: string;
  /** Second stat under the record, filled with the spotlight gradient. */
  finishes?: string;
  /** Small label over the record. */
  recordLabel?: string;
  /** Small billing line, top left. */
  billing?: string;
  /** Small markers: the billing tick and the record rule. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (internal clock = frame + 2, 30fps, speed 1):
//   0–12   whip-pan lands on an extreme close-up of line 1 (motion-streak ghosts)
//  12–26   hard cut: line 2 whips in from the left, tighter push
//  26–37   hard cut: line 3 slams down from 1.7×; frame 31 is the impact frame
//          (one inverted frame) and the camera shakes
//  37–46   whip-zoom out to the full poster framing
//  44–62   the "beam" spotlight band swings in from the left and parks across
//          the stack; the type inside it knocks out to the stage colour
//  52–63   record label + record slam in beside the name, then the finishes stat
//  64–74   the nickname wipes in beside the last line; billing and logo rise
//  80–     fight-poster hold
const SHOT_2 = 12;
const SHOT_3 = 26;
const SLAM_LEN = 5;
const WHIP_OUT = 37;
const WHIP_OUT_LEN = 9;
const BAND_AT = 44;
const BAND_LEN = 18;
const RECORD_AT = 52;
const FINISH_AT = 58;
const NICK_AT = 64;
const META_AT = 70;

const SLAM = Easing.bezier(0.12, 0.9, 0.25, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.7, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "beam": bg #02030a, [#f4f7ff, #8fb4ff, #3d5bff, #1a1660].
const BEAM = ["#F4F7FF", "#8FB4FF", "#3D5BFF", "#1A1660"] as const;

const THEMES = {
  dark: {
    stage: "#0A0A0B",
    ink: "#F3F2EF",
    dim: "#8A8990",
    knock: "#0A0A0B",
    band: `linear-gradient(90deg, ${BEAM[2]} 0%, ${BEAM[1]} 30%, ${BEAM[0]} 50%, ${BEAM[1]} 70%, ${BEAM[2]} 100%)`,
    edge: BEAM[3],
    stat: `linear-gradient(180deg, ${BEAM[0]} 10%, ${BEAM[1]} 55%, ${BEAM[2]} 100%)`,
  },
  light: {
    stage: "#F5F4F0",
    ink: "#121214",
    dim: "#7E7D77",
    knock: "#FFFFFF",
    band: `linear-gradient(90deg, ${BEAM[3]} 0%, ${BEAM[2]} 34%, #5F7BFF 50%, ${BEAM[2]} 66%, ${BEAM[3]} 100%)`,
    edge: BEAM[1],
    stat: `linear-gradient(180deg, ${BEAM[2]} 0%, #2A2F9E 60%, ${BEAM[3]} 100%)`,
  },
} as const;

// Oswald 500 metrics (em): cap height 0.81, cap top sits 0.142 below a
// line-height-1 box, average uppercase advance ~0.5.
const CAP = 0.81;
const CAP_TOP = 0.142;
const ADV = 0.5;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

/** Decaying camera shake that starts at `at`, stepped per frame. */
function shake(t: number, at: number, len: number, amp: number) {
  const d = Math.floor(t - at);
  if (d < 0 || d >= len) return { x: 0, y: 0 };
  const k = (1 - d / len) ** 2;
  return {
    x: amp * k * Math.sin(d * 2.4 + 0.6),
    y: amp * 0.6 * k * Math.cos(d * 3.1 + 0.3),
  };
}

interface Cam {
  cx: number;
  cy: number;
  s: number;
  dx: number;
}

export function WalkoutName({
  name = ["The", "Launch", "Kid"],
  nickname = "Ships before lunch",
  record = "12–0",
  finishes = "12 KO",
  recordLabel = "Pro record",
  billing = "Main event · Tonight",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: WalkoutNameProps) {
  const t = useCurrentFrame() * speed + 2;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = Math.min(W / 1280, H / 720);

  const lines = name.slice(0, 4).map((l) => l.toUpperCase());
  const n = Math.max(1, lines.length);

  // ── Poster layout (world coordinates = poster pixels) ─────────────────────
  const x0 = 64 * u;
  const gap = 16 * u;
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const nameFs = Math.min(
    200 * u,
    (0.52 * W) / (longest * ADV),
    (0.72 * H - (n - 1) * gap) / (n * CAP),
  );
  const capH = CAP * nameFs;
  const stackH = n * capH + (n - 1) * gap;
  const top = (H - stackH) / 2 + 2 * u;
  const lineTop = (i: number) => top + i * (capH + gap);
  const lineW = (i: number) => lines[i].length * ADV * nameFs;
  const lineCenter = (i: number) => ({
    x: x0 + lineW(i) / 2,
    y: lineTop(i) + capH / 2,
  });

  // ── Shots ─────────────────────────────────────────────────────────────────
  // One shot per line: line i becomes visible when its shot starts.
  const shotAt = [0, SHOT_2, SHOT_3, SHOT_3 + 6].slice(0, n);
  const lastShot = shotAt[n - 1];
  const whipOut = n === 1 ? SHOT_2 : WHIP_OUT + (n > 3 ? 6 : 0);
  const poster: Cam = { cx: W / 2, cy: H / 2, s: 1, dx: 0 };

  const framing = (i: number): Cam => {
    const p = lineCenter(i);
    const s = Math.min(2.4, (0.62 * W) / Math.max(lineW(i), 1));
    return { cx: p.x, cy: p.y, s: Math.max(1.45, s), dx: 0 };
  };

  const camAt = (tt: number): Cam => {
    if (tt >= whipOut) {
      const p = INOUT(ramp(tt, whipOut, WHIP_OUT_LEN));
      const f = framing(n - 1);
      return {
        cx: interpolate(p, [0, 1], [f.cx, poster.cx]),
        cy: interpolate(p, [0, 1], [f.cy, poster.cy]),
        s: interpolate(p, [0, 1], [f.s * 1.04, 1]),
        dx: 0,
      };
    }
    let i = 0;
    for (let k = 0; k < n; k++) if (tt >= shotAt[k]) i = k;
    const f = framing(i);
    const local = tt - shotAt[i];
    const push = 1 + 0.04 * ramp(local, 0, 14);
    // Lines 1 and 2 whip in (from the right, then from the left); the last
    // line lands in place and slams instead.
    const whipping = i < n - 1 || n === 1;
    const dir = i % 2 === 0 ? 1 : -1;
    const dx = whipping ? dir * 0.95 * W * (1 - OUT(ramp(local, 0, 7))) : 0;
    return { ...f, s: f.s * push, dx };
  };

  // Ghosts only during whips, never across a hard cut.
  const shotStart = (tt: number) => {
    if (tt >= whipOut) return whipOut;
    let s0 = 0;
    for (let k = 0; k < n; k++) if (tt >= shotAt[k]) s0 = shotAt[k];
    return s0;
  };
  const cam = camAt(t);
  const prev = camAt(t - 1);
  const speedPx =
    Math.abs(cam.dx - prev.dx) +
    Math.abs(W / 2 - cam.s * cam.cx - (W / 2 - prev.s * prev.cx)) +
    Math.abs(cam.s - prev.s) * W * 0.5;
  const ghosts = speedPx > 18 * u ? [0.32, 0.2, 0.12, 0.07] : [];

  // ── Impact on the last line ───────────────────────────────────────────────
  const slamP = SLAM(ramp(t, lastShot, SLAM_LEN));
  const lastScale = n > 1 ? 1.7 - 0.7 * slamP : 1;
  const hit = lastShot + SLAM_LEN;
  const inverted = n > 1 && t >= hit && t < hit + speed;
  const s1 = n > 1 ? shake(t, hit, 9, 14 * u) : { x: 0, y: 0 };
  const s2 = shake(t, RECORD_AT + SLAM_LEN, 6, 5 * u);
  const s3 = shake(t, FINISH_AT + SLAM_LEN, 6, 5 * u);
  const shX = s1.x + s2.x + s3.x;
  const shY = s1.y + s2.y + s3.y;

  // ── Spotlight band (world coordinates, leaning right) ─────────────────────
  const bandW = 0.19 * W;
  const lean = Math.tan((20 * Math.PI) / 180);
  const bandIn = OUT(ramp(t, BAND_AT, BAND_LEN));
  const bandDrift = interpolate(t, [BAND_AT + BAND_LEN, 160], [0, 0.03], CLAMP);
  const bandCx =
    interpolate(bandIn, [0, 1], [-0.35 * W, 0.4 * W]) + bandDrift * W;
  const bandPoly = (cx: number, w: number) => {
    const ext = H * 0.4;
    const yT = -ext;
    const yB = H + ext;
    const xAt = (y: number) => cx + (H / 2 - y) * lean;
    return `polygon(${xAt(yT) - w / 2}px ${yT}px, ${xAt(yT) + w / 2}px ${yT}px, ${xAt(yB) + w / 2}px ${yB}px, ${xAt(yB) - w / 2}px ${yB}px)`;
  };
  const showBand = t >= BAND_AT;

  // ── Stats column ──────────────────────────────────────────────────────────
  const colX = Math.max(
    x0 + Math.max(...lines.map((_, i) => lineW(i))) + 70 * u,
    0.6 * W,
  );
  const statFs = 196 * u;
  const labelFs = 19 * u;
  const recordTop = top + 46 * u;
  const finishTop = recordTop + CAP * statFs + 34 * u;
  const recP = SLAM(ramp(t, RECORD_AT, SLAM_LEN));
  const finP = SLAM(ramp(t, FINISH_AT, SLAM_LEN));
  const ruleP = OUT(ramp(t, FINISH_AT - 1, 8));

  // ── Nickname + meta ───────────────────────────────────────────────────────
  const nickFs = 74 * u;
  const lastBase = lineTop(n - 1) + capH;
  const nickX = x0 + lineW(n - 1) + 44 * u;
  const nickP = OUT(ramp(t, NICK_AT, 11));
  const metaP = OUT(ramp(t, META_AT, 10));

  const text = (
    s: string,
    fs: number,
    color: string,
    extra?: React.CSSProperties,
  ) => (
    <div
      style={{
        fontFamily: oswald,
        fontWeight: 500,
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color,
        whiteSpace: "nowrap",
        ...extra,
      }}
    >
      {s}
    </div>
  );

  // The name stack, in one colour. Rendered twice: ink, then knocked out
  // to the stage colour inside the band.
  const stack = (ink: string, key: string) => (
    <div key={key} style={{ position: "absolute", inset: 0 }}>
      {lines.map((l, i) => {
        if (t < shotAt[i]) return null;
        const isLast = i === n - 1;
        const k = isLast ? lastScale : 1;
        const p = lineCenter(i);
        return (
          <div
            key={`${i}-${l}`}
            style={{
              position: "absolute",
              left: x0,
              top: lineTop(i) - CAP_TOP * nameFs,
              transform: `scale(${k})`,
              transformOrigin: `${p.x - x0}px ${CAP_TOP * nameFs + capH / 2}px`,
              opacity: isLast ? ramp(t, lastShot, 2) : 1,
            }}
          >
            {text(l, nameFs, ink, { letterSpacing: "-0.015em" })}
          </div>
        );
      })}
      {nickP > 0 ? (
        <div
          style={{
            position: "absolute",
            left: nickX,
            top: lastBase - nickFs * 0.86,
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: nickFs,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: ink,
            whiteSpace: "nowrap",
            clipPath: `inset(-20% ${100 - 100 * nickP}% -20% -5%)`,
            transform: `translateX(${(1 - nickP) * -24 * u}px)`,
          }}
        >
          “{nickname}”
        </div>
      ) : null}
    </div>
  );

  const world = (camera: Cam, opacity: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: "0 0",
        transform: `translate(${W / 2 - camera.s * camera.cx + camera.dx}px, ${H / 2 - camera.s * camera.cy}px) scale(${camera.s})`,
        opacity,
      }}
    >
      {showBand ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: bandPoly(bandCx, bandW + 10 * u),
              background: c.edge,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: bandCx - bandW / 2 - 0.5 * H * lean,
              width: bandW + H * lean,
              top: 0,
              height: H,
              clipPath: `polygon(${H * lean}px 0, 100% 0, calc(100% - ${H * lean}px) 100%, 0 100%)`,
              background: c.band,
            }}
          />
        </>
      ) : null}
      {stack(c.ink, "ink")}
      {showBand ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: bandPoly(bandCx, bandW + 10 * u),
          }}
        >
          {stack(c.knock, "knock")}
        </div>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.stage,
          filter: inverted ? "invert(1)" : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${shX}px, ${shY}px)`,
          }}
        >
          {ghosts.map((op, k) => {
            const tt = Math.max(shotStart(t), t - (k + 1) * 0.5);
            return world(camAt(tt), op, `g${k}`);
          })}
          {world(cam, 1, "main")}

          {/* Stats column: screen space, lands after the whip-out. */}
          {t >= RECORD_AT ? (
            <div
              style={{
                position: "absolute",
                left: colX,
                top: recordTop - 44 * u,
                display: "flex",
                alignItems: "center",
                gap: 12 * u,
                opacity: ramp(t, RECORD_AT, 3),
                fontFamily: oswald,
                fontWeight: 400,
                fontSize: labelFs,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: c.dim,
              }}
            >
              <div
                style={{ width: 22 * u, height: 3 * u, background: accent }}
              />
              {recordLabel}
            </div>
          ) : null}
          {t >= RECORD_AT ? (
            <div
              style={{
                position: "absolute",
                left: colX,
                top: recordTop - CAP_TOP * statFs,
                transform: `scale(${1.55 - 0.55 * recP})`,
                transformOrigin: `0 ${CAP_TOP * statFs + (CAP * statFs) / 2}px`,
                opacity: ramp(t, RECORD_AT, 2),
              }}
            >
              {text(record, statFs, c.ink, {
                fontVariantNumeric: "tabular-nums",
              })}
            </div>
          ) : null}
          {ruleP > 0 ? (
            <div
              style={{
                position: "absolute",
                left: colX,
                top: finishTop - 18 * u,
                width: 0.3 * W * ruleP,
                height: 2 * u,
                background: c.dim,
                opacity: 0.5,
              }}
            />
          ) : null}
          {t >= FINISH_AT ? (
            <div
              style={{
                position: "absolute",
                left: colX,
                top: finishTop - CAP_TOP * statFs,
                transform: `scale(${1.55 - 0.55 * finP})`,
                transformOrigin: `0 ${CAP_TOP * statFs + (CAP * statFs) / 2}px`,
                opacity: ramp(t, FINISH_AT, 2),
              }}
            >
              {text(finishes, statFs, "transparent", {
                backgroundImage: c.stat,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                paddingRight: 8 * u,
              })}
            </div>
          ) : null}

          {/* Billing top left, logo bottom right. */}
          {metaP > 0 ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: x0 + 4 * u,
                  top: 40 * u,
                  display: "flex",
                  alignItems: "center",
                  gap: 12 * u,
                  opacity: metaP,
                  transform: `translateY(${(1 - metaP) * -12 * u}px)`,
                  fontFamily: oswald,
                  fontWeight: 400,
                  fontSize: labelFs,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: c.dim,
                }}
              >
                <div
                  style={{ width: 9 * u, height: 9 * u, background: accent }}
                />
                {billing}
              </div>
              <div
                style={{
                  position: "absolute",
                  right: x0,
                  bottom: 40 * u,
                  opacity: metaP,
                  transform: `translateY(${(1 - metaP) * 12 * u}px)`,
                }}
              >
                <RemocnLogo fontSize={36 * u} color={c.ink} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}
