"use client";

import { loadFont } from "@remotion/google-fonts/Inter";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export interface ChaosToOrderProps {
  /** Labels for the chaos pieces (window titles, sticky notes, toasts), in drop order. */
  items?: string[];
  /** Your product window. Falls back to a built-in issues list. */
  children?: React.ReactNode;
  accent?: string;
  speed?: number;
  theme?: "light" | "dark";
}

const DEFAULT_ITEMS = [
  "#launch-war-room",
  "Q4 roadmap v7 FINAL.xlsx",
  "Inbox",
  "Launch plan (draft 3)",
  "Pricing · Kitebase",
  "fix onboarding!!",
  "Payment failed",
  "who owns billing??",
  "Standup in 2 min",
  "14 new comments",
  "ship by Fri???",
  "Build #482 failed",
  "call Maya re: assets",
  "3 unread in #design",
];

type ToastIcon = "alert" | "cal" | "chat" | "x";
type Kind = "chat" | "sheet" | "mail" | "doc" | "browser" | "sticky" | "toast";
type Piece = {
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  d: number;
  tint?: string;
  sub?: string;
  app?: string;
  icon?: ToastIcon;
};
const toast = (
  x: number,
  y: number,
  r: number,
  d: number,
  tint: string,
  app: string,
  sub: string,
  icon: ToastIcon,
): Piece => ({
  kind: "toast",
  x,
  y,
  w: 272,
  h: 62,
  r,
  d,
  tint,
  app,
  sub,
  icon,
});
const sticky = (
  x: number,
  y: number,
  s: number,
  r: number,
  d: number,
  tint: string,
): Piece => ({ kind: "sticky", x, y, w: s, h: s, r, d, tint });

// x/y = centre in a 1280×720 design space, r = resting angle, d = drop frame.
const PIECES: Piece[] = [
  { kind: "chat", x: 318, y: 236, w: 400, h: 254, r: -5, d: -3 },
  { kind: "sheet", x: 930, y: 214, w: 360, h: 232, r: 4, d: 6 },
  { kind: "mail", x: 960, y: 505, w: 350, h: 240, r: -3.5, d: 11 },
  { kind: "doc", x: 560, y: 470, w: 280, h: 300, r: 3, d: 16 },
  { kind: "browser", x: 650, y: 200, w: 390, h: 244, r: -2.5, d: 20 },
  sticky(190, 520, 148, -8, 24, "#FCE38A"),
  toast(
    1060,
    88,
    4,
    27,
    "#E5484D",
    "Kitebase",
    "Card ending 4242 was declined",
    "alert",
  ),
  sticky(1135, 330, 136, 7, 30, "#F9C9DE"),
  toast(
    330,
    645,
    -3,
    32,
    "#3E63DD",
    "Calendar",
    "Product sync · Room 4B",
    "cal",
  ),
  toast(770, 650, 4, 34, "#8E4EC6", "Docs", "on Launch plan (draft 3)", "chat"),
  sticky(430, 104, 128, 9, 36, "#BFE3F7"),
  toast(150, 330, -6, 37.5, "#F76B15", "CI", "main · exited with code 1", "x"),
  sticky(820, 405, 136, -10, 39, "#C4EBCB"),
  toast(610, 340, 5, 40, "#30A46C", "Chat", "Priya, Leo and 1 other", "chat"),
];

const PULL = 56;
const PULL_LEN = 18;
const WIN_IN = PULL + 10;
const WIN_W = 880;
const WIN_H = 530;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const HAIR = "1px solid rgba(0,0,0,0.07)";
const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const flex = (s: React.CSSProperties = {}): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  ...s,
});
const clip: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

function Icon({
  d,
  size = 14,
  color = "currentColor",
  sw = 2,
}: {
  d: string;
  size?: number;
  color?: string;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
}

const I = {
  alert: "M12 8v5M12 16.5v.01",
  cal: "M5 6h14v13H5zM5 10h14M9 3.5v4M15 3.5v4",
  chat: "M5 5h14v10H11l-4 3.5V15H5z",
  x: "M8 8l8 8M16 8l-8 8",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  compose: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  filter: "M4 6h16M7 12h10M10 18h4",
  display: "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6",
  chevron: "M7 10l5 5 5-5",
  inbox: "M3 13l2.5-8h13L21 13v6H3zM3 13h5l1.5 2.5h5L16 13h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5",
  box: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5",
  layers: "M3 8l9-5 9 5-9 5zM3 13l9 5 9-5",
  target:
    "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  cycle: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
  hash: "M9 4L7 20M17 4l-2 16M4 9h16M3.5 15h16",
};

function Lights() {
  return (
    <div style={flex({ gap: 6 })}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div
          key={c}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: c,
            boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)",
          }}
        />
      ))}
    </div>
  );
}

