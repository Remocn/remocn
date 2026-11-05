"use client";

import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";
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

const rubik = loadRubik("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface MenuPickProps {
  prompt?: string;
  options?: string[];
  pick?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const RED = "#E60012";

const THEMES = {
  dark: {
    ink: "#F4F2F1",
    soft: "rgba(244,242,241,0.56)",
    faint: "rgba(244,242,241,0.08)",
    onAccent: "#FFFFFF",
    panel: "rgba(16,13,14,0.9)",
    depth:
      "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.3), 0 24px 60px -12px rgba(0,0,0,0.6)",
    key: "rgba(244,242,241,0.14)",
    ground: "garnet" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
  },
  light: {
    ink: "#141213",
    soft: "rgba(20,18,19,0.52)",
    faint: "rgba(20,18,19,0.07)",
    onAccent: "#FFFFFF",
    panel: "rgba(255,255,255,0.94)",
    depth:
      "inset 0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(40,10,14,0.06), 0 24px 56px -16px rgba(60,12,20,0.22)",
    key: "rgba(20,18,19,0.1)",
    ground: undefined as GshPresetId | undefined,
    groundParams: {
      kind: "silk",
      colors: ["#f0a8a0", "#fff4ef", "#ffc9c2"],
      background: "#f3efec",
      loopSeconds: 28,
      scale: 0.55,
      warp: 0.3,
      blur: 0.5,
      seed: 2,
    } as Partial<GradientParams> | undefined,
  },
};

const ROW_IN = 3;
const ROWS_AT = 4;
const CURSOR_AT = 14;
const HOP_GAPS = [10, 9, 7, 7];
const CONFIRM_GAP = 9;
const BLINK = 3;
const BLINKS = 2;
const DIM = 0.3;

const EASE_ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EASE_MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const SPRING_HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const SPRING_CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const SPRING_HOP = { mass: 0.5, damping: 16, stiffness: 260 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function estimateEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.26;
    else if (/[ilIj.,'’!|]/.test(ch)) w += 0.27;
    else if (/[mwMW]/.test(ch)) w += 0.86;
    else if (/[A-Z]/.test(ch)) w += 0.68;
    else w += 0.56;
  }
  return w;
}

function hopRoute(count: number, pick: number) {
  if (count <= 1) return [0];
  const route = [0];
  const near = Math.max(0, Math.min(count - 1, pick === 0 ? 1 : pick - 1));
  const steps = [near, pick, near, pick];
  for (const s of steps) if (s !== route[route.length - 1]) route.push(s);
  if (route[route.length - 1] !== pick) route.push(pick);
  return route;
}

function Chevron({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 5.5 15.5 12 9 18.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MenuPick({
  prompt = "Choose your launch",
  options = ["Keyframe every beat", "Wait on an agency", "Install the scenes"],
  pick = 2,
  accent = RED,
  background,
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: MenuPickProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const list = options.length > 0 ? options : ["Start"];
  const n = list.length;
  const chosen = Math.max(0, Math.min(n - 1, Math.round(pick)));
  const transparent = background === "transparent";
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? c.groundParams;

  const portrait = H > W * 1.1;
  const panelW = portrait ? W * 0.86 : W * 0.6;
  const panelPad = portrait ? W * 0.03 : W * 0.0125;
  const panelR = panelPad + (portrait ? W * 0.022 : W * 0.0094);
  const rowR = panelR - panelPad;
  const rowPadX = portrait ? W * 0.04 : W * 0.022;
  const chevS = portrait ? W * 0.05 : H * 0.042;
  const widest = Math.max(...list.map(estimateEm));
  const inner = panelW - panelPad * 2 - rowPadX * 2 - chevS * 1.6;
  const F = Math.min(portrait ? W * 0.068 : H * 0.064, inner / widest);
  const rowH = F * (portrait ? 2.2 : 2.05);
  const smallFs = portrait ? W * 0.034 : H * 0.03;
  const headH = smallFs * 3.6;
  const footH = smallFs * 3.4;
  const panelH = panelPad * 2 + headH + rowH * n + footH;
  const panelX = (W - panelW) / 2;
  const panelY = (H - panelH) / 2;
  const rowsTop = panelPad + headH;
  const rowW = panelW - panelPad * 2;

  const route = hopRoute(n, chosen);
  const hopAt = [CURSOR_AT];
  for (let i = 1; i < route.length; i++) {
    hopAt.push(hopAt[i - 1] + HOP_GAPS[Math.min(i - 1, HOP_GAPS.length - 1)]);
  }
  let pos = route[0] as number;
  for (let i = 1; i < route.length; i++) {
    const s = spring({ frame: t - hopAt[i], fps, config: SPRING_HOP });
    pos += ((route[i] as number) - (route[i - 1] as number)) * s;
  }
  const confirmAt = (hopAt[hopAt.length - 1] as number) + CONFIRM_GAP;
  const blinkEnd = confirmAt + BLINK * 2 * BLINKS;
  const blinking = t >= confirmAt && t < blinkEnd;
  const blinkOff = blinking && Math.floor((t - confirmAt) / BLINK) % 2 === 0;
  const cursorIn = interpolate(t, [CURSOR_AT, CURSOR_AT + 6], [0, 1], {
    ...CLAMP,
    easing: EASE_ENTER,
  });
  const press =
    spring({ frame: t - confirmAt, fps, config: SPRING_CHIP }) -
    spring({ frame: t - confirmAt - 5, fps, config: SPRING_CHIP });
  const barScale = 1 - 0.04 * press;
  const settle = interpolate(t, [blinkEnd, blinkEnd + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_MOVE,
  });

  const panelIn = spring({ frame: t, fps, config: SPRING_HEAVY });
  const panelO = interpolate(t, [0, 8], [0, 1], {
    ...CLAMP,
    easing: EASE_ENTER,
  });
  const headIn = interpolate(t, [2, 14], [0, 1], {
    ...CLAMP,
    easing: EASE_ENTER,
  });
  const footIn = interpolate(
    t,
    [ROWS_AT + n * ROW_IN, ROWS_AT + n * ROW_IN + 12],
    [0, 1],
    {
      ...CLAMP,
      easing: EASE_ENTER,
    },
  );

  const rowIn = (i: number) =>
    interpolate(t, [ROWS_AT + i * ROW_IN, ROWS_AT + i * ROW_IN + 12], [0, 1], {
      ...CLAMP,
      easing: EASE_ENTER,
    });

  const barY = rowsTop + pos * rowH;

  const rowText = (onBar: boolean) =>
    list.map((label, i) => {
      const p = rowIn(i);
      const dim = i === chosen ? 1 : 1 - (1 - DIM) * settle;
      return (
        <div
          key={`r${i}`}
          style={{
            position: "absolute",
            left: panelPad,
            top: rowsTop + i * rowH,
            width: rowW,
            height: rowH,
            paddingLeft: rowPadX,
            paddingRight: rowPadX * 0.7,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: p * (onBar ? 1 : dim),
            transform: `translateY(${(1 - p) * rowH * 0.3}px)`,
            color: onBar ? c.onAccent : c.ink,
          }}
        >
          <span
            style={{
              fontFamily: rubik.fontFamily,
              fontWeight: 400,
              fontSize: F,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              whiteSpace: "pre",
            }}
          >
            {label}
          </span>
          {onBar ? <Chevron size={chevS} color={c.onAccent} /> : null}
        </div>
      );
    });

  const Key = ({ k, label }: { k: string; label: string }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: smallFs * 0.5,
      }}
    >
      <span
        style={{
          width: smallFs * 1.5,
          height: smallFs * 1.5,
          borderRadius: 999,
          backgroundColor: c.key,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: smallFs * 0.82,
          color: c.ink,
        }}
      >
        {k}
      </span>
      <span>{label}</span>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : background,
        overflow: "hidden",
      }}
    >
      {transparent || background ? null : (
        <GshGround
          preset={preset}
          params={gParams}
          timeOffset={theme === "light" ? 6 : 4}
          timeScale={0.5}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: panelX,
          top: panelY,
          width: panelW,
          height: panelH,
          borderRadius: panelR,
          backgroundColor: c.panel,
          boxShadow: c.depth,
          opacity: panelO,
          transform: `translateY(${(1 - panelIn) * H * 0.05}px) scale(${0.97 + 0.03 * panelIn})`,
          fontFamily: rubik.fontFamily,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: panelPad + rowPadX,
            right: panelPad + rowPadX,
            top: panelPad,
            height: headH,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 400,
            fontSize: smallFs,
            letterSpacing: "-0.005em",
            color: c.soft,
            opacity: headIn,
            transform: `translateY(${(1 - headIn) * smallFs * 0.6}px)`,
          }}
        >
          <span style={{ color: c.ink }}>{prompt}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {`${Math.min(n, Math.round(pos) + 1)} / ${n}`}
          </span>
        </div>
        {list.slice(1).map((label, i) => (
          <div
            key={`d-${label}`}
            style={{
              position: "absolute",
              left: panelPad + rowPadX,
              right: panelPad + rowPadX,
              top: rowsTop + (i + 1) * rowH,
              height: 1,
              backgroundColor: c.faint,
              opacity: rowIn(i + 1),
            }}
          />
        ))}
        {rowText(false)}
        <div
          style={{
            position: "absolute",
            left: panelPad,
            top: barY,
            width: rowW,
            height: rowH,
            borderRadius: rowR,
            overflow: "hidden",
            backgroundColor: accent,
            opacity: blinkOff ? 0 : cursorIn,
            transform: `scale(${barScale * (0.96 + 0.04 * cursorIn)})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -panelPad,
              top: -barY,
              width: panelW,
              height: panelH,
            }}
          >
            {rowText(true)}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: panelPad + rowPadX,
            right: panelPad + rowPadX,
            bottom: panelPad,
            height: footH,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: smallFs * 1.6,
            fontWeight: 400,
            fontSize: smallFs,
            color: c.soft,
            opacity: footIn,
          }}
        >
          <Key k="B" label="Back" />
          <Key k="A" label="Select" />
        </div>
      </div>
    </AbsoluteFill>
  );
}
