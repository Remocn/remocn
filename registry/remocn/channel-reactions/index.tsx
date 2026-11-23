"use client";

import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const onest = loadOnest("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface ChannelAuthor {
  name: string;
  color: string;
}

export interface ChannelReaction {
  emoji: string;
  count: number;
}

export interface ChannelReply {
  author: ChannelAuthor;
  text: string;
}

export interface ChannelReactionsProps {
  author?: ChannelAuthor;
  message?: string;
  link?: { url: string; title: string; description: string; site: string };
  /** Unfurl image. */
  image?: string;
  reactions?: ChannelReaction[];
  replies?: ChannelReply[];
  /** Final "N replies" count on the thread line. */
  replyCount?: number;
  workspace?: string;
  channel?: string;
  /** Large line above the window in the 9:16 layout. */
  headline?: string;
  /** Timestamp on the launch message. */
  time?: string;
  /** Muted note after the reply count on the thread line. */
  lastReplyLabel?: string;
  /** Frames between reaction chips popping in. */
  stagger?: number;
  theme?: "light" | "dark";
  accent?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Onest by default. */
  fontFamily?: string;
  /** Size of the window, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const PEOPLE = {
  maya: { name: "Maya Chen", color: "#B4577E" },
  leo: { name: "Leo Park", color: "#3E7F62" },
  priya: { name: "Priya Raman", color: "#B26B2C" },
  sam: { name: "Sam Ortiz", color: "#4A6FA8" },
};

const DEFAULT_REACTIONS: ChannelReaction[] = [
  { emoji: "🚀", count: 48 },
  { emoji: "🔥", count: 36 },
  { emoji: "🎉", count: 27 },
  { emoji: "👏", count: 19 },
  { emoji: "🙌", count: 12 },
];

const HISTORY: { person: ChannelAuthor; time: string; text: string }[] = [
  {
    person: PEOPLE.sam,
    time: "9:48 AM",
    text: "Launch checklist is pinned. Shout if anything is still blocked.",
  },
  {
    person: PEOPLE.leo,
    time: "10:02 AM",
    text: "Final cut is rendering now, about five minutes to go.",
  },
  {
    person: PEOPLE.priya,
    time: "10:06 AM",
    text: "Changelog is merged and the docs are live.",
  },
];

const DEFAULT_REPLIES: ChannelReply[] = [
  {
    author: PEOPLE.leo,
    text: "Already rebuilding our onboarding video with it.",
  },
  { author: PEOPLE.priya, text: "The captions tab alone is worth it." },
];

const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const PRESS = { mass: 0.4, damping: 14, stiffness: 420 };
const HAND = { mass: 0.9, damping: 22, stiffness: 140 };
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function palette(theme: "light" | "dark", accent: string) {
  const d = theme === "dark";
  return {
    dark: d,
    window: d ? "#141518" : "#FFFFFF",
    side: d ? "#101114" : "#F7F5F1",
    text: d ? "#DADBDE" : "#2A2926",
    strong: d ? "#F4F4F5" : "#151412",
    muted: d ? "#8E9097" : "#7A766F",
    rule: d ? "rgba(255,255,255,0.07)" : "rgba(30,28,24,0.08)",
    pill: d ? "rgba(255,255,255,0.06)" : "rgba(30,28,24,0.05)",
    link: d ? "#9DB4FF" : accent,
    hover: d ? "rgba(255,255,255,0.035)" : "rgba(30,28,24,0.03)",
    panel: d ? "#1E1F23" : "#FFFFFF",
    depth: d
      ? "0 0 0 1px rgba(255,255,255,0.09), 0 12px 24px -12px rgba(0,0,0,0.6), 0 40px 90px -24px rgba(0,0,0,0.7)"
      : "0 0 0 1px rgba(30,20,10,0.06), 0 2px 4px rgba(30,20,10,0.04), 0 40px 90px -24px rgba(90,40,10,0.32)",
    raised: d
      ? "0 0 0 1px rgba(255,255,255,0.09), 0 8px 18px -8px rgba(0,0,0,0.6)"
      : "0 0 0 1px rgba(30,28,24,0.07), 0 1px 2px rgba(30,28,24,0.05), 0 8px 18px -8px rgba(30,28,24,0.16)",
    outline: d ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  };
}
type Pal = ReturnType<typeof palette>;

function Avatar({ person, size }: { person: ChannelAuthor; size: number }) {
  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, size < 30 ? 1 : 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size * 0.28,
        background: person.color,
        color: "rgba(255,255,255,0.95)",
        fontSize: size * (size < 30 ? 0.46 : 0.38),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {Math.max(1, Math.floor(value))}
    </span>
  );
}

/**
 * A row that opens from 0 to its content's height. With `cut` it is laid out
 * fully open and that much of its bottom is clipped off instead, so nothing
 * around it is pushed by layout while it opens.
 */
function Grow({
  p,
  cut,
  children,
}: {
  p: number;
  cut?: number;
  children: React.ReactNode;
}) {
  const open = p >= 0.999;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: cut === undefined ? `${clamp(p, 0, 1)}fr` : "1fr",
      }}
    >
      <div
        style={{
          minHeight: 0,
          overflow: open ? "visible" : "hidden",
          clipPath:
            cut === undefined || open ? undefined : `inset(0 0 ${cut}px 0)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Height layout gives an element: unrounded, and blind to transforms. */
function layoutHeight(el: Element | null | undefined) {
  if (!el) return 0;
  const style = getComputedStyle(el);
  const height = Number.parseFloat(style.height) || 0;
  return style.boxSizing === "border-box"
    ? height
    : height +
        Number.parseFloat(style.paddingTop) +
        Number.parseFloat(style.paddingBottom);
}

function Message({
  person,
  time,
  pal,
  children,
  context,
  bg,
  pad,
  cut,
}: {
  person: ChannelAuthor;
  time: string;
  pal: Pal;
  children: React.ReactNode;
  context?: string;
  bg?: string;
  pad: number;
  /** Px clipped off the bottom while a block inside is laid out ahead. */
  cut?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: `10px ${pad}px`,
        background: bg,
        position: "relative",
        clipPath: cut ? `inset(0 0 ${cut}px 0)` : undefined,
      }}
    >
      <Avatar person={person} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {context ? (
          <div style={{ fontSize: 14, color: pal.muted, marginBottom: 2 }}>
            replied to a thread: {context}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, color: pal.strong }}>{person.name}</span>
          <span style={{ fontSize: 14, color: pal.muted }}>{time}</span>
        </div>
        <div
          style={{
            fontSize: 16,
            lineHeight: "24px",
            color: pal.text,
            marginTop: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function MacCursor({ press }: { press: number }) {
  return (
    <svg
      width={22}
      height={26}
      viewBox="0 0 20 24"
      style={{
        transformOrigin: "2px 2px",
        transform: `scale(${1 - 0.12 * press})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        overflow: "visible",
      }}
    >
      <path
        d="M2 2 L2 19.5 L6.6 15.4 L9.8 22.4 L12.9 21 L9.8 14.2 L16 14.2 Z"
        fill="#FFFFFF"
        stroke="#111114"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const I = {
  emoji:
    "M12 20 A8 8 0 1 1 12 4 A8 8 0 0 1 12 20 Z M9 10 H9.01 M15 10 H15.01 M8.5 14 C10 16 14 16 15.5 14",
  reply: "M5 6 H19 V16 H11 L7 19 V16 H5 Z",
  dots: "M12 6 H12.01 M12 12 H12.01 M12 18 H12.01",
  plus: "M12 6 V18 M6 12 H18",
  send: "M4 12 L20 5 L15 20 L11 13 Z",
  hash: "M9.5 4 L8 20 M16 4 L14.5 20 M5 9 H19.5 M4.5 15 H19",
  chev: "M7 10 L12 15 L17 10",
};
const ic = (d: string, color: string, size = 18) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

