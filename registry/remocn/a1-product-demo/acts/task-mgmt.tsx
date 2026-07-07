"use client";

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FLOW_BG,
  FLOW_BORDER,
  FLOW_INK,
  FLOW_MUTED,
  FLOW_YELLOW,
  FONT,
} from "../foundation";

type ChecklistRow = { label: string; highlighted?: boolean };

const CHECKLIST: ChecklistRow[] = [
  { label: "AI Workflow Setup" },
  { label: "Product Metrics Audit", highlighted: true },
  { label: "Content Calendar Prep" },
];

type DetailRow = { label: string; value: string };

const CARD_A_ROWS: DetailRow[] = [
  { label: "Deadline", value: "Jun 12, 2026" },
  { label: "Priority", value: "High" },
  { label: "Status", value: "In Progress" },
  { label: "Assignee", value: "Daniel Kim" },
];

const CARD_B_ROWS: DetailRow[] = [
  { label: "Deadline", value: "Jun 26, 2026" },
  { label: "Priority", value: "High" },
  { label: "Status", value: "In Progress" },
  { label: "Assignee", value: "John Kim" },
];

const CARD_SHADOW = "0 18px 44px rgba(30, 28, 22, 0.10)";

function FlagIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3v18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <path d="M6 4h11l-2.2 3.3L17 11H6V4Z" fill={color} />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x={3}
        y={3}
        width={18}
        height={18}
        rx={5}
        stroke={color}
        strokeWidth={2}
      />
      <path
        d="m7.5 12.2 3 3L17 9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocIcon({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h7l4 4v14H7V3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M14 3v4h4M10 13h6M10 17h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dots({ color }: { color: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <circle cx={6} cy={12} r={1.7} fill={color} />
      <circle cx={12} cy={12} r={1.7} fill={color} />
      <circle cx={18} cy={12} r={1.7} fill={color} />
    </svg>
  );
}

function ChecklistPill({
  row,
  index,
  f,
  fps,
}: {
  row: ChecklistRow;
  index: number;
  f: number;
  fps: number;
}) {
  const reveal = spring({
    frame: f - index * 6,
    fps,
    config: { damping: 18, stiffness: 130 },
  });
  const tx = interpolate(reveal, [0, 1], [-28, 0]);
  const opacity = interpolate(reveal, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: 86,
        padding: "0 26px",
        borderRadius: 14,
        background: row.highlighted ? FLOW_YELLOW : "#FFFFFF",
        border: `1px solid ${row.highlighted ? FLOW_YELLOW : FLOW_BORDER}`,
        boxShadow: row.highlighted
          ? "0 14px 34px rgba(242, 210, 0, 0.30)"
          : "0 8px 22px rgba(30, 28, 22, 0.06)",
        transform: `translateX(${tx}px)`,
        opacity,
        willChange: "transform, opacity",
      }}
    >
      <FlagIcon color={row.highlighted ? FLOW_INK : FLOW_MUTED} />
      <span
        style={{
          fontFamily: FONT,
          fontSize: 30,
          fontWeight: row.highlighted ? 600 : 500,
          color: row.highlighted ? FLOW_INK : "#6F6B5C",
          letterSpacing: "-0.01em",
        }}
      >
        {row.label}
      </span>
    </div>
  );
}

function DetailCard({
  title,
  rows,
  icon,
  reveal,
  width,
}: {
  title: string;
  rows: DetailRow[];
  icon: "check" | "doc";
  reveal: number;
  width: number;
}) {
  const ty = interpolate(reveal, [0, 1], [26, 0]);
  const scale = interpolate(reveal, [0, 1], [0.96, 1]);
  const opacity = interpolate(reveal, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width,
        background: "#FFFFFF",
        border: `1px solid ${FLOW_BORDER}`,
        borderRadius: 14,
        boxShadow: CARD_SHADOW,
        padding: "22px 26px 18px",
        transform: `translateY(${ty}px) scale(${scale})`,
        opacity,
        transformOrigin: "left top",
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          paddingBottom: 16,
          borderBottom: `1px solid ${FLOW_BORDER}`,
        }}
      >
        {icon === "check" ? (
          <CheckIcon color={FLOW_INK} />
        ) : (
          <DocIcon color={FLOW_INK} />
        )}
        <span
          style={{
            flex: 1,
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 600,
            color: FLOW_INK,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
        <Dots color={FLOW_MUTED} />
      </div>
      <div style={{ paddingTop: 14 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 0",
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 500,
                color: FLOW_MUTED,
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 600,
                color: FLOW_INK,
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cursor({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  return (
    <svg
      width={34}
      height={34}
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        filter: "drop-shadow(0 3px 5px rgba(30,28,22,0.25))",
        willChange: "left, top",
      }}
      aria-hidden
    >
      <path
        d="M5 3l14 7-6.2 1.9L9.4 18 5 3Z"
        fill={FLOW_INK}
        stroke="#FFFFFF"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TaskMgmt({ speed = 1 }: { speed?: number }) {
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const cardAReveal = spring({
    frame: f - 42,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const cardBReveal = spring({
    frame: f - 80,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const conn1 = interpolate(f, [28, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const conn2 = interpolate(f, [70, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorX = interpolate(f, [26, 60, 96, 132], [664, 1010, 1396, 1396], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(f, [26, 60, 96, 132], [552, 452, 612, 612], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorOpacity = interpolate(f, [20, 30, 138, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: FLOW_BG }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <path
          d="M630 540 C 722 540, 736 444, 820 444"
          fill="none"
          stroke={FLOW_YELLOW}
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - conn1}
        />
        <path
          d="M1200 504 C 1252 504, 1248 596, 1300 596"
          fill="none"
          stroke={FLOW_YELLOW}
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - conn2}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 387,
          width: 480,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {CHECKLIST.map((row, i) => (
          <ChecklistPill key={row.label} row={row} index={i} f={f} fps={fps} />
        ))}
      </div>

      <div style={{ position: "absolute", left: 820, top: 344 }}>
        <DetailCard
          title="Landing Page Revisions"
          rows={CARD_A_ROWS}
          icon="check"
          reveal={cardAReveal}
          width={380}
        />
      </div>

      <div style={{ position: "absolute", left: 1300, top: 484 }}>
        <DetailCard
          title="Mobile UX Updates"
          rows={CARD_B_ROWS}
          icon="doc"
          reveal={cardBReveal}
          width={380}
        />
      </div>

      <Cursor x={cursorX} y={cursorY} opacity={cursorOpacity} />
    </AbsoluteFill>
  );
}
