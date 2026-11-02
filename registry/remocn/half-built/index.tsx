"use client";

import { loadFont } from "@remotion/google-fonts/GolosText";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const golos = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface HalfBuiltPart {
  text: string;
  when?: string;
}

export interface HalfBuiltProps {
  parts?: HalfBuiltPart[];
  progress?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#1D2B53", ink: "#FFFFFF", accent: "#FFB38A", hollow: 0.62 },
  light: { bg: "#FFF4EC", ink: "#1D2B53", accent: "#D9623B", hollow: 0.55 },
} as const;

const DEFAULT_PARTS: HalfBuiltPart[] = [
  { text: "It cuts," },
  { text: "captions,", when: "Spring" },
  { text: "narrates", when: "Summer" },
  { text: "and" },
  { text: "translates", when: "Later" },
  { text: "your launch film." },
];

const LH = 1.34;
const TAG_EM = 0.22;
const WORD_GAP = 3;
const TAG_GAP = 5;
const FILL_FULL = 30;
const FILL_PAUSE = 12;
const SETTLE = 10;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_FILL = Easing.bezier(0.45, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface Unit {
  key: string;
  text: string;
  plan: number;
  when?: string;
}

function toUnits(parts: HalfBuiltPart[]) {
  const units: Unit[] = [];
  let plan = 0;
  parts.forEach((p, pi) => {
    if (p.when !== undefined) {
      units.push({ key: `p${pi}`, text: p.text.trim(), plan, when: p.when });
      plan += 1;
    } else {
      p.text
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w, wi) => {
          units.push({ key: `p${pi}-${wi}`, text: w, plan: -1 });
        });
    }
  });
  return { units, planned: plan };
}

export function HalfBuilt({
  parts = DEFAULT_PARTS,
  progress = 1.6,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: HalfBuiltProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const { units, planned } = toUnits(parts);
  const goal = Math.max(0, Math.min(planned, progress));
  const wordsIn = 2 + units.length * WORD_GAP + 12;
  const tagsAt = Math.max(16, wordsIn - 8);
  const fillAt = tagsAt + planned * TAG_GAP + 14;
  const segments: { start: number; end: number; amount: number }[] = [];
  let cursor = fillAt;
  for (let j = 0; j < Math.ceil(goal); j++) {
    const amount = Math.min(1, goal - j);
    const dur = Math.max(16, FILL_FULL * amount);
    segments.push({ start: cursor, end: cursor + dur, amount });
    cursor += dur + FILL_PAUSE + (amount >= 1 ? SETTLE : 0);
  }
  const naturalEnd = segments.length
    ? segments[segments.length - 1].end + SETTLE
    : fillAt;
  const pace = Math.max(1, (naturalEnd + 30) / Math.max(1, durationInFrames));
  const t = frame * speed * pace;

  const portrait = H > W * 1.1;
  const margin = W * (portrait ? 0.08 : 0.07);
  const boxW = W - margin * 2;
  const maxH = H * (portrait ? 0.62 : 0.66);
  const sizeCap = Math.min(H * 0.2, W * (portrait ? 0.16 : 0.12));

  const probeRef = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender("half-built: measuring"));
  const released = useRef(false);
  const [fontsOk, setFontsOk] = useState(false);
  const [size, setSize] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      golos.waitUntilDone(),
      document.fonts.load(`500 100px "${golos.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setFontsOk(true);
      });
    return () => {
      live = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (!fontsOk) return;
    const probe = probeRef.current;
    if (!probe) return;
    let s = sizeCap;
    for (let i = 0; i < 60; i++) {
      probe.style.fontSize = `${s}px`;
      if (probe.offsetHeight <= maxH && probe.scrollWidth <= boxW + 1) break;
      s *= 0.96;
    }
    const next = Math.round(s * 10) / 10;
    setSize((prev) => (prev === next ? prev : next));
  });

  useEffect(() => {
    if (size !== null && !released.current) {
      released.current = true;
      continueRender(handle);
    }
  }, [size, handle]);

  const fillOf = (plan: number) => {
    const seg = segments[plan];
    if (!seg) return 0;
    return (
      interpolate(t, [seg.start, seg.end], [0, 1], {
        ...CLAMP,
        easing: EASE_FILL,
      }) * seg.amount
    );
  };
  const doneOf = (plan: number) => {
    const seg = segments[plan];
    if (!seg || seg.amount < 1) return 0;
    return interpolate(t, [seg.end + 2, seg.end + 2 + SETTLE], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };
  const rise = (start: number, dur = 12) =>
    interpolate(t, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const font: React.CSSProperties = {
    fontFamily: golos.fontFamily,
    fontWeight: 500,
    lineHeight: LH,
    letterSpacing: "-0.035em",
  };
  const stroke = `${Math.max(1, (size ?? 100) * 0.016).toFixed(2)}px`;

  const renderUnit = (u: Unit, i: number, live: boolean) => {
    const p = live ? rise(2 + i * WORD_GAP) : 1;
    const style: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
      whiteSpace: "nowrap",
      marginRight: "0.24em",
      opacity: p,
      transform: `translateY(${((1 - p) * 0.28).toFixed(3)}em)`,
    };
    if (u.plan < 0) {
      return (
        <span key={u.key} style={{ ...style, color: c.ink }}>
          {u.text}
        </span>
      );
    }
    const fill = live ? fillOf(u.plan) : 0;
    const done = live ? doneOf(u.plan) : 0;
    const tagP = live ? rise(tagsAt + u.plan * TAG_GAP, 14) : 1;
    return (
      <span key={u.key} style={style}>
        <span
          style={{
            color: "transparent",
            WebkitTextStroke: `${stroke} ${c.ink}`,
            opacity: c.hollow * (1 - done),
          }}
        >
          {u.text}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            color: done > 0 ? c.ink : hi,
            opacity: 1,
            clipPath: `inset(-20% ${((1 - fill) * 100).toFixed(2)}% -20% -2%)`,
          }}
        >
          <span style={{ color: hi, opacity: 1 - done }}>{u.text}</span>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              color: c.ink,
              opacity: done,
            }}
          >
            {u.text}
          </span>
        </span>
        <span
          style={{
            position: "absolute",
            left: "0.02em",
            bottom: `${((LH - 0.1) / TAG_EM).toFixed(3)}em`,
            fontSize: `${TAG_EM}em`,
            lineHeight: 1,
            letterSpacing: "0em",
            color: hi,
            whiteSpace: "nowrap",
            opacity: tagP * (1 - done),
            transform: `translateY(${((1 - tagP) * 0.5).toFixed(3)}em)`,
          }}
        >
          {u.when}
        </span>
      </span>
    );
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        ref={probeRef}
        style={{
          ...font,
          position: "absolute",
          left: 0,
          top: 0,
          width: boxW,
          visibility: "hidden",
        }}
      >
        {units.map((u, i) => renderUnit(u, i, false))}
      </div>
      <div
        style={{
          ...font,
          position: "absolute",
          left: margin,
          top: "50%",
          width: boxW,
          fontSize: size ?? sizeCap,
          transform: "translateY(-50%)",
          opacity: size === null ? 0 : 1,
        }}
      >
        {units.map((u, i) => renderUnit(u, i, true))}
      </div>
    </AbsoluteFill>
  );
}
