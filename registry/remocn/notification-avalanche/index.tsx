"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export type AvalancheGlyph = "deploy" | "mail" | "chat" | "calendar" | "card";

export interface AvalancheNotification {
  app: string;
  title: string;
  body: string;
  color: string;
  glyph?: AvalancheGlyph;
}

export interface NotificationAvalancheProps {
  notifications?: AvalancheNotification[];
  clearLabel?: string;
  clearSubLabel?: string;
  /** Final value of the runaway counter. */
  total?: number;
  /** Caption under the runaway counter beside the phone. */
  counterLabel?: string;
  surface?: "phone" | "desktop";
  wallpaper?: string;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_NOTIFICATIONS: AvalancheNotification[] = [
  {
    app: "Deploys",
    title: "Deploy failed on main",
    body: "Build #4821 exited with code 1 after 6m 12s",
    color: "#1C1C1E",
    glyph: "deploy",
  },
  {
    app: "Mail",
    title: "Maya Chen",
    body: "Re: launch video. Can we get a cut by Friday?",
    color: "#2F6FE4",
    glyph: "mail",
  },
  {
    app: "Chat",
    title: "Leo Park mentioned you",
    body: "Can you review the onboarding copy before 3pm?",
    color: "#3B8F5C",
    glyph: "chat",
  },
  {
    app: "Calendar",
    title: "Standup in 5 minutes",
    body: "Product sync · Room 4B · 6 attendees",
    color: "#D9503F",
    glyph: "calendar",
  },
  {
    app: "Chat",
    title: "Priya Raman",
    body: "the render is still 40 min out, any ideas?",
    color: "#3B8F5C",
    glyph: "chat",
  },
  {
    app: "Billing",
    title: "Invoice #2291 is overdue",
    body: "$4,280 was due yesterday. Pay now to avoid a fee.",
    color: "#C98A2E",
    glyph: "card",
  },
  {
    app: "Mail",
    title: "14 new comments",
    body: "on Q4 launch plan v7 FINAL",
    color: "#2F6FE4",
    glyph: "mail",
  },
  {
    app: "Deploys",
    title: "Error rate above 5%",
    body: "api-gateway · p95 latency 2.4s",
    color: "#1C1C1E",
    glyph: "deploy",
  },
];

const SW = 393;
const SH = 852;
const BEZEL = 11;
const CARD_H = 72;
const STEP = CARD_H + 8;
const SWIPE = 66;
const CLEAR = SWIPE + 7;

const ARRIVE: number[] = (() => {
  const out: number[] = [];
  for (let t = 8, i = 0; t < SWIPE - 4; i++) {
    out.push(Math.round(t));
    t += Math.max(2.5, 14 * 0.66 ** i);
  }
  return out;
})();
const COMPRESS = ARRIVE[3] + 2;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };

const ellipsis: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

interface Look {
  dark: boolean;
  material: string;
  blank: string;
  title: string;
  body: string;
  meta: string;
  edge: string;
  ink: string;
  muted: string;
  frame: string;
  rim: string;
}

function look(dark: boolean): Look {
  return dark
    ? {
        dark,
        material: "rgba(30,30,34,0.86)",
        blank: "rgba(44,44,50,0.78)",
        title: "#F5F5F7",
        body: "rgba(235,235,245,0.78)",
        meta: "rgba(235,235,245,0.5)",
        edge: "inset 0 0 0 0.5px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
        ink: "#F4F4F6",
        muted: "rgba(236,238,245,0.56)",
        frame: "#0B0B0D",
        rim: "inset 0 0 0 2px #3A3A3E, inset 0 0 0 3.5px #18181A",
      }
    : {
        dark,
        material: "rgba(248,248,250,0.93)",
        blank: "rgba(238,238,242,0.84)",
        title: "#111114",
        body: "rgba(17,17,20,0.8)",
        meta: "rgba(60,60,67,0.55)",
        edge: "inset 0 0 0 0.5px rgba(255,255,255,0.5), 0 6px 18px -8px rgba(20,20,30,0.28)",
        ink: "#15161A",
        muted: "rgba(21,22,26,0.52)",
        frame: "#E4E4E8",
        rim: "inset 0 0 0 2px #C9C9CE, inset 0 0 0 3.5px #F6F6F8",
      };
}

