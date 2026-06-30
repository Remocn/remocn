"use client";

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  Camera,
  FLOW_BG,
  FLOW_BORDER,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT,
} from "../foundation";

const EASE = Easing.out(Easing.cubic);

const TIMES = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"];

const CARD_W = 1200;
const PAD = 40;
const CONTENT_W = CARD_W - PAD * 2;
const AXIS_W = 60;
const GRID_W = CONTENT_W - AXIS_W;
const ROW_H = 50;
const GRID_H = ROW_H * (TIMES.length - 1);

const ACCENT_BAR = "#2F8F83";
const BLUE_INK = "#3B6FE0";
const BLUE_BG = "#E9F0FC";
const PILL_MUTED_BG = "#F1EFE6";
const AVATAR_A = "#D9A38C";
const AVATAR_B = "#8FA6CF";
const AVATAR_C = "#C9B36E";

function clampInterp(
  f: number,
  input: [number, number] | [number, number, number],
  output: [number, number] | [number, number, number],
  easing?: (n: number) => number,
) {
  return interpolate(f, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

function ExpandGlyph() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: `1px solid ${FLOW_BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
        <title>Expand</title>
        <path
          d="M4.5 9.5L9.5 4.5M9.5 4.5H5.2M9.5 4.5V8.8"
          stroke={FLOW_MUTED}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Avatar({ color, z }: { color: string; z: number }) {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        background: color,
        border: "2px solid #fff",
        marginLeft: -7,
        zIndex: z,
      }}
    />
  );
}

function Kebab() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        marginLeft: 10,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 3,
            borderRadius: 999,
            background: FLOW_MUTED,
          }}
        />
      ))}
    </div>
  );
}

function TaskBlock({
  f,
  start,
  top,
  width,
  label,
  pillText,
  pillColor,
  pillBg,
  avatars,
  kebab = false,
}: {
  f: number;
  start: number;
  top: number;
  width: number;
  label: string;
  pillText: string;
  pillColor: string;
  pillBg: string;
  avatars: string[];
  kebab?: boolean;
}) {
  const p = clampInterp(f, [start, start + 18], [0, 1], EASE);
  return (
    <div
      style={{
        position: "absolute",
        left: 6,
        top,
        width,
        height: 40,
        display: "flex",
        alignItems: "center",
        background: "#fff",
        border: `1px solid ${FLOW_BORDER}`,
        borderRadius: 8,
        boxShadow: "0 6px 18px rgba(30,28,22,0.05)",
        paddingRight: 12,
        overflow: "hidden",
        opacity: p,
        transform: `translateX(${(1 - p) * -22}px)`,
      }}
    >
      <div style={{ width: 4, height: "100%", background: ACCENT_BAR }} />
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: FLOW_INK,
          marginLeft: 14,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: pillColor,
          background: pillBg,
          padding: "3px 9px",
          borderRadius: 6,
          marginLeft: 12,
          whiteSpace: "nowrap",
        }}
      >
        {pillText}
      </span>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex" }}>
          {avatars.map((c, i) => (
            <Avatar key={c} color={c} z={avatars.length - i} />
          ))}
        </div>
        {kebab ? <Kebab /> : null}
      </div>
    </div>
  );
}

function Cursor({ f }: { f: number }) {
  const appear = clampInterp(f, [90, 102], [0, 1], EASE);
  const x = clampInterp(f, [90, 116], [40, 6], EASE);
  const y = clampInterp(f, [90, 116], [34, 16], EASE);
  return (
    <svg
      width={22}
      height={24}
      viewBox="0 0 22 24"
      fill="none"
      style={{
        position: "absolute",
        left: GRID_W * 0.42 + x,
        top: ROW_H * 5 - 6 + y,
        opacity: appear,
        filter: "drop-shadow(0 2px 4px rgba(30,28,22,0.18))",
      }}
    >
      <title>Cursor</title>
      <path
        d="M3 2.5L17 12.5L10.2 13.6L13.4 20.2L10.6 21.5L7.4 14.9L3 19.2V2.5Z"
        fill="#fff"
        stroke={FLOW_INK}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AIPlanning({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;

  const craneScale = clampInterp(f, [0, 24], [1.04, 1], EASE);
  const craneY = clampInterp(f, [0, 24], [40, 0], EASE);
  const craneBlur = clampInterp(f, [0, 14, 24], [8, 3, 0]);

  const cardOpacity = clampInterp(f, [0, 12], [0, 1]);
  const headP = clampInterp(f, [10, 26], [0, 1], EASE);
  const titleP = clampInterp(f, [16, 32], [0, 1], EASE);
  const gridP = clampInterp(f, [26, 42], [0, 1], EASE);
  const markerP = clampInterp(f, [56, 74], [0, 1], EASE);

  const columns = 6;

  return (
    <AbsoluteFill style={{ background: FLOW_BG, fontFamily: FONT }}>
      <Camera scale={craneScale} y={craneY} blur={craneBlur}>
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <div
            style={{
              width: CARD_W,
              background: "#fff",
              border: `1px solid ${FLOW_BORDER}`,
              borderRadius: 16,
              boxShadow: "0 26px 70px rgba(30,28,22,0.08)",
              padding: PAD,
              opacity: cardOpacity,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: headP,
                transform: `translateY(${(1 - headP) * 8}px)`,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: FLOW_MUTED,
                  background: PILL_MUTED_BG,
                  padding: "6px 12px",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>&lsaquo;</span>
                AI Planning
              </span>
              <ExpandGlyph />
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: FLOW_INK,
                letterSpacing: "-0.01em",
                marginTop: 22,
                marginBottom: 26,
                opacity: titleP,
                transform: `translateY(${(1 - titleP) * 10}px)`,
              }}
            >
              Intelligently plan your entire day
            </div>

            <div
              style={{
                position: "relative",
                height: GRID_H + 10,
                paddingLeft: AXIS_W,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: AXIS_W,
                  height: GRID_H,
                }}
              >
                {TIMES.map((t, i) => (
                  <span
                    key={t}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: i * ROW_H - 7,
                      fontSize: 12,
                      color: FLOW_MUTED,
                      opacity: clampInterp(
                        f,
                        [28 + i * 2, 40 + i * 2],
                        [0, 1],
                      ),
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: AXIS_W,
                  top: 0,
                  width: GRID_W,
                  height: GRID_H,
                }}
              >
                <div style={{ opacity: gridP }}>
                  {TIMES.map((t, i) => (
                    <div
                      key={t}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: i * ROW_H,
                        width: "100%",
                        height: 1,
                        background: FLOW_BORDER,
                      }}
                    />
                  ))}
                  {Array.from({ length: columns }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: ((i + 1) * GRID_W) / (columns + 1),
                        width: 1,
                        height: GRID_H,
                        background: FLOW_BORDER,
                        opacity: 0.55,
                      }}
                    />
                  ))}
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: GRID_W * 0.3,
                    top: ROW_H * 1 + 4,
                    width: 2,
                    height: ROW_H - 6,
                    background: FLOW_YELLOW,
                    opacity: markerP,
                    transform: `scaleY(${markerP})`,
                    transformOrigin: "top",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: GRID_W * 0.3 - 4,
                    top: ROW_H * 1,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: FLOW_YELLOW,
                    opacity: markerP,
                  }}
                />

                <TaskBlock
                  f={f}
                  start={40}
                  top={ROW_H * 2 - 20}
                  width={520}
                  label="Competitor research"
                  pillText="Research"
                  pillColor={BLUE_INK}
                  pillBg={BLUE_BG}
                  avatars={[AVATAR_A, AVATAR_B]}
                />
                <TaskBlock
                  f={f}
                  start={54}
                  top={ROW_H * 5 - 20}
                  width={380}
                  label="Dev handoff"
                  pillText="Handoff"
                  pillColor={FLOW_MUTED}
                  pillBg={PILL_MUTED_BG}
                  avatars={[AVATAR_C, AVATAR_B, AVATAR_A]}
                  kebab
                />

                <Cursor f={f} />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  );
}