function Win({
  title,
  dark,
  children,
}: {
  title: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: dark ? "#1C1C1F" : "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={flex({
          height: 28,
          flexShrink: 0,
          position: "relative",
          padding: "0 10px",
          background: dark ? "#232327" : "#F6F6F7",
          borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : HAIR,
        })}
      >
        <Lights />
        <span
          style={{
            ...clip,
            position: "absolute",
            left: 70,
            right: 70,
            textAlign: "center",
            fontSize: 11.5,
            fontWeight: 500,
            color: dark ? "#C8C8CD" : "#52525B",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Avatar({
  name,
  color,
  size = 22,
  round = true,
}: {
  name: string;
  color: string;
  size?: number;
  round?: boolean;
}) {
  return (
    <div
      style={flex({
        width: size,
        height: size,
        borderRadius: round ? size / 2 : size * 0.25,
        background: color,
        color: "#fff",
        fontSize: size * 0.4,
        fontWeight: 600,
        justifyContent: "center",
        flexShrink: 0,
        letterSpacing: "0.01em",
      })}
    >
      {name}
    </div>
  );
}

const PEOPLE: Record<string, [string, string]> = {
  MC: ["Maya Chen", "#D6409F"],
  LP: ["Leo Park", "#0090FF"],
  PR: ["Priya Raman", "#12A594"],
};

function Chat({ title, badge }: { title: string; badge: string }) {
  const msgs: [string, string, string][] = [
    ["MC", "11:42", "is the launch video locked?? need it for the deck"],
    ["LP", "11:43", "pricing page still says $19, design says $24"],
    ["PR", "11:43", "who has the latest logo files"],
  ];
  const chans: [string, string?][] = [
    ["general"],
    [title.replace(/^#/, ""), "on"],
    ["design", "3"],
    ["billing", "1"],
    ["random"],
  ];
  return (
    <Win title="Kitebase" dark>
      <div style={{ display: "flex", height: "100%" }}>
        <div
          style={{
            width: 40,
            background: "#141416",
            paddingTop: 10,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", height: 26 }}>
            <div
              style={flex({
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "#EDEDEF",
                color: "#18181B",
                fontSize: 12,
                fontWeight: 700,
                justifyContent: "center",
              })}
            >
              K
            </div>
            <div
              style={flex({
                position: "absolute",
                top: -6,
                right: -9,
                height: 16,
                padding: "0 5px",
                borderRadius: 8,
                background: "#E5484D",
                color: "#fff",
                fontSize: 9.5,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                boxShadow: "0 0 0 2px #141416",
              })}
            >
              {badge}
            </div>
          </div>
        </div>
        <div
          style={{
            width: 112,
            background: "#19191C",
            padding: "8px 6px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={flex({
              gap: 3,
              fontSize: 12,
              fontWeight: 600,
              color: "#F4F4F5",
              padding: "0 6px 8px",
            })}
          >
            Kitebase <Icon d={I.chevron} size={10} color="#8B8B92" />
          </div>
          {chans.map(([c, s]) => (
            <div
              key={c}
              style={flex({
                gap: 5,
                height: 21,
                padding: "0 6px",
                borderRadius: 5,
                fontSize: 10.5,
                fontWeight: s ? 600 : 400,
                background: s === "on" ? "rgba(255,255,255,0.1)" : undefined,
                color: s ? "#F4F4F5" : "#8B8B92",
              })}
            >
              <Icon d={I.hash} size={10} color={s ? "#C8C8CD" : "#6B6B72"} />
              <span style={{ ...clip, flex: 1 }}>{c}</span>
              {s && s !== "on" ? (
                <span
                  style={{
                    fontSize: 9,
                    background: "#E5484D",
                    borderRadius: 6,
                    padding: "0 4px",
                  }}
                >
                  {s}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, background: "#1C1C1F" }}>
          <div
            style={flex({
              height: 30,
              padding: "0 12px",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: "#F4F4F5",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            })}
          >
            <Icon d={I.hash} size={11} color="#C8C8CD" />
            {title.replace(/^#/, "")}
          </div>
          <div style={{ padding: "8px 12px", display: "grid", gap: 8 }}>
            {msgs.map(([who, t, text], i) => (
              <div key={who} style={{ display: "flex", gap: 8 }}>
                <Avatar
                  name={who}
                  color={PEOPLE[who][1]}
                  size={22}
                  round={false}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{ fontSize: 11, fontWeight: 600, color: "#F4F4F5" }}
                  >
                    {PEOPLE[who][0]}{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#7C7C84",
                        fontSize: 9.5,
                      }}
                    >
                      {t}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "#C8C8CD",
                      lineHeight: 1.4,
                    }}
                  >
                    {text}
                  </div>
                  {i === 0 ? (
                    <div style={flex({ gap: 4, marginTop: 4 })}>
                      {["👀 4", "😬 2"].map((r, k) => (
                        <span
                          key={r}
                          style={{
                            fontSize: 9.5,
                            color: "#C8C8CD",
                            padding: "1px 6px",
                            borderRadius: 8,
                            background:
                              k === 0
                                ? "rgba(0,144,255,0.18)"
                                : "rgba(255,255,255,0.06)",
                            boxShadow:
                              k === 0
                                ? "inset 0 0 0 1px rgba(0,144,255,0.5)"
                                : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Win>
  );
}

const STATUS: Record<string, [string, string]> = {
  Late: ["#FCE8E8", "#CE2C31"],
  Blocked: ["#FFF1D6", "#AB6400"],
  "Not started": ["#F0F0F2", "#60646C"],
  "??": ["#fff", "#18181B"],
};

function Sheet({ title }: { title: string }) {
  const widths = [24, 66, 52, 80, 54, 44];
  const rows = [
    ["", "A", "B", "C", "D", "E"],
    ["1", "Q4 goal", "Owner", "Status", "ETA", "Δ days"],
    ["2", "Launch", "Maya", "Late", "Oct 31", "−12"],
    ["3", "Pricing", "Leo", "??", "TBD", "#REF!"],
    ["4", "Docs", "Priya", "Blocked", "Nov 4", "−3"],
    ["5", "Video", "—", "Not started", "Nov 1", "−9"],
    ["6", "Billing", "?", "Late", "Oct 28", "−15"],
  ];
  return (
    <Win title={title}>
      <div
        style={flex({
          gap: 8,
          height: 24,
          borderBottom: HAIR,
          padding: "0 8px",
          fontSize: 10.5,
          color: "#3F3F46",
        })}
      >
        <span style={{ fontWeight: 600, width: 22 }}>C3</span>
        <span style={{ color: "#A1A1AA", fontStyle: "italic" }}>fx</span>
        <span style={{ ...clip, fontFamily: "monospace", fontSize: 10 }}>
          =VLOOKUP(B3, Owners!A:F, 7, FALSE)
        </span>
      </div>
      {rows.map((r, ri) => (
        <div
          key={r[0] || "h"}
          style={{
            display: "flex",
            height: 21,
            fontSize: 10.5,
            borderBottom: ri === 1 ? "1px solid #C9CBCF" : "1px solid #ECEDEF",
          }}
        >
          {r.map((cell, ci) => {
            const head = ri === 0 || ci === 0;
            const err = cell === "#REF!";
            const st = ci === 3 && ri > 1 ? STATUS[cell] : undefined;
            return (
              <div
                key={ci}
                style={flex({
                  ...clip,
                  width: widths[ci],
                  flexShrink: 0,
                  borderRight: "1px solid #ECEDEF",
                  justifyContent: head ? "center" : "flex-start",
                  padding: head ? 0 : "0 5px",
                  background: head ? "#F6F6F7" : err ? "#FCE8E8" : "#fff",
                  color: head
                    ? "#80838D"
                    : err || cell.startsWith("−")
                      ? "#CE2C31"
                      : "#1C2024",
                  fontWeight: ri === 1 || err ? 600 : 400,
                  fontVariantNumeric: "tabular-nums",
                  outline:
                    ri === 3 && ci === 3 ? "2px solid #1A73E8" : undefined,
                  outlineOffset: -2,
                })}
              >
                {st && cell !== "??" ? (
                  <span
                    style={{
                      background: st[0],
                      color: st[1],
                      borderRadius: 4,
                      padding: "1px 5px",
                      fontSize: 9.5,
                      fontWeight: 500,
                    }}
                  >
                    {cell}
                  </span>
                ) : (
                  cell
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div
        style={flex({
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 24,
          gap: 2,
          padding: "0 8px",
          background: "#F6F6F7",
          borderTop: HAIR,
          fontSize: 10,
          color: "#60646C",
        })}
      >
        {["Q4", "Owners", "Sheet3 (old)"].map((t, i) => (
          <span
            key={t}
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              background: i === 0 ? "#fff" : undefined,
              color: i === 0 ? "#1A73E8" : undefined,
              fontWeight: i === 0 ? 600 : 400,
              boxShadow: i === 0 ? "0 0 0 1px rgba(0,0,0,0.06)" : undefined,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </Win>
  );
}

function Mail({ title, accent }: { title: string; accent: string }) {
  const mails = [
    [
      "Kitebase Billing",
      "Action required: card declined",
      "Your payment of $4,280 could not be processed…",
      "9:12",
    ],
    [
      "Maya Chen",
      "Re: Re: Re: launch assets",
      "Sending again, the drive link expired…",
      "9:04",
    ],
    [
      "Orbitly",
      "You have 14 unread mentions",
      "Leo Park and 6 others mentioned you…",
      "8:51",
    ],
    [
      "Halcyon Legal",
      "Contract v3 (final) (2)",
      "Please countersign by end of day…",
      "8:30",
    ],
  ];
  return (
    <Win title={title}>
      <div
        style={flex({
          height: 32,
          padding: "0 12px",
          gap: 6,
          borderBottom: HAIR,
        })}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#18181B" }}>
          {title}
        </span>
        <span
          style={{
            fontSize: 10.5,
            color: "#8B8D98",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          214 unread
        </span>
        <div
          style={flex({
            marginLeft: "auto",
            gap: 2,
            fontSize: 10,
            color: "#60646C",
          })}
        >
          {["Important", "Other"].map((t, i) => (
            <span
              key={t}
              style={{
                padding: "2px 7px",
                borderRadius: 5,
                background: i === 0 ? "#F0F0F2" : undefined,
                color: i === 0 ? "#18181B" : undefined,
                fontWeight: 500,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      {mails.map(([from, subj, prev, time], i) => (
        <div
          key={subj}
          style={{
            display: "flex",
            gap: 8,
            padding: "7px 12px 7px 8px",
            borderBottom: "1px solid #F2F2F4",
            background: i === 0 ? `${accent}12` : "#fff",
            boxShadow: i === 0 ? `inset 2px 0 0 ${accent}` : undefined,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: i < 3 ? accent : "transparent",
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0, flex: 1, lineHeight: 1.35 }}>
            <div
              style={flex({
                justifyContent: "space-between",
                fontSize: 11.5,
                fontWeight: 600,
                color: "#18181B",
              })}
            >
              <span>{from}</span>
              <span
                style={{
                  fontWeight: 400,
                  color: "#8B8D98",
                  fontSize: 10,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {time}
              </span>
            </div>
            <div
              style={{
                ...clip,
                fontSize: 10.5,
                color: "#27272A",
                fontWeight: 500,
              }}
            >
              {subj}
            </div>
            <div style={{ ...clip, fontSize: 10.5, color: "#8B8D98" }}>
              {prev}
            </div>
          </div>
        </div>
      ))}
    </Win>
  );
}

function Doc({ title }: { title: string }) {
  const todo = [
    "Who signs off on the video?",
    "Is the waitlist email ready?",
    "Final price: $19 or $24",
  ];
  return (
    <Win title={title}>
      <div
        style={flex({
          height: 26,
          padding: "0 12px",
          gap: 4,
          fontSize: 9.5,
          color: "#80838D",
        })}
      >
        <span>Kitebase</span>/<span>Launch</span>/
        <span style={{ color: "#3F3F46" }}>Launch plan</span>
        <span style={{ marginLeft: "auto" }}>Edited 3m ago</span>
      </div>
      <div
        style={{
          padding: "8px 20px",
          fontSize: 10.5,
          lineHeight: 1.5,
          color: "#37352F",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#18181B",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          Launch plan
        </div>
        {[
          ["Owner", "Empty"],
          ["Launch", "Nov 1 → Nov 8?"],
        ].map(([k, v]) => (
          <div key={k} style={flex({ gap: 10, fontSize: 10, height: 18 })}>
            <span style={{ width: 44, color: "#80838D" }}>{k}</span>
            <span style={{ color: v === "Empty" ? "#B4B4BB" : "#37352F" }}>
              {v}
            </span>
          </div>
        ))}
        <p style={{ margin: "8px 0 6px", textWrap: "pretty" }}>
          Ship the new editor on{" "}
          <span
            style={{ background: "#FBF3DB", boxShadow: "0 1.5px 0 #F5C842" }}
          >
            Nov 1 (or Nov 8?)
          </span>{" "}
          with a 60s launch video, a blog post and a pricing update.
        </p>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: "#18181B",
            margin: "10px 0 4px",
          }}
        >
          Open questions
        </div>
        {todo.map((t) => (
          <div key={t} style={flex({ gap: 7, height: 19 })}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2.5,
                boxShadow: "inset 0 0 0 1.25px #A1A1AA",
              }}
            />
            {t}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: 10,
          top: 112,
          width: 104,
          padding: "7px 8px",
          borderRadius: 8,
          background: "#fff",
          fontSize: 9.5,
          lineHeight: 1.35,
          color: "#37352F",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.12)",
        }}
      >
        <div style={flex({ gap: 5, marginBottom: 3, fontWeight: 600 })}>
          <Avatar name="MC" color={PEOPLE.MC[1]} size={14} /> Maya
        </div>
        which date is it???
      </div>
    </Win>
  );
}

function Browser({ title }: { title: string }) {
  const tabs = [title, "Roadmap", "Q4 OKRs", "Inbox (214)", "Figma", "Docs"];
  const fav = [
    "#0090FF",
    "#F5A524",
    "#30A46C",
    "#E5484D",
    "#8E4EC6",
    "#60646C",
  ];
  const plans: [string, string, string][] = [
    ["Starter", "$0", "Get started"],
    ["Pro", "$24", "Upgrade"],
    ["Team", "$59", "Contact sales"],
  ];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          height: 32,
          background: "#E3E5E8",
          display: "flex",
          alignItems: "flex-end",
          padding: "0 8px",
          gap: 1,
        }}
      >
        <div style={{ alignSelf: "center", marginRight: 8 }}>
          <Lights />
        </div>
        {tabs.map((t, i) => (
          <div
            key={t}
            style={flex({
              flex: 1,
              minWidth: 0,
              height: 25,
              borderRadius: "7px 7px 0 0",
              background: i === 0 ? "#fff" : "transparent",
              gap: 5,
              padding: "0 7px",
              fontSize: 9.5,
              color: i === 0 ? "#1C2024" : "#60646C",
            })}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 2.5,
                background: fav[i],
                flexShrink: 0,
              }}
            />
            <span style={clip}>{t}</span>
          </div>
        ))}
      </div>
      <div style={flex({ height: 28, padding: "0 10px", borderBottom: HAIR })}>
        <div
          style={flex({
            flex: 1,
            height: 19,
            borderRadius: 10,
            background: "#F0F1F3",
            fontSize: 9.5,
            color: "#60646C",
            padding: "0 10px",
          })}
        >
          kitebase.com/<span style={{ color: "#1C2024" }}>pricing</span>
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111113",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          Simple pricing for growing teams
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {plans.map(([n, p, cta], i) => (
            <div
              key={n}
              style={{
                flex: 1,
                borderRadius: 8,
                padding: 8,
                boxShadow:
                  i === 1
                    ? "0 0 0 1.5px #111113"
                    : "0 0 0 1px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontSize: 9.5, color: "#60646C", fontWeight: 500 }}>
                {n}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#111113",
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {p}
                <span
                  style={{
                    fontSize: 9,
                    color: "#8B8D98",
                    fontWeight: 400,
                    letterSpacing: 0,
                  }}
                >
                  {" "}
                  /mo
                </span>
              </div>
              <div
                style={flex({
                  justifyContent: "center",
                  height: 20,
                  borderRadius: 5,
                  marginTop: 8,
                  fontSize: 9,
                  fontWeight: 500,
                  background: i === 1 ? "#111113" : "#fff",
                  color: i === 1 ? "#fff" : "#1C2024",
                  boxShadow: i === 1 ? undefined : "0 0 0 1px rgba(0,0,0,0.1)",
                })}
              >
                {cta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sticky({ text, tint }: { text: string; tint: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: `linear-gradient(172deg, ${tint} 60%, color-mix(in srgb, ${tint} 88%, #000))`,
        padding: "22px 14px 12px",
        boxSizing: "border-box",
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.2,
        color: "#3B2F12",
        letterSpacing: "-0.01em",
        textWrap: "balance",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -8,
          left: "30%",
          width: "40%",
          height: 18,
          background: "rgba(255,255,255,0.5)",
          transform: "rotate(-3deg)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      />
      {text}
    </div>
  );
}

// macOS-style notification banner
function Toast({ text, p }: { text: string; p: Piece }) {
  return (
    <div
      style={flex({
        width: "100%",
        height: "100%",
        borderRadius: 16,
        background: "rgba(246,246,247,0.97)",
        gap: 10,
        padding: "0 12px",
        boxSizing: "border-box",
      })}
    >
      <div
        style={flex({
          width: 32,
          height: 32,
          borderRadius: 8,
          background: p.tint,
          flexShrink: 0,
          justifyContent: "center",
          boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.12)",
        })}
      >
        <Icon d={I[p.icon ?? "alert"]} size={17} color="#fff" sw={2.25} />
      </div>
      <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
        <div style={flex({ justifyContent: "space-between", gap: 6 })}>
          <span
            style={{
              ...clip,
              fontSize: 12.5,
              fontWeight: 600,
              color: "#18181B",
            }}
          >
            {text}
          </span>
          <span style={{ fontSize: 10.5, color: "#8B8D98", flexShrink: 0 }}>
            now
          </span>
        </div>
        <div style={{ ...clip, fontSize: 11.5, color: "#52525B" }}>{p.sub}</div>
      </div>
    </div>
  );
}

type Row = [string, string, string, string, string, string, number];
const ISSUES: { group: string; count?: number; rows: Row[] }[] = [
  {
    group: "In Progress",
    rows: [
      [
        "REM-214",
        "Spring presets for page transitions",
        "Feature",
        "#8E4EC6",
        "MC",
        "Oct 24",
        3,
      ],
      [
        "REM-209",
        "Grouped stack for notification avalanche",
        "Motion",
        "",
        "LP",
        "Oct 23",
        2,
      ],
      [
        "REM-198",
        "Fix flicker on 1920×1080 renders",
        "Bug",
        "#E5484D",
        "PR",
        "Oct 22",
        4,
      ],
    ],
  },
  {
    group: "Todo",
    rows: [
      [
        "REM-221",
        "Launch video: hook beat",
        "Launch",
        "#F76B15",
        "MC",
        "Oct 28",
        3,
      ],
      [
        "REM-217",
        "Document phone-scroll props",
        "Docs",
        "#12A594",
        "LP",
        "Oct 29",
        0,
      ],
      [
        "REM-203",
        "Audit easing curves across templates",
        "Motion",
        "",
        "PR",
        "Nov 1",
        2,
      ],
      [
        "REM-190",
        "Add JetBrains Mono to code blocks",
        "Feature",
        "#8E4EC6",
        "MC",
        "Nov 3",
        1,
      ],
    ],
  },
  {
    group: "Backlog",
    count: 12,
    rows: [
      [
        "REM-188",
        "Explore WebGL gradient backgrounds",
        "Research",
        "#8B8D98",
        "LP",
        "Nov 12",
        0,
      ],
      [
        "REM-176",
        "Right-to-left support for captions",
        "Feature",
        "#8E4EC6",
        "PR",
        "Nov 14",
        1,
      ],
    ],
  },
];

function StatusIcon({ group, c }: { group: string; c: string }) {
  if (group === "In Progress")
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        <circle
          cx="7"
          cy="7"
          r="5.5"
          fill="none"
          stroke="#F0B100"
          strokeWidth="1.5"
        />
        <path d="M7 4a3 3 0 0 1 0 6z" fill="#F0B100" />
      </svg>
    );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      <circle
        cx="7"
        cy="7"
        r="5.5"
        fill="none"
        stroke={c}
        strokeWidth="1.5"
        strokeDasharray={group === "Backlog" ? "1.4 1.6" : undefined}
      />
    </svg>
  );
}

function Priority({
  level,
  on,
  off,
}: {
  level: number;
  on: string;
  off: string;
}) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
      {level === 4 ? (
        <>
          <rect x="1" y="1" width="12" height="12" rx="3" fill="#F76B15" />
          <path
            d="M7 4v3.6M7 9.6v.2"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      ) : level === 0 ? (
        [3, 7, 11].map((x) => <circle key={x} cx={x} cy="7" r="1" fill={off} />)
      ) : (
        [0, 1, 2].map((b) => (
          <rect
            key={b}
            x={1.5 + b * 4}
            y={9 - b * 3}
            width={3}
            height={3.5 + b * 3}
            rx={0.8}
            fill={b < level ? on : off}
          />
        ))
      )}
    </svg>
  );
}

function palette(dark: boolean) {
  return dark
    ? {
        bg: "#141416",
        side: "#0E0E10",
        text: "#EDEDEF",
        muted: "#8B8D98",
        faint: "#3A3A40",
        hair: "rgba(255,255,255,0.06)",
        group: "#1B1B1F",
        active: "rgba(255,255,255,0.07)",
        chip: "rgba(255,255,255,0.08)",
      }
    : {
        bg: "#FFFFFF",
        side: "#F8F8F9",
        text: "#1C2024",
        muted: "#80838D",
        faint: "#D0D1D6",
        hair: "rgba(0,0,0,0.07)",
        group: "#F7F7F8",
        active: "rgba(0,0,0,0.05)",
        chip: "rgba(0,0,0,0.05)",
      };
}

function IssuesWindow({
  accent,
  f,
  fps,
  dark,
}: {
  accent: string;
  f: number;
  fps: number;
  dark: boolean;
}) {
  const p = palette(dark);
  let n = 0;
  const rowIn = (): React.CSSProperties => {
    const s = spring({
      frame: f - WIN_IN - 3 - n++ * 1.3,
      fps,
      config: { damping: 30, stiffness: 260 },
    });
    return { opacity: s, transform: `translateY(${(1 - s) * 6}px)` };
  };
  const nav = (
    label: string,
    icon: string,
    active = false,
    indent = 0,
    badge?: string,
  ) => (
    <div
      key={label + indent}
      style={flex({
        gap: 8,
        height: 27,
        padding: `0 8px 0 ${8 + indent}px`,
        borderRadius: 6,
        background: active ? p.active : undefined,
        fontSize: 12.5,
        fontWeight: 500,
        color: active ? p.text : dark ? "#C8C8CD" : "#3F3F46",
      })}
    >
      <Icon d={icon} size={14} color={active ? p.text : p.muted} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge ? (
        <span style={{ fontSize: 11, color: p.muted }}>{badge}</span>
      ) : null}
    </div>
  );
  const section = (t: string) => (
    <div
      style={flex({
        gap: 3,
        fontSize: 11.5,
        color: p.muted,
        fontWeight: 500,
        padding: "14px 8px 4px",
      })}
    >
      {t} <Icon d={I.chevron} size={10} color={p.muted} />
    </div>
  );
  return (
    <div
      style={{
        width: WIN_W,
        height: WIN_H,
        display: "flex",
        fontSize: 13,
        color: p.text,
        background: p.bg,
      }}
    >
      <div
        style={{
          width: 204,
          background: p.side,
          borderRight: `1px solid ${p.hair}`,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <div style={{ padding: "0 6px 14px" }}>
          <Lights />
        </div>
        <div style={flex({ gap: 8, padding: "0 6px 10px" })}>
          <div
            style={flex({
              width: 20,
              height: 20,
              borderRadius: 5,
              background: accent,
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              justifyContent: "center",
            })}
          >
            r
          </div>
          <span style={{ fontWeight: 600, fontSize: 13 }}>remocn</span>
          <Icon d={I.chevron} size={10} color={p.muted} />
          <div style={flex({ marginLeft: "auto", gap: 10 })}>
            <Icon d={I.search} size={14} color={p.muted} />
            <Icon d={I.compose} size={14} color={p.muted} />
          </div>
        </div>
        {nav("Inbox", I.inbox, false, 0, "3")}
        {nav("My issues", I.user)}
        {section("Workspace")}
        {nav("Projects", I.box)}
        {nav("Views", I.layers)}
        {section("Your teams")}
        <div
          style={flex({
            gap: 8,
            height: 27,
            padding: "0 8px",
            fontSize: 12.5,
            fontWeight: 500,
          })}
        >
          <div
            style={flex({
              width: 14,
              height: 14,
              borderRadius: 4,
              background: "#12A594",
              color: "#fff",
              fontSize: 8,
              fontWeight: 700,
              justifyContent: "center",
            })}
          >
            E
          </div>
          Engine
        </div>
        {nav("Issues", I.target, true, 14)}
        {nav("Cycles", I.cycle, false, 14)}
        {nav("Projects", I.box, false, 14)}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={flex({
            height: 44,
            padding: "0 14px",
            gap: 4,
            borderBottom: `1px solid ${p.hair}`,
          })}
        >
          {["All issues", "Active", "Backlog"].map((t, i) => (
            <div
              key={t}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                background: i === 1 ? p.chip : undefined,
                boxShadow: i === 1 ? `inset 0 0 0 1px ${p.hair}` : undefined,
                color: i === 1 ? p.text : p.muted,
              }}
            >
              {t}
            </div>
          ))}
          <div style={flex({ marginLeft: "auto", gap: 6 })}>
            {[I.filter, I.display].map((d) => (
              <div
                key={d}
                style={flex({
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  justifyContent: "center",
                  boxShadow: `inset 0 0 0 1px ${p.hair}`,
                })}
              >
                <Icon d={d} size={14} color={p.muted} />
              </div>
            ))}
          </div>
        </div>
        {ISSUES.map((g) => (
          <div key={g.group}>
            <div
              style={flex({
                ...rowIn(),
                height: 36,
                background: p.group,
                gap: 8,
                padding: "0 18px",
                borderBottom: `1px solid ${p.hair}`,
              })}
            >
              <StatusIcon group={g.group} c={p.muted} />
              <span style={{ fontWeight: 500, fontSize: 12.5 }}>{g.group}</span>
              <span
                style={{
                  color: p.muted,
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {g.count ?? g.rows.length}
              </span>
            </div>
            {g.rows.map(([id, title, label, lc, who, date, pri]) => (
              <div
                key={id}
                style={flex({
                  ...rowIn(),
                  height: 40,
                  gap: 10,
                  padding: "0 18px",
                  borderBottom: `1px solid ${p.hair}`,
                })}
              >
                <Priority level={pri} on={p.muted} off={p.faint} />
                <span
                  style={{
                    color: p.muted,
                    fontSize: 12,
                    width: 58,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {id}
                </span>
                <StatusIcon group={g.group} c={p.muted} />
                <span style={{ ...clip, fontWeight: 500, flex: 1 }}>
                  {title}
                </span>
                <span
                  style={flex({
                    gap: 5,
                    borderRadius: 999,
                    padding: "2px 9px",
                    fontSize: 11.5,
                    color: dark ? "#C8C8CD" : "#52525B",
                    boxShadow: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  })}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      background: lc || accent,
                    }}
                  />
                  {label}
                </span>
                <Avatar name={who} color={PEOPLE[who][1]} size={20} />
                <span
                  style={{
                    color: p.muted,
                    fontSize: 12,
                    width: 44,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {date}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChaosToOrder({
  items = DEFAULT_ITEMS,
  children,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ChaosToOrderProps) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = frame * speed;
  const dark = theme === "dark";
  const u = Math.min(width / 1280, height / 720);
  const label = (i: number) => items[i] ?? DEFAULT_ITEMS[i];

  // the unread counter on the chat rail climbs faster and faster
  const unread = Math.round(
    2 + 110 * interpolate(f, [6, PULL - 4], [0, 1], clamp) ** 2.2,
  );
  const badge = unread > 99 ? "99+" : String(unread);

  // slow push-in while the pile builds, then the camera settles on the window
  const cam = interpolate(f, [0, PULL, PULL + PULL_LEN + 10], [1, 1.04, 1], {
    ...clamp,
    easing: IN_OUT,
  });
  const win = spring({
    frame: f - WIN_IN,
    fps,
    config: { damping: 200, stiffness: 170 },
  });

  const pieces = PIECES.map((p, i) => {
    const drop = spring({
      frame: f - p.d,
      fps,
      config: { damping: 14, stiffness: 200, mass: 0.8 },
    });
    const order = Math.hypot(p.x - 640, p.y - 360) / 700; // far pieces leave first
    const start = PULL + (1 - order) * 5;
    const pull = interpolate(f, [start, start + PULL_LEN], [0, 1], {
      ...clamp,
      easing: IN_OUT,
    });
    const x = interpolate(pull, [0, 1], [p.x, 640]);
    const y = interpolate(pull, [0, 1], [p.y, 360]);
    const rot = interpolate(
      pull,
      [0, 1],
      [p.r + (1 - drop) * (p.r > 0 ? 8 : -8), 0],
    );
    const scale =
      interpolate(drop, [0, 1], [1.25, 1]) *
      interpolate(pull, [0, 1], [1, 0.5]);
    const opacity =
      interpolate(drop, [0, 0.3], [0, 1], clamp) *
      interpolate(pull, [0.3, 0.7], [1, 0], clamp);
    const lift = 1 - drop; // shadow is soft and far while falling, tight once landed
    const a = dark ? 0.5 : 0.16;
    let body: React.ReactNode;
    if (p.kind === "chat") body = <Chat title={label(i)} badge={badge} />;
    else if (p.kind === "sheet") body = <Sheet title={label(i)} />;
    else if (p.kind === "mail")
      body = <Mail title={label(i)} accent={accent} />;
    else if (p.kind === "doc") body = <Doc title={label(i)} />;
    else if (p.kind === "browser") body = <Browser title={label(i)} />;
    else if (p.kind === "sticky")
      body = <Sticky text={label(i)} tint={p.tint ?? "#FCE38A"} />;
    else body = <Toast text={label(i)} p={p} />;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - p.w / 2,
          top: y - p.h / 2,
          width: p.w,
          height: p.h,
          opacity,
          filter:
            pull > 0.25
              ? `blur(${interpolate(pull, [0.25, 0.7], [0, 4], clamp)}px)`
              : undefined,
          transform: `rotate(${rot}deg) scale(${scale})`,
          boxShadow: `0 0 0 1px rgba(0,0,0,${dark ? 0.4 : 0.06}), 0 ${2 + lift * 30}px ${6 + lift * 40}px -2px rgba(0,0,0,${a * 0.6}), 0 ${16 + lift * 30}px ${40 + lift * 40}px -12px rgba(0,0,0,${a})`,
          borderRadius: p.kind === "sticky" ? 2 : p.kind === "toast" ? 16 : 10,
        }}
      >
        {body}
      </div>
    );
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        background: dark ? "#09090B" : "#F1F1F3",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"} 1px, transparent 1px)`,
          backgroundSize: `${22 * u}px ${22 * u}px`,
          maskImage:
            "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (width - 1280 * u) / 2,
          top: (height - 720 * u) / 2,
          width: 1280,
          height: 720,
          transform: `scale(${u * cam})`,
          transformOrigin: "640px 360px",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 640 - WIN_W / 2,
            top: 360 - WIN_H / 2,
            width: WIN_W,
            height: WIN_H,
            borderRadius: 14,
            overflow: "hidden",
            background: dark ? "#141416" : "#fff",
            opacity: interpolate(win, [0, 0.35], [0, 1], clamp),
            transform: `translateY(${(1 - win) * 14}px) scale(${interpolate(win, [0, 1], [0.94, 1])})`,
            boxShadow: dark
              ? "0 0 0 1px rgba(255,255,255,0.09), 0 24px 64px -12px rgba(0,0,0,0.7)"
              : "0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04), 0 24px 64px -16px rgba(16,16,24,0.22)",
          }}
        >
          {children ?? (
            <IssuesWindow accent={accent} f={f} fps={fps} dark={dark} />
          )}
        </div>
        {f < PULL + PULL_LEN + 6 ? pieces : null}
      </div>
    </AbsoluteFill>
  );
}