const GLYPHS: Record<AvalancheGlyph, string> = {
  deploy: "M12 3.5 20 18H4zM12 10v3.5M12 16v.01",
  mail: "M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6",
  chat: "M5 5.5h14v9.5H10l-4 3.5V15H5z",
  calendar: "M5 6.5h14V19H5zM5 10.5h14M9 4v4M15 4v4",
  card: "M4 7h16v10.5H4zM4 10.5h16M7.5 14.5h3",
};

function AppIcon({ n, size }: { n: AvalancheNotification; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        flexShrink: 0,
        background: n.color,
        boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={GLYPHS[n.glyph ?? "mail"]} />
      </svg>
    </div>
  );
}

function Card({
  n,
  width,
  radius,
  lk,
}: {
  n?: AvalancheNotification;
  width: number;
  radius: number;
  lk: Look;
}) {
  return (
    <div
      style={{
        width,
        height: CARD_H,
        borderRadius: radius,
        background: n ? lk.material : lk.blank,
        backdropFilter: "blur(28px) saturate(1.6)",
        boxShadow: lk.edge,
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "0 14px",
        boxSizing: "border-box",
      }}
    >
      {n ? (
        <>
          <AppIcon n={n} size={38} />
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.32 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span
                style={{
                  ...ellipsis,
                  flex: 1,
                  fontSize: 15.5,
                  fontWeight: 400,
                  color: lk.title,
                  letterSpacing: "-0.005em",
                }}
              >
                {n.title}
              </span>
              <span style={{ fontSize: 13, color: lk.meta, flexShrink: 0 }}>
                now
              </span>
            </div>
            <div
              style={{
                ...ellipsis,
                fontSize: 14.5,
                color: lk.body,
                fontWeight: 300,
              }}
            >
              {n.body}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stack({
  f,
  fps,
  list,
  width,
  radius,
  maxRows,
  from,
  lk,
}: {
  f: number;
  fps: number;
  list: AvalancheNotification[];
  width: number;
  radius: number;
  maxRows: number;
  from: "top" | "right";
  lk: Look;
}) {
  const c = spring({ frame: f - COMPRESS, fps, config: HEAVY });
  const arrived = ARRIVE.filter((t) => t <= f).length;
  const enters = ARRIVE.map((t) => spring({ frame: f - t, fps, config: CARD }));
  const swipeT = (i: number) =>
    interpolate(f, [SWIPE + i * 0.75, SWIPE + 8 + i * 0.75], [0, 1], {
      ...clamp,
      easing: EXIT,
    });
  const away = (i: number): React.CSSProperties => {
    const st = swipeT(i);
    return {
      transform: `translateX(${-st * width * 1.15}px) rotate(${-st * 4}deg)`,
      opacity: interpolate(st, [0.3, 0.85], [1, 0], clamp),
    };
  };
  const card = (
    key: string | number,
    y: number,
    s: number,
    op: number,
    n: AvalancheNotification | undefined,
    i: number,
    x = 0,
  ) => (
    <div
      key={key}
      style={{ position: "absolute", left: 0, top: 0, ...away(i) }}
    >
      <div
        style={{
          opacity: op,
          transform: `translate(${x}px, ${y}px) scale(${s})`,
          transformOrigin: "50% 0%",
        }}
      >
        <Card n={n} width={width} radius={radius} lk={lk} />
      </div>
    </div>
  );

  const cards: React.ReactNode[] = [];
  const newest = arrived - 1;
  const inEnter = (e: number) =>
    from === "top"
      ? { y: -(1 - e) * 24, s: interpolate(e, [0, 1], [0.96, 1]), x: 0 }
      : { y: 0, s: 1, x: (1 - e) * width * 0.6 };

  if (c < 0.98) {
    let depth = 0;
    for (let idx = newest; idx >= 0 && depth <= maxRows; idx--) {
      if (idx < newest) depth += Math.min(1, enters[idx + 1]);
      const e = inEnter(enters[idx]);
      const g = Math.min(depth, 2);
      const y = interpolate(c, [0, 1], [depth * STEP, g * 9]) + e.y;
      const s = interpolate(c, [0, 1], [1, 1 - g * 0.05]) * e.s;
      const fade = interpolate(
        depth * STEP,
        [(maxRows - 1) * STEP, maxRows * STEP],
        [1, 0],
        clamp,
      );
      const op =
        fade *
        interpolate(c, [0, 1], [1, depth < 2.5 ? 1 : 0]) *
        interpolate(enters[idx], [0, 0.2], [0, 1], clamp);
      const blank = depth > 0.5 && c > 0.35;
      cards.push(
        card(
          idx,
          y,
          s,
          op,
          blank ? undefined : list[idx % list.length],
          Math.min(Math.round(depth), 2),
          e.x,
        ),
      );
    }
  } else {
    const e = enters[newest];
    const bump = Math.sin(Math.min(1, e) * Math.PI) * 3;
    cards.push(card("p2", 18 + bump, 0.9, 1, undefined, 2));
    cards.push(card("p1", 9 + bump, 0.95, 1, undefined, 1));
    if (e < 0.999 && newest > 0)
      cards.push(
        card(
          newest - 1,
          bump * 0.6,
          1,
          1,
          e > 0.05 ? undefined : list[(newest - 1) % list.length],
          0,
        ),
      );
    const t = inEnter(e);
    cards.push(
      card(
        newest,
        t.y,
        t.s,
        interpolate(e, [0, 0.15], [0, 1], clamp),
        list[newest % list.length],
        0,
        t.x,
      ),
    );
  }

  return (
    <div style={{ position: "relative", width, height: CARD_H }}>
      {c < 0.98 ? cards.reverse() : cards}
    </div>
  );
}

function ClearMark({ f, fps, size }: { f: number; fps: number; size: number }) {
  const pop = spring({ frame: f - CLEAR, fps, config: CHIP });
  const draw = interpolate(f, [CLEAR + 2, CLEAR + 14], [0, 1], {
    ...clamp,
    easing: LIGHT,
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="#fff"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity: interpolate(pop, [0, 0.4], [0, 0.92], clamp),
        transform: `translateY(${(1 - pop) * 10}px) scale(${interpolate(pop, [0, 1], [0.8, 1])})`,
      }}
    >
      <path
        d="M8 27 13 12h22l5 15v9H8zM8 27h9l2 4h10l2-4h9"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      <path
        d="M19 19.5l3.5 3.5 6.5-6.5"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - interpolate(draw, [0.5, 1], [0, 1], clamp)}
      />
    </svg>
  );
}

function RoundButton({ d }: { d: string }) {
  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={d} />
      </svg>
    </div>
  );
}

function LockScreen({
  f,
  fps,
  list,
  wallpaper,
  lk,
}: {
  f: number;
  fps: number;
  list: AvalancheNotification[];
  wallpaper: string;
  lk: Look;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#101114",
        color: "#fff",
      }}
    >
      <Img
        src={wallpaper}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "34% 50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: lk.dark
            ? "linear-gradient(180deg, rgba(4,6,12,0.55) 0%, rgba(4,6,12,0.18) 34%, rgba(4,6,12,0.28) 70%, rgba(4,6,12,0.6) 100%)"
            : "linear-gradient(180deg, rgba(10,14,24,0.32) 0%, rgba(10,14,24,0.04) 36%, rgba(10,14,24,0.08) 72%, rgba(10,14,24,0.34) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 32,
          display: "flex",
          gap: 6,
          alignItems: "center",
          height: 22,
        }}
      >
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.6}
              y={9 - i * 3}
              width={3.2}
              height={3 + i * 3}
              rx={0.8}
              fill="#fff"
            />
          ))}
        </svg>
        <div
          style={{
            width: 25,
            height: 12,
            borderRadius: 3.5,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7)",
            padding: 1.5,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "64%",
              height: "100%",
              borderRadius: 2,
              background: "#fff",
            }}
          />
        </div>
      </div>
      <svg
        width="14"
        height="18"
        viewBox="0 0 14 18"
        fill="none"
        stroke="#fff"
        strokeWidth={1.5}
        style={{ position: "absolute", top: 62, left: SW / 2 - 7 }}
      >
        <rect x="1.5" y="8" width="11" height="8.5" rx="2" />
        <path d="M3.8 8V5.6a3.2 3.2 0 0 1 6.4 0V8" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 90,
          width: "100%",
          textAlign: "center",
          fontSize: 20,
          fontWeight: 400,
          opacity: 0.86,
        }}
      >
        Tuesday 9 January
      </div>
      <div
        style={{
          position: "absolute",
          top: 104,
          width: "100%",
          textAlign: "center",
          fontSize: 108,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          opacity: 0.95,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        9:41
      </div>
      <div style={{ position: "absolute", top: 268, left: 14 }}>
        <Stack
          f={f}
          fps={fps}
          list={list}
          width={SW - 28}
          radius={22}
          maxRows={5}
          from="top"
          lk={lk}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ClearMark f={f} fps={fps} size={64} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 46,
          left: 46,
          right: 46,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <RoundButton d="M9 3h6v4l-1.5 2.5V21h-3V9.5L9 7zM12 12.5v2" />
        <RoundButton d="M4 8h3.2l1.8-2.5h6l1.8 2.5H20v11H4zM12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 9,
          left: SW / 2 - 68,
          width: 136,
          height: 5,
          borderRadius: 3,
          background: "#fff",
        }}
      />
    </div>
  );
}