const CHANNELS = ["general", "design", "launch", "marketing"];

function Sidebar({
  pal,
  workspace,
  channel,
}: {
  pal: Pal;
  workspace: string;
  channel: string;
}) {
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: pal.side,
        boxShadow: `inset -1px 0 0 ${pal.rule}`,
        padding: "18px 12px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 17,
          color: pal.strong,
          padding: "0 10px 18px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          letterSpacing: "-0.01em",
        }}
      >
        {workspace}
        {ic(I.chev, pal.muted, 16)}
      </div>
      <div style={{ fontSize: 14, color: pal.muted, padding: "0 10px 8px" }}>
        Channels
      </div>
      {CHANNELS.map((ch) => {
        const active = ch === "launch";
        const label = active ? channel : ch;
        return (
          <div
            key={ch}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 34,
              padding: "0 10px",
              borderRadius: 8,
              fontSize: 15,
              background: active ? pal.pill : undefined,
              color: active ? pal.strong : pal.muted,
            }}
          >
            {ic(I.hash, active ? pal.strong : pal.muted, 15)}
            {label}
          </div>
        );
      })}
    </div>
  );
}

export function ChannelReactions({
  author = PEOPLE.maya,
  message = "remocn v2 is live. Thirty new components, a captions tab, and a studio that renders right in your browser. Take it for a spin:",
  link = {
    url: "remocn.dev/v2",
    site: "remocn.dev",
    title: "remocn 2.0: launch videos from components",
    description:
      "Copy-paste Remotion components for every beat of your launch video.",
  },
  image,
  reactions = DEFAULT_REACTIONS,
  replies = DEFAULT_REPLIES,
  replyCount = 14,
  workspace = "remocn",
  channel = "launch",
  headline = "Launch day, live",
  time = "10:30 AM",
  lastReplyLabel = "Last reply just now",
  stagger = 6,
  theme = "light",
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = onest.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  ground,
  groundParams,
}: ChannelReactionsProps) {
  const glide = useGlide();
  const rawFrame = useSceneFrame();
  const frame = Math.max(0, rawFrame - delay) * speed;
  const { width, height, fps } = useSceneConfig();
  const tall = height > width;
  const SW = tall ? 720 : 1280;
  const SH = tall ? 1280 : 720;
  const u = Math.min(width / SW, height / SH);
  const base = palette(theme, accent);
  const pal: Pal =
    ink === undefined ? base : { ...base, text: ink, strong: ink };
  const spAt = (
    f: number,
    at: number,
    config: Partial<typeof CARD>,
    dur?: number,
  ) => spring({ frame: f - at, fps, config, durationInFrames: dur });
  const sp = (at: number, config: Partial<typeof CARD>, dur?: number) =>
    spAt(frame, at, config, dur);
  // Whether a value of the frame is moving right now: springs overshoot and
  // trail off, so it is read against the neighbouring frames instead of a
  // progress. Nothing moves while `delay` holds the first frame.
  const stirs = (at: (f: number) => number, eps = 1e-5) =>
    rawFrame >= delay &&
    (Math.abs(at(frame + speed) - at(frame)) > eps ||
      Math.abs(at(frame) - at(frame - speed)) > eps);
  const ease = (a: number, b: number, easing = ENTER) =>
    interpolate(frame, [a, b], [0, 1], { ...CL, easing });

  const WIN = tall
    ? { x: 80, y: 290, w: 560, h: 880 }
    : { x: 140, y: 64, w: 1000, h: 592 };
  const SIDE = tall ? 0 : 220;
  const PAD = tall ? 18 : 24;
  const mainW = WIN.w - SIDE;

  const win = sp(0, HEAVY);
  const winFade = ease(0, 12);
  const camAt = (f: number) =>
    interpolate(f, [0, 220], [1, 1.03], {
      ...CL,
      easing: CAMERA,
    });
  const cam = camAt(frame);
  // The camera eases in and out over the whole scene, so the window counts
  // as moving while its furthest line still travels a thousandth of a pixel
  // a frame; below that it is at rest and gets no tilt.
  const winMoving =
    stirs((f) => spAt(f, 0, HEAVY) * 60, 5e-4) ||
    stirs((f) => (0.96 + 0.04 * spAt(f, 0, HEAVY)) * camAt(f), 2e-6);
  const headIn = ease(4, 20);

  const msgIn = sp(16, MORPH, 16);
  const msgFade = ease(16, 26);
  const unfurl = sp(30, MORPH, 16);
  const unfurlFade = ease(32, 44);

  const barW = 268;
  const barX = mainW - PAD - barW;
  const target = { x: barX + 24, y: -6 };
  const cursorKeys = [
    { f: 44, x: mainW + 40, y: 300 },
    { f: 76, x: target.x, y: target.y },
    { f: 86, x: target.x, y: target.y },
    { f: 112, x: mainW + 60, y: 380 },
  ];
  let cx = cursorKeys[0].x;
  let cy = cursorKeys[0].y;
  for (let i = 1; i < cursorKeys.length; i++) {
    const a = cursorKeys[i - 1];
    const b = cursorKeys[i];
    if (frame < a.f) break;
    const p = sp(a.f, HAND, b.f - a.f);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const arc = Math.sin(clamp(p) * Math.PI) * Math.min(50, d * 0.16);
    cx = a.x + dx * p + (dy / d) * arc;
    cy = a.y + dy * p - (dx / d) * arc;
  }
  const press = sp(76, PRESS) - sp(81, PRESS);
  const cursorOpacity = ease(44, 52) * (1 - ease(104, 112, EXIT));
  const hover = ease(56, 64) * (1 - ease(92, 100, EXIT));
  const barIn = sp(58, CARD);
  const barOut = 1 - ease(90, 98, EXIT);

  const popAt = reactions.map((_, i) => (i === 0 ? 80 : 86 + i * stagger));
  const rowIn = sp(78, MORPH, 12);
  const threadIn = sp(104, MORPH, 14);
  const replyAt = replies.map((_, i) => 120 + i * 24);

  // The channel sticks to its bottom edge, so a block that opens pushes every
  // line above it up by layout, and layout rounds each baseline and box edge
  // on the way: the lines click up pixel by pixel, each on its own frame.
  // While a block opens, the column is laid out with that block already open
  // and the height still to come sits on one translate of the whole column,
  // with the block clipped down to what it showed. The blocks open strictly
  // from the top down, so nothing visible sits below one that moves and
  // nothing needs a translate of its own. At rest the markup is the plain
  // `Grow`.
  const messageRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Natural heights: the message without its blocks, then each block in
  // order (unfurl, reactions, thread line, replies).
  const [heights, setHeights] = useState<number[]>([]);
  // A font that arrives after the first render changes the heights with no
  // render to follow (a still, a paused player), so the frame is held until
  // the fonts are in and the heights have been read once more.
  const [handle] = useState(() => delayRender("channel-reactions: measuring"));
  const [fontsIn, setFontsIn] = useState(false);
  useEffect(() => {
    let live = true;
    onest
      .waitUntilDone()
      .then(() => document.fonts.ready)
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsIn(true);
        else continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle]);
  useLayoutEffect(() => {
    if (fontsIn) continueRender(handle);
  }, [fontsIn, handle]);
  // No dependency list: the copy and the font can change on any render, and
  // this runs before the frame is painted.
  useLayoutEffect(() => {
    const blocks = blockRefs.current.slice(0, 3 + replies.length);
    const next = [
      // Less the rows of its three blocks, whatever state they are laid out
      // in right now.
      blocks
        .slice(0, 3)
        .reduce(
          (h, el) => h - layoutHeight(el?.parentElement?.parentElement),
          layoutHeight(messageRef.current),
        ),
      ...blocks.map(layoutHeight),
    ];
    if (
      next.length !== heights.length ||
      next.some((h, i) => Math.abs(h - heights[i]) > 0.01)
    )
      setHeights(next);
  });
  // Progress of each row, the message first, then its blocks and the replies.
  const openAt = [
    (f: number) => clamp(spAt(f, 16, MORPH, 16)),
    (f: number) => clamp(spAt(f, 30, MORPH, 16)),
    (f: number) => clamp(spAt(f, 78, MORPH, 12)),
    (f: number) => clamp(spAt(f, 104, MORPH, 14)),
    ...replyAt.map((at) => (f: number) => clamp(spAt(f, at, MORPH, 14))),
  ];
  // Px of its height each row still holds back. The message holds back a
  // share of what it contains at that moment, its blocks as far as they are
  // open.
  const hiddenAt = openAt.map((at, i) => (f: number) => {
    const full =
      i === 0
        ? openAt
            .slice(1, 4)
            .reduce(
              (h, inner, k) => h + inner(f) * (heights[k + 1] ?? 0),
              heights[0] ?? 0,
            )
        : (heights[i] ?? 0);
    return (1 - at(f)) * full;
  });
  const opening = hiddenAt.map((at) => stirs(at, 1e-3));
  const hidden = hiddenAt.map((at, i) => (opening[i] ? at(frame) : 0));
  const columnMoving = opening.some(Boolean);
  const lift = hidden.reduce((sum, h) => sum + h, 0);
  const insideHidden = hidden[1] + hidden[2] + hidden[3];
  // A `p`fr track in an auto-height grid makes the row p of its content tall,
  // and the track is then resolved against that height once more: the content
  // shows through a window of p * p of its height, at the top of the row. So
  // the clip takes off more than the row holds back.
  const cut = (i: number) =>
    opening[i]
      ? hidden[i] * (1 + openAt[i](frame)) + (i === 0 ? insideHidden : 0)
      : undefined;
  // One tilt per chain: a block that fades in while the window or the column
  // above it already carries the tilt gets none of its own.
  const carried = winMoving || columnMoving;
  const threadAvatars = [PEOPLE.leo, PEOPLE.priya, PEOPLE.sam, PEOPLE.maya];
  const typing = 1 - ease(12, 18, EXIT);

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <GshGround
          preset={ground ?? (pal.dark ? "hearth" : "paper-crease")}
          params={
            groundParams ??
            (pal.dark || ground
              ? undefined
              : {
                  colors: ["#ff9a5c", "#ffc9a3", "#f6e3d3", "#a8553a"],
                  background: "#f3ece4",
                })
          }
          timeOffset={pal.dark ? 4 : 5}
          timeScale={0.35}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: (width - SW * u) / 2,
            top: (height - SH * u) / 2,
            width: SW,
            height: SH,
            transform: `scale(${u})`,
            transformOrigin: "0 0",
          }}
        >
          {tall ? (
            <div
              style={{
                position: "absolute",
                left: WIN.x,
                top: 150,
                width: WIN.w,
                fontSize: 52,
                fontWeight: 300,
                letterSpacing: "-0.035em",
                lineHeight: 1.04,
                color: ink ?? (pal.dark ? "#F6F2EE" : "#1E1A16"),
                opacity: headIn,
                transform: `translateY(${(1 - headIn) * 18}px)${glide(midway(headIn))}`,
              }}
            >
              {headline}
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: WIN.x,
              top: WIN.y,
              width: WIN.w,
              height: WIN.h,
              borderRadius: 18,
              overflow: "hidden",
              display: "flex",
              background: pal.window,
              boxShadow: pal.depth,
              opacity: winFade,
              transformOrigin: "50% 50%",
              transform: `translateY(${(1 - win) * 60}px) scale(${(0.96 + 0.04 * win) * cam})${glide(winMoving)}`,
            }}
          >
            {SIDE ? (
              <Sidebar pal={pal} workspace={workspace} channel={channel} />
            ) : null}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  height: 60,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  padding: `0 ${PAD}px`,
                  boxShadow: `inset 0 -1px 0 ${pal.rule}`,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: pal.strong,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {ic(I.hash, pal.muted, 17)}
                  {channel}
                </span>
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: pal.muted,
                    fontSize: 15,
                  }}
                >
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={pal.muted}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  >
                    <path d="M9 11 A3.5 3.5 0 1 0 9 4 A3.5 3.5 0 0 0 9 11 Z M3 20 C3 16.5 5.7 14 9 14 C12.3 14 15 16.5 15 20 M16 4.3 A3.5 3.5 0 0 1 16 10.7 M18 14.3 C19.9 15 21 17.2 21 20" />
                  </svg>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>24</span>
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  overflow: "hidden",
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 40px)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 6,
                    display: "flex",
                    flexDirection: "column",
                    transform: columnMoving
                      ? `translateY(${lift}px)${glide(!winMoving)}`
                      : undefined,
                  }}
                >
                  {HISTORY.map((h) => (
                    <Message
                      key={h.time}
                      person={h.person}
                      time={h.time}
                      pal={pal}
                      pad={PAD}
                    >
                      {h.text}
                    </Message>
                  ))}
                  <Grow p={msgIn} cut={cut(0)}>
                    <div
                      ref={messageRef}
                      style={{
                        position: "relative",
                        zIndex: 2,
                        opacity: msgFade,
                        transform: `translateY(${(1 - msgFade) * 16}px)${glide(midway(msgFade) && !carried)}`,
                      }}
                    >
                      <Message
                        person={author}
                        time={time}
                        pal={pal}
                        pad={PAD}
                        cut={insideHidden}
                        bg={
                          hover > 0
                            ? withAlpha(
                                pal.dark ? "#ffffff" : "#1e1c18",
                                (pal.dark ? 0.035 : 0.03) * hover,
                              )
                            : undefined
                        }
                      >
                        {message}{" "}
                        <span style={{ color: pal.link }}>{link.url}</span>
                        <Grow p={unfurl} cut={cut(1)}>
                          <div
                            ref={(el) => {
                              blockRefs.current[0] = el;
                            }}
                            style={{ opacity: unfurlFade, paddingTop: 10 }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: tall ? "column" : "row",
                                gap: tall ? 10 : 16,
                                maxWidth: tall ? 420 : 620,
                                paddingLeft: 14,
                                boxShadow: `inset 3px 0 0 ${pal.rule}`,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, color: pal.muted }}>
                                  {link.site}
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    color: pal.link,
                                    marginTop: 3,
                                    lineHeight: "22px",
                                  }}
                                >
                                  {link.title}
                                </div>
                                {tall ? null : (
                                  <div
                                    style={{
                                      fontSize: 15,
                                      color: pal.text,
                                      marginTop: 3,
                                      lineHeight: "21px",
                                    }}
                                  >
                                    {link.description}
                                  </div>
                                )}
                              </div>
                              <div
                                style={{
                                  width: tall ? 300 : 192,
                                  height: tall ? 158 : 101,
                                  borderRadius: 10,
                                  overflow: "hidden",
                                  flexShrink: 0,
                                  position: "relative",
                                  background: "#05141f",
                                }}
                              >
                                <Img
                                  src={image ?? staticFile("hero.png")}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: 10,
                                    boxShadow: `inset 0 0 0 1px ${pal.outline}`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </Grow>
                        <Grow p={rowIn} cut={cut(2)}>
                          <div
                            ref={(el) => {
                              blockRefs.current[1] = el;
                            }}
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                              paddingTop: 10,
                              alignItems: "center",
                            }}
                          >
                            {reactions.map((r, i) => {
                              const s = sp(popAt[i], CHIP);
                              const self = i === 0;
                              const start = popAt[i] + 4;
                              const v = interpolate(
                                frame,
                                [start, start + 62 + i * 3],
                                [1, r.count],
                                { ...CL, easing: LIGHT },
                              );
                              return (
                                <div
                                  key={r.emoji}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    height: 30,
                                    padding: "0 10px 0 8px",
                                    borderRadius: 15,
                                    boxSizing: "border-box",
                                    background: self
                                      ? withAlpha(accent, pal.dark ? 0.2 : 0.09)
                                      : pal.pill,
                                    boxShadow: self
                                      ? `inset 0 0 0 1px ${withAlpha(accent, 0.7)}`
                                      : undefined,
                                    color: self ? pal.link : pal.text,
                                    fontSize: 15,
                                    transform: `scale(${s})${glide(stirs((f) => spAt(f, popAt[i], CHIP)))}`,
                                    transformOrigin: "30% 60%",
                                  }}
                                >
                                  <span
                                    style={{ fontSize: 16, lineHeight: "18px" }}
                                  >
                                    {r.emoji}
                                  </span>
                                  <Count value={frame < start ? 1 : v} />
                                </div>
                              );
                            })}
                            <div
                              style={{
                                height: 30,
                                width: 38,
                                borderRadius: 15,
                                background: pal.pill,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: ease(
                                  popAt[popAt.length - 1] + 4,
                                  popAt[popAt.length - 1] + 14,
                                ),
                              }}
                            >
                              {ic(I.emoji, pal.muted, 17)}
                            </div>
                          </div>
                        </Grow>
                        <Grow p={threadIn} cut={cut(3)}>
                          <div
                            ref={(el) => {
                              blockRefs.current[2] = el;
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              paddingTop: 10,
                              fontSize: 15,
                            }}
                          >
                            <div style={{ display: "flex", gap: 4 }}>
                              {threadAvatars.map((p, i) => {
                                const s = sp(104 + i * 6, CHIP);
                                return (
                                  <div
                                    key={p.name}
                                    style={{
                                      width: 24 * clamp(s),
                                      transform: `scale(${s})${glide(stirs((f) => spAt(f, 104 + i * 6, CHIP)))}`,
                                    }}
                                  >
                                    <Avatar person={p} size={24} />
                                  </div>
                                );
                              })}
                            </div>
                            <span
                              style={{
                                color: pal.link,
                                display: "inline-flex",
                                gap: 5,
                              }}
                            >
                              <Count
                                value={interpolate(
                                  frame,
                                  [104, 176],
                                  [1, replyCount],
                                  { ...CL, easing: LIGHT },
                                )}
                              />
                              replies
                            </span>
                            {tall ? null : (
                              <span style={{ color: pal.muted }}>
                                {lastReplyLabel}
                              </span>
                            )}
                          </div>
                        </Grow>
                      </Message>
                      <div
                        style={{
                          position: "absolute",
                          left: barX,
                          top: -18,
                          width: barW,
                          height: 38,
                          boxSizing: "border-box",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          padding: "0 5px",
                          borderRadius: 10,
                          background: pal.panel,
                          boxShadow: pal.raised,
                          opacity: frame >= 58 ? clamp(barIn) * barOut : 0,
                          transform: `translateY(${(1 - barIn) * 6}px)${glide(stirs((f) => spAt(f, 58, CARD)))}`,
                          fontSize: 15,
                          color: pal.text,
                        }}
                      >
                        {[reactions[0]?.emoji ?? "🚀", "👀", "🙌"].map(
                          (e, i) => (
                            <div
                              key={e}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                                background:
                                  i === 0
                                    ? withAlpha(
                                        pal.dark ? "#ffffff" : "#1e1c18",
                                        0.07 * ease(68, 74),
                                      )
                                    : undefined,
                              }}
                            >
                              {e}
                            </div>
                          ),
                        )}
                        <div
                          style={{
                            width: 1,
                            height: 20,
                            background: pal.rule,
                            margin: "0 4px",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "0 6px",
                          }}
                        >
                          {ic(I.emoji, pal.muted, 16)}React
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "0 6px",
                          }}
                        >
                          {ic(I.reply, pal.muted, 16)}Reply
                        </div>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          // Laid out on the button it presses and led
                          // around by a transform: layout rounds a box to
                          // whole pixels, so a pointer moved by `left`/`top`
                          // steps instead of gliding.
                          left: target.x,
                          top: target.y,
                          transform: `translate(${cx - target.x}px, ${cy - target.y}px)`,
                          opacity: cursorOpacity,
                          zIndex: 5,
                        }}
                      >
                        <MacCursor press={clamp(press)} />
                      </div>
                    </div>
                  </Grow>
                  {replies.map((r, i) => {
                    const p = sp(replyAt[i], MORPH, 14);
                    const o = ease(replyAt[i], replyAt[i] + 10);
                    return (
                      <Grow key={r.text} p={p} cut={cut(4 + i)}>
                        <div
                          ref={(el) => {
                            blockRefs.current[3 + i] = el;
                          }}
                          style={{
                            opacity: o,
                            transform: `translateY(${(1 - o) * 12}px)${glide(midway(o) && !carried)}`,
                          }}
                        >
                          <Message
                            person={r.author}
                            time="10:31 AM"
                            pal={pal}
                            pad={PAD}
                            context={
                              tall ? undefined : `${message.slice(0, 18)}…`
                            }
                          >
                            {r.text}
                          </Message>
                        </div>
                      </Grow>
                    );
                  })}
                </div>
              </div>
              <div style={{ padding: `0 ${PAD}px 8px`, flexShrink: 0 }}>
                <div
                  style={{
                    borderRadius: 12,
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0 14px",
                    boxSizing: "border-box",
                    boxShadow: `inset 0 0 0 1px ${pal.rule}`,
                  }}
                >
                  {ic(I.plus, pal.muted, 18)}
                  <span style={{ fontSize: 16, color: pal.muted, flex: 1 }}>
                    Message #{channel}
                  </span>
                  {ic(I.send, pal.muted, 18)}
                </div>
                <div
                  style={{
                    height: 22,
                    fontSize: 14,
                    color: pal.muted,
                    paddingTop: 4,
                    opacity: typing,
                  }}
                >
                  <span style={{ color: pal.text }}>{author.name}</span> is
                  typing…
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
