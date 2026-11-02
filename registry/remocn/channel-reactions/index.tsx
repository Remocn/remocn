"use client";

import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
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
  theme?: "light" | "dark";
  accent?: string;
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

function Grow({ p, children }: { p: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: `${clamp(p, 0, 1)}fr` }}>
      <div
        style={{ minHeight: 0, overflow: p >= 0.999 ? "visible" : "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}

function Message({
  person,
  time,
  pal,
  children,
  context,
  bg,
  pad,
}: {
  person: ChannelAuthor;
  time: string;
  pal: Pal;
  children: React.ReactNode;
  context?: string;
  bg?: string;
  pad: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: `10px ${pad}px`,
        background: bg,
        position: "relative",
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
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: ChannelReactionsProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const SW = tall ? 720 : 1280;
  const SH = tall ? 1280 : 720;
  const u = Math.min(width / SW, height / SH);
  const pal = palette(theme, accent);
  const sp = (at: number, config: Partial<typeof CARD>, dur?: number) =>
    spring({ frame: frame - at, fps, config, durationInFrames: dur });
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
  const cam = interpolate(frame, [0, 220], [1, 1.03], {
    ...CL,
    easing: CAMERA,
  });
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

  const popAt = reactions.map((_, i) => (i === 0 ? 80 : 86 + i * 6));
  const rowIn = sp(78, MORPH, 12);
  const threadIn = sp(104, MORPH, 14);
  const replyAt = replies.map((_, i) => 120 + i * 24);
  const threadAvatars = [PEOPLE.leo, PEOPLE.priya, PEOPLE.sam, PEOPLE.maya];
  const typing = 1 - ease(12, 18, EXIT);

  return (
    <AbsoluteFill
      style={{
        fontFamily: onest.fontFamily,
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
      }}
    >
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
              color: pal.dark ? "#F6F2EE" : "#1E1A16",
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 18}px)`,
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
            transform: `translateY(${(1 - win) * 60}px) scale(${(0.96 + 0.04 * win) * cam})`,
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
                <Grow p={msgIn}>
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      opacity: msgFade,
                      transform: `translateY(${(1 - msgFade) * 16}px)`,
                    }}
                  >
                    <Message
                      person={author}
                      time="10:30 AM"
                      pal={pal}
                      pad={PAD}
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
                      <Grow p={unfurl}>
                        <div style={{ opacity: unfurlFade, paddingTop: 10 }}>
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
                      <Grow p={rowIn}>
                        <div
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
                                  transform: `scale(${s})`,
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
                      <Grow p={threadIn}>
                        <div
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
                                    transform: `scale(${s})`,
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
                              Last reply just now
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
                        transform: `translateY(${(1 - barIn) * 6}px)`,
                        fontSize: 15,
                        color: pal.text,
                      }}
                    >
                      {[reactions[0]?.emoji ?? "🚀", "👀", "🙌"].map((e, i) => (
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
                      ))}
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
                        left: cx,
                        top: cy,
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
                    <Grow key={r.text} p={p}>
                      <div
                        style={{
                          opacity: o,
                          transform: `translateY(${(1 - o) * 12}px)`,
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
    </AbsoluteFill>
  );
}