function SideCopy({
  f,
  total,
  counterLabel,
  clearLabel,
  clearSubLabel,
  size,
  lk,
  align,
  accent,
}: {
  f: number;
  accent: string;
  total: number;
  counterLabel: string;
  clearLabel: string;
  clearSubLabel: string;
  size: number;
  lk: Look;
  align: "left" | "center";
}) {
  const arrived = ARRIVE.filter((t) => t <= f).length;
  const countT = interpolate(f, [COMPRESS + 2, SWIPE - 4], [0, 1], clamp);
  const count = Math.round(Math.max(arrived, 4 + (total - 4) * countT ** 2.4));
  const tick = arrived > 0 ? f - ARRIVE[arrived - 1] : 99;
  const punch = 1 + 0.035 * Math.exp(-Math.max(0, tick) / 2.2);
  const numIn = interpolate(f, [2, 14], [0, 1], { ...clamp, easing: ENTER });
  const numOut = interpolate(f, [SWIPE - 2, SWIPE + 6], [0, 1], {
    ...clamp,
    easing: EXIT,
  });
  const capIn = interpolate(f, [6, 18], [0, 1], { ...clamp, easing: ENTER });
  const payIn = interpolate(f, [CLEAR, CLEAR + 14], [0, 1], {
    ...clamp,
    easing: ENTER,
  });
  const subIn = interpolate(f, [CLEAR + 5, CLEAR + 19], [0, 1], {
    ...clamp,
    easing: LIGHT,
  });
  const rule = interpolate(f, [CLEAR + 8, CLEAR + 24], [0, 1], {
    ...clamp,
    easing: MOVE,
  });
  const drift = interpolate(f, [CLEAR, CLEAR + 60], [0, 1], {
    ...clamp,
    easing: MOVE,
  });
  const origin = align === "left" ? "0% 100%" : "50% 100%";
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: size * 1.5,
        textAlign: align,
        color: lk.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: size * 0.42,
          opacity: numIn * (1 - numOut),
          transform: `translateY(${(1 - numIn) * size * 0.12 - numOut * size * 0.16}px)`,
          filter: `blur(${(1 - numIn) * 6 + numOut * 6}px)`,
        }}
      >
        <div
          style={{
            fontSize: size,
            fontWeight: 300,
            letterSpacing: "-0.045em",
            lineHeight: 0.9,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${punch})`,
            transformOrigin: origin,
          }}
        >
          {count}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: size * 0.12,
          fontSize: size * 0.17,
          fontWeight: 400,
          color: lk.muted,
          letterSpacing: "-0.01em",
          opacity: capIn * (1 - numOut),
          transform: `translateY(${(1 - capIn) * 12}px)`,
        }}
      >
        {counterLabel}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: size * 0.42,
          overflow: "hidden",
          paddingBottom: size * 0.08,
        }}
      >
        <div
          style={{
            fontSize: size * 0.5,
            fontWeight: 300,
            letterSpacing: "-0.035em",
            lineHeight: 1.04,
            transform: `translateY(${(1 - payIn) * 110 - drift * 4}%)`,
            opacity: payIn > 0 ? 1 : 0,
          }}
        >
          {clearLabel}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: size * 0.36,
          left: align === "left" ? 0 : "50%",
          width: size * 0.9,
          height: Math.max(2, size * 0.014),
          borderRadius: 2,
          background: accent,
          transformOrigin: align === "left" ? "0% 50%" : "50% 50%",
          transform: `${align === "left" ? "" : "translateX(-50%) "}scaleX(${rule})`,
        }}
      />
      {clearSubLabel ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: size * 0.12,
            fontSize: size * 0.17,
            fontWeight: 400,
            color: lk.muted,
            fontVariantNumeric: "tabular-nums",
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 12}px)`,
          }}
        >
          {clearSubLabel}
        </div>
      ) : null}
    </div>
  );
}

