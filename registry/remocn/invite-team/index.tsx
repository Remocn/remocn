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
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import {
  type ResolvedElement,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  DEFAULT_EMAILS,
  type InviteTeamElementId,
  inviteTeamTimeline,
} from "./timeline";

const hanken = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface InviteTeamProps {
  /** Emails typed into the invite field (up to 3 fit the layout best). */
  emails?: string[];
  /** Role the select switches to. */
  role?: string;
  workspace?: string;
  /** Project thumbnails in the app behind the modal. */
  images?: string[];
  theme?: "light" | "dark";
  accent?: string;
  /** Text color of the app and modal copy; overrides the theme. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Page heading in the app behind the modal. */
  pageTitle?: string;
  /** Label above the email field. */
  fieldLabel?: string;
  /** Button label once the invites are sent. */
  doneLabel?: string;
  /** Size of the app window, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  /**
   * Moves, trims or stretches the window and modal, the cursor's clicks,
   * single emails, the chips flying out and the toast, by the ids in
   * `./timeline`. Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<InviteTeamElementId>;
}

const SPR = {
  heavy: { mass: 1, damping: 26, stiffness: 120 },
  card: { mass: 0.8, damping: 18, stiffness: 160 },
  chip: { mass: 0.5, damping: 12, stiffness: 200 },
  morph: { damping: 200 },
};
const EASE = {
  enter: Easing.bezier(0.32, 0.72, 0, 1),
  soft: Easing.bezier(0.22, 1, 0.36, 1),
  move: Easing.bezier(0.65, 0, 0.35, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  camera: Easing.bezier(0.87, 0, 0.13, 1),
};
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const tween = (
  f: number,
  from: number,
  len: number,
  easing: (t: number) => number,
) => interpolate(f, [from, from + len], [0, 1], { ...CL, easing });

/** Whether `px(f)`, a value in pixels, moves at frame `f`. */
const stirs = (px: (f: number) => number, f: number, eps = 1e-3) =>
  Math.abs(px(f + 1) - px(f)) > eps || Math.abs(px(f) - px(f - 1)) > eps;

const AV_TONES = ["#D9C6B0", "#B5C8D6", "#C6D3B4", "#DDBBB8", "#C3BEDD"];
const EXISTING = [
  { initials: "AB", tone: "#C9D3DC" },
  { initials: "OH", tone: "#DCCFC0" },
];
const ROLE_INFO: Record<string, string> = {
  Admin: "Members, billing and brand kit",
  Editor: "Create, edit and render videos",
  Member: "View projects and leave comments",
  Viewer: "Read-only access to shared projects",
};
const PROJECTS = [
  ["Launch teaser", "0:45", "Edited 2h ago"],
  ["Onboarding walkthrough", "1:20", "Edited yesterday"],
  ["October changelog", "0:30", "Edited Oct 28"],
  ["Pricing explainer", "0:52", "Edited Oct 24"],
  ["Customer story", "2:05", "Edited Oct 21"],
  ["Holiday promo", "0:15", "Edited Oct 17"],
] as const;
const DEFAULT_IMAGES = [1, 2, 3, 4, 5, 6].map((i) =>
  staticFile(`reel/reel-${i}.jpg`),
);

const GLYPH: Record<string, number> = {
  i: 0.23,
  l: 0.23,
  j: 0.24,
  ".": 0.25,
  f: 0.32,
  t: 0.34,
  r: 0.36,
  "@": 0.9,
  m: 0.84,
  w: 0.74,
  k: 0.5,
};
const textW = (s: string, size: number) =>
  [...s].reduce((a, ch) => a + (GLYPH[ch] ?? 0.54), 0) * size;

const CHIP_H = 34;
const chipW = (e: string) => 4 + 24 + 8 + textW(e, 16) + 10 + 14 + 10;
function layoutChips(emails: string[], fieldW: number) {
  let x = 8;
  let y = 8;
  return emails.map((e) => {
    const w = chipW(e);
    if (x + w > fieldW - 8 && x > 8) {
      x = 8;
      y += CHIP_H + 8;
    }
    const slot = { x, y, w };
    x += w + 8;
    return slot;
  });
}

function withAlpha(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

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

function palette(dark: boolean) {
  return {
    dark,
    win: dark ? "#0F1012" : "#FCFCFB",
    modal: dark ? "#17181B" : "#FFFFFF",
    field: dark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
    line: dark ? "rgba(255,255,255,0.07)" : "rgba(24,24,27,0.08)",
    strong: dark ? "rgba(255,255,255,0.14)" : "rgba(24,24,27,0.14)",
    text: dark ? "#EDEDEF" : "#18181B",
    muted: dark ? "#8E9097" : "#71717A",
    faint: dark ? "#55575E" : "#A1A1AA",
    chip: dark ? "rgba(255,255,255,0.07)" : "rgba(24,24,27,0.05)",
    hover: dark ? "rgba(255,255,255,0.06)" : "rgba(24,24,27,0.045)",
    overlay: dark ? "rgba(0,0,0,0.45)" : "rgba(24,24,27,0.16)",
    ink: dark ? "#EDEDEF" : "#18181B",
    inkText: dark ? "#141518" : "#FFFFFF",
    winShadow: dark
      ? "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05), 0 40px 90px -30px rgba(0,0,0,0.7)"
      : "0 0 0 1px rgba(24,24,27,0.06), 0 2px 6px rgba(24,24,27,0.04), 0 40px 90px -30px rgba(24,24,40,0.35)",
    modalShadow: dark
      ? "0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 70px -16px rgba(0,0,0,0.7)"
      : "0 0 0 1px rgba(24,24,27,0.06), 0 2px 4px rgba(24,24,27,0.04), 0 30px 70px -16px rgba(24,24,40,0.32)",
    pop: dark
      ? "0 0 0 1px rgba(255,255,255,0.1), 0 16px 36px -8px rgba(0,0,0,0.6)"
      : "0 0 0 1px rgba(24,24,27,0.07), 0 2px 4px rgba(24,24,27,0.04), 0 16px 36px -8px rgba(24,24,40,0.22)",
    ghost: dark
      ? "0 0 0 1px rgba(255,255,255,0.1)"
      : "0 0 0 1px rgba(24,24,27,0.1), 0 1px 2px rgba(24,24,27,0.05)",
  };
}

const ICON: Record<string, string> = {
  link: "M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1",
  x: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  chev: "M7 10l5 5 5-5",
  check: "M5.5 12.5l4 4 9-9.5",
  plus: "M12 5.5v13M5.5 12h13",
  users:
    "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.3a3.5 3.5 0 010 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2",
};
function Icon({
  name,
  size = 18,
  color,
}: {
  name: string;
  size?: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d={ICON[name]} />
    </svg>
  );
}

function Avatar({
  label,
  tone,
  size,
  ring,
}: {
  label: string;
  tone: string;
  size: number;
  ring?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: tone,
        color: "#1F1F22",
        fontSize: Math.round(size * 0.4),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: ring
          ? `0 0 0 2px ${ring}, inset 0 0 0 1px rgba(0,0,0,0.08)`
          : "inset 0 0 0 1px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

export function InviteTeam(props: InviteTeamProps) {
  const {
    emails = DEFAULT_EMAILS,
    role = "Editor",
    workspace = "Kitebase",
    images = DEFAULT_IMAGES,
    theme = "light",
    accent = "#3B5BFD",
    ink,
    background,
    fontFamily = hanken.fontFamily,
    pageTitle = "Projects",
    fieldLabel = "Email addresses",
    doneLabel = "Invites sent",
    scale = 1,
    delay = 0,
    speed = 1,
    ground,
    groundParams,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    inviteTeamTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const tall = height > width;
  const SW = tall ? 600 : 1280;
  const SH = tall ? (600 * height) / width : 720;
  const k = width / SW;
  const dark = theme === "dark";
  const pal = palette(dark);
  const fg = ink ?? pal.text;
  const spAt = (f: number, at: number, config: Record<string, number>) =>
    spring({ frame: f - at, fps, config });
  const sp = (at: number, config: Record<string, number>) =>
    spAt(frame, at, config);

  const WIN = tall
    ? { x: 20, y: 72, w: SW - 40, h: SH }
    : { x: 96, y: 44, w: SW - 192, h: 632 };
  const MW = tall ? SW - 60 : 520;
  const MX = (SW - MW) / 2;
  const MODAL_H = 368;
  const MY = tall ? 360 : (SH - MODAL_H) / 2 + 8;
  const INPUT = { x: 24, y: 104, w: MW - 48, h: 2 * CHIP_H + 24 };
  const SELECT = { x: MW - 24 - 172, y: 220, w: 172, h: 44 };
  const BUTTON = { x: MW - 24 - 214, y: 300, w: 214, h: 44 };
  const OPT_H = 40;
  const AV = 34;
  const STEP = 24;
  const btnInvite = { w: 104 };
  const btnNew = { w: tall ? 0 : 136 };
  const headerRight = WIN.x + WIN.w - 32;
  const inviteX = headerRight - btnNew.w - (tall ? 0 : 10) - btnInvite.w;
  const PILE_RIGHT = inviteX - 18;
  const PILE_Y = WIN.y + 34;

  const list = emails.slice(0, 3);
  const n = list.length;
  const chips = layoutChips(list, INPUT.w);
  const roles = ["Admin", "Member", "Viewer"].includes(role)
    ? ["Admin", "Editor", "Member", "Viewer"]
    : ["Admin", role, "Member", "Viewer"];
  const roleIdx = Math.max(0, roles.indexOf(role));

  const windowEl = tl.get("app");
  const modalEl = tl.get("modal");
  const cameraEl = tl.get("camera");
  const cursorEl = tl.get("cursor");
  const focusEl = tl.get("focus");
  const selectEl = tl.get("select");
  const roleEl = tl.get("role");
  const sendEl = tl.get("send");
  const outEl = tl.get("out");
  const toastEl = tl.get("toast");
  const emailEls = list.map((_, i) => tl.get(`email:${i}`));
  const typeStart = emailEls.map((e) => e.start);
  const chipAt = emailEls.map((e) => e.end);
  const typeAt = emailEls[0]?.start ?? focusEl.end;
  const typedEnd = chipAt[n - 1] ?? focusEl.start + focusEl.beat("empty");
  const selClick = selectEl.start;
  const optClick = roleEl.start;
  const btnClick = sendEl.start;
  const doneAt = tl.get("done").start;
  const outAt = outEl.start;
  const flyAt = list.map((_, j) => tl.get(`fly:${j}`).start);
  const landAt = list.map((_, j) => tl.get(`fly:${j}`).end);
  const toastAt = toastEl.start;

  const winIn = sp(windowEl.start, SPR.heavy);
  const winOp = tween(frame, windowEl.start, windowEl.length, EASE.enter);
  const modalIn = sp(modalEl.start, SPR.card);
  const modalOp = tween(frame, modalEl.start, modalEl.beat("fade"), EASE.enter);
  const modalOut = tween(frame, outAt, outEl.length, EASE.exit);
  const dim =
    tween(frame, modalEl.start, modalEl.length, EASE.soft) *
    (1 - tween(frame, outAt, outEl.beat("dim"), EASE.soft));
  const focus =
    tween(frame, focusEl.start, focusEl.beat("ring"), EASE.enter) *
    (1 -
      tween(
        frame,
        selClick + selectEl.beat("ringOutAt"),
        selectEl.beat("ringOut"),
        EASE.enter,
      ));
  const closeAt = optClick + roleEl.beat("closeAt");
  const dropInAt = (f: number) =>
    clamp01(spAt(f, selClick + selectEl.beat("openAt"), SPR.card)) *
    (1 - tween(f, closeAt, roleEl.beat("close"), EASE.exit));
  const dropIn = dropInAt(frame);
  const roleNow = frame >= closeAt ? role : "Member";
  const loading =
    frame >= btnClick + sendEl.beat("loadingAt") && frame < doneAt;
  const done = frame >= doneAt;
  const shownChips = chipAt.filter((c) => frame >= c).length;
  /** How far a click's element has the button pressed, at frame `f`. */
  const pressAt = (f: number, e: ResolvedElement<InviteTeamElementId>) =>
    clamp01(
      spAt(f, e.start + e.beat("pressIn"), SPR.chip) -
        spAt(f, e.start + e.beat("pressOut"), SPR.chip),
    );
  const pressOf = (e: ResolvedElement<InviteTeamElementId>) =>
    pressAt(frame, e);
  const toast = sp(toastAt, SPR.card);
  const toastOp = tween(frame, toastAt, toastEl.length, EASE.enter);
  const camAt = (f: number) =>
    1 +
    0.03 * tween(f, cameraEl.start, cameraEl.length, EASE.camera) -
    0.03 *
      tween(f, outAt + outEl.beat("camAt"), outEl.beat("cam"), EASE.camera);
  const cam = camAt(frame);
  // The camera carries every piece below, so its tilt covers their text; an
  // inner mover tilts only while the camera holds still.
  const camMoving = stirs((f) => camAt(f) * 1000, frame);
  const inner = (px: (f: number) => number, eps?: number) =>
    !camMoving && stirs(px, frame, eps);
  const winMoving = inner((f) => spAt(f, windowEl.start, SPR.heavy) * 40);
  const modalTy = (f: number) =>
    spAt(f, modalEl.start, SPR.card) * 18 +
    tween(f, outAt, outEl.length, EASE.exit) * 10;
  const modalK = (f: number) =>
    (0.97 + 0.03 * spAt(f, modalEl.start, SPR.card)) *
    (1 - 0.03 * tween(f, outAt, outEl.length, EASE.exit));
  const modalMoving = inner(modalTy) || inner((f) => (modalK(f) * MW) / 2);
  // Pieces inside the modal leave the tilt to it while it moves.
  const inModal = (px: (f: number) => number) => !modalMoving && inner(px);

  const field = { x: MX + INPUT.x + INPUT.w * 0.62, y: MY + INPUT.y + 50 };
  const sel = { x: MX + SELECT.x + 120, y: MY + SELECT.y + 26 };
  const opt = {
    x: MX + SELECT.x + 80,
    y: MY + SELECT.y + SELECT.h + 6 + OPT_H * roleIdx + 24,
  };
  const btn = { x: MX + BUTTON.x + 130, y: MY + BUTTON.y + 28 };
  const start = tall ? { x: 660, y: 1120 } : { x: 1360, y: 800 };
  const legs = [
    { at: cursorEl.start, from: start, to: field, arc: 1 },
    { at: selClick + selectEl.beat("legAt"), from: field, to: sel, arc: -1 },
    { at: optClick + roleEl.beat("legAt"), from: sel, to: opt, arc: 1 },
    { at: btnClick + sendEl.beat("legAt"), from: opt, to: btn, arc: -1 },
    {
      at: outAt + outEl.beat("exitAt"),
      from: btn,
      to: { x: btn.x + 90, y: btn.y + 120 },
      arc: 1,
    },
  ];
  let curX = start.x;
  let curY = start.y;
  for (const leg of legs) {
    const p = sp(leg.at, SPR.heavy);
    const dx = leg.to.x - leg.from.x;
    const dy = leg.to.y - leg.from.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.sin(clamp01(p) * Math.PI) * Math.min(56, len * 0.14);
    curX += dx * p + (-dy / len) * bend * leg.arc;
    curY += dy * p + (dx / len) * bend * leg.arc;
  }
  // Layout rounds a box to whole pixels, so a cursor eased by left/top clicks
  // along; it is laid out where it comes to rest and travels by transform.
  const curRest = legs[legs.length - 1].to;
  const curDx = Math.abs(curX - curRest.x) < 1e-3 ? 0 : curX - curRest.x;
  const curDy = Math.abs(curY - curRest.y) < 1e-3 ? 0 : curY - curRest.y;
  const curPress = Math.max(
    pressOf(focusEl),
    pressOf(selectEl),
    pressOf(roleEl),
    pressOf(sendEl),
  );
  const curOp =
    tween(frame, cursorEl.start, cursorEl.beat("fadeIn"), EASE.enter) *
      (1 -
        tween(
          frame,
          focusEl.start + focusEl.beat("hideAt"),
          focusEl.beat("hide"),
          EASE.exit,
        )) +
    tween(
      frame,
      selClick + selectEl.beat("showAt"),
      selectEl.beat("show"),
      EASE.enter,
    );
  const optTop = MY + SELECT.y + SELECT.h + 6 + 6;
  const hovered = Math.floor((curY - optTop) / OPT_H);

  const btnLabel =
    shownChips === 0
      ? "Send invites"
      : `Invite ${shownChips} ${shownChips === 1 ? "teammate" : "teammates"}`;
  const typingIdx = list.findIndex(
    (_, i) => frame >= typeStart[i] && frame < chipAt[i],
  );
  const caretOn =
    Math.floor(frame / 8) % 2 === 0 || (frame >= typeAt && frame < typedEnd);
  const caretSlot =
    typingIdx >= 0
      ? chips[typingIdx]
      : shownChips < n
        ? chips[shownChips]
        : {
            x: (chips[n - 1]?.x ?? 0) + (chips[n - 1]?.w ?? 0) + 10,
            y: chips[n - 1]?.y ?? 8,
            w: 0,
          };

  const cols = tall ? 2 : 3;
  const gridW = WIN.w - 64;
  const tileW = (gridW - (cols - 1) * 20) / cols;
  const tileH = tileW * 0.5625;
  const shown = PROJECTS;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {background === undefined ? (
        <GshGround
          preset={ground ?? (dark ? "europa" : "paper-crease")}
          params={groundParams}
          timeOffset={4}
          timeScale={0.5}
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
            left: 0,
            top: 0,
            width: SW,
            height: SH,
            transform: `scale(${k})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${cam})${glide(camMoving)}`,
              transformOrigin: `${SW / 2}px ${MY + MODAL_H / 2}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: WIN.x,
                top: WIN.y,
                width: WIN.w,
                height: WIN.h,
                borderRadius: 18,
                overflow: "hidden",
                background: pal.win,
                boxShadow: pal.winShadow,
                opacity: winOp,
                transform: `translateY(${(1 - winIn) * 40}px)${glide(winMoving)}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  filter: `blur(${dim * 2.5}px)`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 32,
                    top: 30,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 30,
                      letterSpacing: "-0.025em",
                      color: fg,
                    }}
                  >
                    {pageTitle}
                  </span>
                  <span style={{ fontSize: 17, color: pal.muted }}>
                    12 videos
                  </span>
                </div>
                {EXISTING.map((p, i) => (
                  <div
                    key={p.initials}
                    style={{
                      position: "absolute",
                      left: PILE_RIGHT - AV - i * STEP - WIN.x,
                      top: PILE_Y - WIN.y,
                      zIndex: 2 - i,
                    }}
                  >
                    <Avatar
                      label={p.initials}
                      tone={p.tone}
                      size={AV}
                      ring={pal.win}
                    />
                  </div>
                ))}
                <div
                  style={{
                    position: "absolute",
                    left: inviteX - WIN.x,
                    top: 30,
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: btnInvite.w,
                      height: 42,
                      borderRadius: 10,
                      boxShadow: pal.ghost,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 16,
                      color: fg,
                    }}
                  >
                    <Icon name="users" size={18} color={fg} />
                    Invite
                  </div>
                  {tall ? null : (
                    <div
                      style={{
                        width: btnNew.w,
                        height: 42,
                        borderRadius: 10,
                        background: pal.ink,
                        color: pal.inkText,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontSize: 16,
                      }}
                    >
                      <Icon name="plus" size={18} color={pal.inkText} />
                      New video
                    </div>
                  )}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 32,
                    top: 104,
                    width: gridW,
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    columnGap: 20,
                    rowGap: 22,
                  }}
                >
                  {shown.map(([title, len, meta], i) => (
                    <div key={title}>
                      <div
                        style={{
                          position: "relative",
                          height: tileH,
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        <Img
                          src={images[i % images.length]}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 12,
                            boxShadow: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            right: 10,
                            bottom: 10,
                            fontSize: 15,
                            fontVariantNumeric: "tabular-nums",
                            color: "#FFFFFF",
                            background: "rgba(0,0,0,0.5)",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {len}
                        </div>
                      </div>
                      <div style={{ fontSize: 17, color: fg, marginTop: 12 }}>
                        {title}
                      </div>
                      <div
                        style={{ fontSize: 16, color: pal.muted, marginTop: 2 }}
                      >
                        {meta}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: pal.overlay,
                  opacity: dim,
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: MX,
                top: MY,
                width: MW,
                height: MODAL_H,
                borderRadius: 20,
                background: pal.modal,
                boxShadow: pal.modalShadow,
                opacity: modalOp * (1 - modalOut),
                transform: `translateY(${(1 - modalIn) * 18 + modalOut * 10}px) scale(${(0.97 + 0.03 * modalIn) * (1 - 0.03 * modalOut)})${glide(modalMoving)}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: 24,
                  fontSize: 23,
                  letterSpacing: "-0.02em",
                  color: fg,
                }}
              >
                Invite to {workspace}
              </div>
              <div style={{ position: "absolute", right: 22, top: 26 }}>
                <Icon name="x" size={20} color={pal.muted} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: 74,
                  fontSize: 16,
                  color: pal.muted,
                }}
              >
                {fieldLabel}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: INPUT.x,
                  top: INPUT.y,
                  width: INPUT.w,
                  height: INPUT.h,
                  borderRadius: 12,
                  background: pal.field,
                  boxShadow: `inset 0 0 0 1px ${focus > 0.5 ? withAlpha(accent, 0.9) : pal.strong}, 0 0 0 ${focus * 3}px ${withAlpha(accent, 0.16)}`,
                }}
              >
                {shownChips === 0 && typingIdx < 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: 15,
                      fontSize: 17,
                      color: pal.faint,
                    }}
                  >
                    name@company.com
                  </div>
                ) : null}
                {list.map((e, i) => {
                  const cs = chips[i];
                  const pop = sp(chipAt[i], SPR.chip);
                  const typing = frame >= typeStart[i] && frame < chipAt[i] + 1;
                  const typed = Math.floor(
                    clamp01((frame - typeStart[i]) / emailEls[i].beat("type")) *
                      e.length,
                  );
                  const flying = frame >= flyAt[i];
                  return (
                    <div key={e}>
                      {typing && frame < chipAt[i] ? (
                        <div
                          style={{
                            position: "absolute",
                            left: cs.x + 6,
                            top: cs.y + 6,
                            fontSize: 17,
                            lineHeight: "22px",
                            color: fg,
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {e.slice(0, typed)}
                          <span
                            style={{
                              display: "inline-block",
                              width: 1.5,
                              height: 20,
                              marginLeft: 1,
                              background: accent,
                            }}
                          />
                        </div>
                      ) : null}
                      {frame >= chipAt[i] ? (
                        <div
                          style={{
                            position: "absolute",
                            left: cs.x,
                            top: cs.y,
                            width: cs.w,
                            height: CHIP_H,
                            borderRadius: CHIP_H / 2,
                            background: pal.chip,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "0 10px 0 5px",
                            boxSizing: "border-box",
                            transform: `scale(${0.85 + 0.15 * pop})${glide(inModal((f) => spAt(f, chipAt[i], SPR.chip) * 0.15 * cs.w))}`,
                            transformOrigin: "15% 50%",
                            opacity: clamp01(pop * 2),
                          }}
                        >
                          <div style={{ opacity: flying ? 0 : 1 }}>
                            <Avatar
                              label={e[0].toUpperCase()}
                              tone={AV_TONES[i % AV_TONES.length]}
                              size={24}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 16,
                              color: fg,
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {e}
                          </span>
                          <Icon name="x" size={14} color={pal.muted} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {focus > 0.5 && caretOn && typingIdx < 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: caretSlot.x + 6,
                      top: caretSlot.y + 7,
                      width: 1.5,
                      height: 20,
                      background: accent,
                    }}
                  />
                ) : null}
              </div>

              <div style={{ position: "absolute", left: 24, top: SELECT.y }}>
                <div style={{ fontSize: 17, color: fg }}>Role</div>
                <div style={{ fontSize: 16, color: pal.muted, marginTop: 3 }}>
                  {ROLE_INFO[roleNow] ?? "Custom permissions"}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: SELECT.x,
                  top: SELECT.y,
                  width: SELECT.w,
                  height: SELECT.h,
                  borderRadius: 10,
                  boxShadow: `inset 0 0 0 1px ${dropIn > 0.5 ? withAlpha(accent, 0.9) : pal.strong}, 0 0 0 ${dropIn * 3}px ${withAlpha(accent, 0.16)}`,
                  background: pal.field,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px 0 14px",
                  fontSize: 17,
                  color: fg,
                  transform: `scale(${1 - 0.04 * pressOf(selectEl)})${glide(inModal((f) => pressAt(f, selectEl) * 0.04 * SELECT.w))}`,
                }}
              >
                {roleNow}
                <div style={{ marginLeft: "auto" }}>
                  <Icon name="chev" size={18} color={pal.muted} />
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 284,
                  height: 1,
                  background: pal.line,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  top: BUTTON.y,
                  height: BUTTON.h,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 16,
                  color: pal.muted,
                }}
              >
                <Icon name="link" size={18} color={pal.muted} />
                Copy invite link
              </div>
              <div
                style={{
                  position: "absolute",
                  left: BUTTON.x,
                  top: BUTTON.y,
                  width: BUTTON.w,
                  height: BUTTON.h,
                  borderRadius: 10,
                  background: accent,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 16,
                  color: "#FFFFFF",
                  opacity: shownChips === 0 ? 0.5 : 1,
                  transform: `scale(${1 - 0.04 * pressOf(sendEl)})${glide(inModal((f) => pressAt(f, sendEl) * 0.04 * BUTTON.w))}`,
                }}
              >
                {loading ? (
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 16 16"
                    aria-hidden
                    style={{
                      transform: `rotate(${(frame - btnClick) * 16}deg)`,
                    }}
                  >
                    <circle
                      cx={8}
                      cy={8}
                      r={6}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1.5}
                      fill="none"
                    />
                    <path
                      d="M8 2 A6 6 0 0 1 14 8"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : done ? (
                  <div style={{ transform: `scale(${sp(doneAt, SPR.chip)})` }}>
                    <Icon name="check" size={18} color="#FFFFFF" />
                  </div>
                ) : null}
                {loading ? "Sending" : done ? doneLabel : btnLabel}
              </div>

              {dropIn > 0.01 ? (
                <div
                  style={{
                    position: "absolute",
                    left: SELECT.x - 28,
                    top: SELECT.y + SELECT.h + 6,
                    width: SELECT.w + 28,
                    padding: 6,
                    borderRadius: 14,
                    background: pal.modal,
                    boxShadow: pal.pop,
                    opacity: clamp01(dropIn * 1.6),
                    transform: `translateY(${(1 - dropIn) * -8}px) scale(${0.96 + 0.04 * dropIn})${glide(inModal((f) => dropInAt(f) * 16))}`,
                    transformOrigin: "70% 0",
                  }}
                >
                  {roles.map((r, i) => (
                    <div
                      key={r}
                      style={{
                        height: OPT_H,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        fontSize: 17,
                        color: fg,
                        background: i === hovered ? pal.hover : "transparent",
                      }}
                    >
                      {r}
                      {r === roleNow ? (
                        <div style={{ marginLeft: "auto" }}>
                          <Icon name="check" size={18} color={accent} />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {list.map((e, j) => {
              if (frame < flyAt[j]) return null;
              const t = sp(flyAt[j], SPR.card);
              const from = {
                x: MX + INPUT.x + chips[j].x + 5,
                y: MY + INPUT.y + chips[j].y + (CHIP_H - 24) / 2,
              };
              const to = {
                x: PILE_RIGHT - AV - (EXISTING.length + j) * STEP,
                y: PILE_Y,
              };
              const ctrl = {
                x: from.x + (to.x - from.x) * 0.25 - 40,
                y: Math.min(from.y, to.y) - 70,
              };
              const m = 1 - t;
              const x = m * m * from.x + 2 * m * t * ctrl.x + t * t * to.x;
              const y = m * m * from.y + 2 * m * t * ctrl.y + t * t * to.y;
              const size = 24 + (AV - 24) * clamp01(t);
              const land = frame >= landAt[j] ? sp(landAt[j], SPR.chip) : 0;
              const scale =
                frame >= landAt[j]
                  ? 1.12 - 0.12 * land
                  : 1 + 0.1 * Math.sin(clamp01(t) * Math.PI);
              const lift = Math.sin(clamp01(t) * Math.PI);
              // Laid out on its seat in the pile at its landed size; the flight
              // and the growth there are a transform, since layout would round
              // both to whole pixels. `shift` keeps the grown box where the
              // smaller one sat.
              const grow = size / AV;
              const shift = (size - AV) / 2;
              const dx =
                Math.abs(x + shift - to.x) < 1e-3 ? 0 : x + shift - to.x;
              const dy =
                Math.abs(y + shift - to.y) < 1e-3 ? 0 : y + shift - to.y;
              const flying = inner((f) => spAt(f, flyAt[j], SPR.card) * 400);
              // The letter sits at the centre, so it moves far less than the
              // rim this measures; a looser threshold drops the tilt as soon
              // as the letter itself has stopped.
              const settling = inner(
                (f) =>
                  f >= landAt[j] ? spAt(f, landAt[j], SPR.chip) * 0.12 * AV : 0,
                4e-3,
              );
              return (
                <div
                  key={e}
                  style={{
                    position: "absolute",
                    left: to.x,
                    top: to.y,
                    zIndex: 20 - j,
                    transform: `translate(${dx}px, ${dy}px) scale(${Math.abs(scale * grow - 1) < 1e-4 ? 1 : scale * grow})${glide(flying || settling)}`,
                    filter: `drop-shadow(0 ${(8 * lift) / grow}px ${(10 * lift) / grow}px rgba(0,0,0,${0.25 * lift}))`,
                  }}
                >
                  <Avatar
                    label={e[0].toUpperCase()}
                    tone={AV_TONES[j % AV_TONES.length]}
                    size={AV}
                    ring={pal.win}
                  />
                </div>
              );
            })}

            {frame >= toastAt ? (
              <div
                style={{
                  position: "absolute",
                  left: SW / 2 - (tall ? 240 : 220),
                  top: tall ? SH - 150 : WIN.y + WIN.h - 92,
                  width: tall ? 480 : 440,
                  height: 60,
                  padding: "0 18px",
                  boxSizing: "border-box",
                  borderRadius: 14,
                  background: dark ? "#EDEDEF" : "#18181B",
                  color: dark ? "#141518" : "#FAFAFA",
                  boxShadow: dark
                    ? "0 18px 40px -12px rgba(0,0,0,0.6)"
                    : "0 2px 6px rgba(24,24,27,0.1), 0 18px 40px -12px rgba(24,24,40,0.45)",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  opacity: toastOp,
                  transform: `translateY(${(1 - toast) * 28}px) scale(${0.97 + 0.03 * toast})${glide(
                    // Its spring rings out below a pixel for a long while; the
                    // looser bound leaves those near-still frames untilted.
                    inner((f) => spAt(f, toastAt, SPR.card) * 28, 2e-3),
                  )}`,
                }}
              >
                <Icon
                  name="check"
                  size={20}
                  color={dark ? "#141518" : "#FAFAFA"}
                />
                <span style={{ fontSize: 17 }}>
                  {n} {n === 1 ? "invite" : "invites"} sent
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 16,
                    color: dark ? "#6B6D74" : "#A1A1AA",
                  }}
                >
                  {role} access
                </span>
              </div>
            ) : null}

            <svg
              width={26}
              height={26}
              viewBox="0 0 24 24"
              aria-hidden
              style={{
                position: "absolute",
                left: curRest.x - 2,
                top: curRest.y - 2,
                overflow: "visible",
                opacity: clamp01(curOp),
                transform: `translate(${curDx}px, ${curDy}px) scale(${1 - 0.04 * curPress})`,
                transformOrigin: "2px 2px",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
                zIndex: 30,
              }}
            >
              <path
                d="M1 1 L1 18.5 L5.6 14.4 L8.7 21.6 L11.6 20.4 L8.5 13.2 L14.5 13.2 Z"
                fill="#FFFFFF"
                stroke="#111111"
                strokeWidth={1.1}
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