export function NotificationAvalanche({
  notifications = DEFAULT_NOTIFICATIONS,
  clearLabel = "All caught up.",
  clearSubLabel = "remocn sorted 128 notifications",
  total = 128,
  counterLabel = "unread before 10 am",
  surface = "phone",
  wallpaper = staticFile("reel/reel-1.jpg"),
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: NotificationAvalancheProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const list = notifications.length ? notifications : DEFAULT_NOTIFICATIONS;
  const dark = theme === "dark";
  const lk = look(dark);
  const tall = height > width;

  const buzzAmp = interpolate(
    f,
    [ARRIVE[4], ARRIVE[8], SWIPE - 8, SWIPE - 2],
    [0, 1.6, 1.6, 0],
    clamp,
  );
  const buzz = Math.sin(f * 2.9) * buzzAmp;

  const groundLayer = (
    <>
      <GshGround
        preset={ground ?? (dark ? "earthshine" : "glasswork")}
        params={groundParams}
        timeOffset={dark ? 3 : 5}
        timeScale={0.35}
      />
      <AbsoluteFill
        style={{
          background: dark ? "rgba(2,3,8,0.28)" : "rgba(244,243,240,0.3)",
        }}
      />
    </>
  );

  const copyProps = {
    f,
    accent,
    total,
    counterLabel,
    clearLabel,
    clearSubLabel,
    lk,
  };

  if (surface === "desktop") {
    const u = height / 720;
    const cardW = 356;
    return (
      <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
        {groundLayer}
        <div
          style={{
            position: "absolute",
            top: 72 * u,
            right: 72 * u,
            width: cardW,
            transform: `scale(${u * 1.15}) translateX(${buzz}px)`,
            transformOrigin: "100% 0%",
          }}
        >
          <Stack
            f={f}
            fps={fps}
            list={list}
            width={cardW}
            radius={16}
            maxRows={6}
            from="right"
            lk={lk}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: width * 0.08,
            bottom: height * 0.1,
            width: width * 0.5,
          }}
        >
          <SideCopy {...copyProps} size={height * 0.24} align="left" />
        </div>
      </AbsoluteFill>
    );
  }

  const k = tall
    ? (height * 0.54) / (SH + BEZEL * 2)
    : (height * 0.92) / (SH + BEZEL * 2);
  const phoneCx = tall ? width / 2 : width * 0.69;
  const phoneCy = tall ? height * 0.6 : height / 2;
  const enter = spring({ frame: f, fps, config: HEAVY });
  const push = interpolate(
    f,
    [ARRIVE[1], ARRIVE[6], SWIPE + 2, CLEAR + 14],
    [1, 1.18, 1.18, 1.02],
    { ...clamp, easing: MOVE },
  );
  const focusY = interpolate(push, [1, 1.18], [0, 80 * k]);
  const copySize = tall ? width * 0.3 : height * 0.25;
  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {groundLayer}
      <div
        style={{
          position: "absolute",
          left: tall ? width * 0.09 : width * 0.075,
          width: tall ? width * 0.82 : width * 0.42,
          ...(tall
            ? { top: height * 0.06 }
            : { top: height / 2 - copySize * 0.75 }),
        }}
      >
        <SideCopy
          {...copyProps}
          size={copySize}
          align={tall ? "center" : "left"}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: phoneCx - (SW / 2 + BEZEL),
          top: phoneCy - (SH / 2 + BEZEL),
          width: SW + BEZEL * 2,
          height: SH + BEZEL * 2,
          borderRadius: 68,
          background: lk.frame,
          boxShadow: `${lk.rim}, 0 2px 6px rgba(0,0,0,${dark ? 0.45 : 0.14}), 0 30px 70px -18px rgba(0,0,0,${dark ? 0.7 : 0.32})`,
          transform: `translateX(${buzz}px) translateY(${(1 - enter) * 60 + focusY}px) scale(${k * push * interpolate(enter, [0, 1], [0.94, 1])})`,
          opacity: interpolate(enter, [0, 0.35], [0, 1], clamp),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: BEZEL,
            top: BEZEL,
            width: SW,
            height: SH,
            borderRadius: 56,
            overflow: "hidden",
          }}
        >
          <LockScreen
            f={f}
            fps={fps}
            list={list}
            wallpaper={wallpaper}
            lk={lk}
          />
          <div
            style={{
              position: "absolute",
              top: 11,
              left: (SW - 126) / 2,
              width: 126,
              height: 37,
              borderRadius: 19,
              background: "#000",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}
