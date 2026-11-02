"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadOnest("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface ChangelogEntry {
  date: string;
  text: string;
  version?: string;
}

export interface ChangelogScrollProps {
  entries?: ChangelogEntry[];
  focus?: number;
  title?: string;
  url?: string;
  logo?: React.ReactNode;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_ENTRIES: ChangelogEntry[] = [
  { date: "Oct 22", text: "Fix · Shader seek on Safari", version: "v3.24" },
  {
    date: "Oct 20",
    text: "Improved · Spring presets for type",
    version: "v3.23",
  },
  { date: "Oct 17", text: "New · Tilt shift filter", version: "v3.22" },
  { date: "Oct 15", text: "Fix · Caption timing at 60fps", version: "v3.21" },
  { date: "Oct 13", text: "New · Agent plugins", version: "v3.20" },
  {
    date: "Oct 10",
    text: "Improved · Faster registry builds",
    version: "v3.19",
  },
  { date: "Oct 08", text: "New · Studio protocol", version: "v3.18" },
  { date: "Oct 06", text: "Fix · Grain seed per scene", version: "v3.17" },
  { date: "Oct 03", text: "Improved · Lighter icon bundle", version: "v3.16" },
  { date: "Oct 01", text: "New · 31 caption styles", version: "v3.15" },
  { date: "Sep 29", text: "Fix · Light theme contrast", version: "v3.14" },
  { date: "Sep 26", text: "New · Bauhaus backgrounds", version: "v3.13" },
  { date: "Sep 24", text: "New · Keystroke overlay", version: "v3.12" },
  { date: "Sep 22", text: "Improved · Docs for agents", version: "v3.11" },
  { date: "Sep 19", text: "New · Code morph", version: "v3.10" },
  { date: "Sep 17", text: "Fix · Transition z-order", version: "v3.9" },
  { date: "Sep 15", text: "New · Speed lines", version: "v3.8" },
  { date: "Sep 12", text: "Improved · Remotion 4.0.473", version: "v3.7" },
  { date: "Sep 10", text: "New · Truchet tiles", version: "v3.6" },
  { date: "Sep 08", text: "Fix · Font loading race", version: "v3.5" },
  { date: "Sep 05", text: "New · 100 animated icons", version: "v3.4" },
  { date: "Sep 03", text: "Improved · Zoom blur quality", version: "v3.3" },
  { date: "Sep 01", text: "New · Shader backgrounds", version: "v3.2" },
  { date: "Aug 29", text: "New · Whip pan transition", version: "v3.1" },
];

// Advance widths (per 1000 em) for printable ASCII, measured from the fonts:
// Onest 500 for the entry text, Newsreader italic 400 for the "New" tag.
const widths = (csv: string) => csv.split(",").map((v) => Number(v) / 1000);
const ONEST_500 = widths(
  "274,283,377,662,658,831,690,230,323,323,430,564,274,460,263,489,663,372,564,604,634,616,623,507,623,620,263,274,564,564,564,519,987,684,662,707,723,614,601,724,732,272,567,641,581,870,749,765,638,765,668,655,578,730,694,990,618,637,604,332,489,332,564,457,576,559,611,556,611,574,372,611,596,230,259,533,230,830,596,596,611,611,380,510,369,579,543,851,530,603,515,394,268,394,564",
);
const NEWSREADER_I = widths(
  "233,268,345,566,566,807,687,191,276,276,432,516,232,344,224,406,566,566,566,566,566,566,566,650,566,566,256,266,516,516,516,446,909,677,625,682,744,624,574,733,772,333,424,696,570,942,742,753,590,752,632,541,634,737,662,919,680,652,610,318,376,320,516,390,500,494,468,378,498,397,308,420,498,285,256,476,260,767,538,451,509,464,396,348,318,516,470,666,486,477,420,316,250,315,516",
);
/** The italic tag is set a touch larger so its x-height meets Onest's. */
const TAG_SCALE = 1.16;

// gradients.sh "mist" palette: the focused entry's band becomes a mist panel.
const MIST = ["#f4d9ff", "#a77bff", "#3b2a9e", "#120d33"] as const;
const MIST_BG = "#040407";
const PANEL_INK = "#F7F4FF";

const SCROLL_ROWS = 30;
const LAND = 58;
const EXPAND = 64;
const EXPAND_END = 92;
const HERO_TRACK = -0.04;
const ROW_TRACK = -0.01;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    key: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    row: "#7C7B82",
    date: "#5E5D63",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.16)",
    band: "rgba(255,255,255,0.025)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    key: "rgba(255,255,255,0.9)",
    fg: "#121214",
    row: "#8A8781",
    date: "#A3A09A",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    band: "rgba(18,18,20,0.025)",
    grain: 0.045,
  },
} as const;

function em(text: string, track: number, table = ONEST_500) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    w += code >= 32 && code < 127 ? table[code - 32] : 0.261;
    w += track;
  }
  return w;
}

function heroEm(text: string, track: number) {
  const { tag, body } = split(text);
  if (!tag) return em(body, track);
  return em(tag, track, NEWSREADER_I) * TAG_SCALE + em(` · ${body}`, track);
}

function mistPanel(t: number) {
  const x = 66 + 6 * Math.sin(t / 60);
  return [
    `radial-gradient(70% 120% at ${x}% 150%, ${MIST[0]} 0%, ${MIST[1]} 30%, color-mix(in oklab, ${MIST[2]} 70%, transparent) 62%, transparent 100%)`,
    `radial-gradient(60% 140% at ${18 - x * 0.1}% -30%, color-mix(in oklab, ${MIST[2]} 55%, transparent) 0%, transparent 70%)`,
    `linear-gradient(180deg, ${MIST[3]} 0%, ${MIST_BG} 100%)`,
  ].join(", ");
}

function EntryText({
  text,
  tagColor,
  dotColor,
}: {
  text: string;
  tagColor?: string;
  dotColor?: string;
}) {
  const { tag, body } = split(text);
  if (!tag) return <>{body}</>;
  return (
    <span style={{ whiteSpace: "pre" }}>
      <span
        style={{
          fontFamily: serif,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: `${TAG_SCALE}em`,
          letterSpacing: "-0.01em",
          color: tagColor,
        }}
      >
        {tag}
      </span>
      <span style={{ color: dotColor }}>{" · "}</span>
      {body}
    </span>
  );
}

function split(text: string) {
  const i = text.indexOf(" · ");
  if (i < 0) return { tag: "", body: text };
  return { tag: text.slice(0, i), body: text.slice(i + 3) };
}

function scrollOffset(t: number) {
  const p = interpolate(t, [0, LAND], [0, 1], CLAMP);
  return -SCROLL_ROWS * (1 - Easing.bezier(0.22, 1, 0.36, 1)(p));
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={21}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** remocn.dev logo: R mark (0.76em, on the baseline) + "emocn" in Manrope 600. */
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

function Row({
  entry,
  y,
  left,
  right,
  textLeft,
  rowFont,
  dateFont,
  rowH,
  opacity,
  c,
}: {
  entry: ChangelogEntry;
  y: number;
  left: number;
  right: number;
  textLeft: number;
  rowFont: number;
  dateFont: number;
  rowH: number;
  opacity: number;
  c: (typeof THEMES)[keyof typeof THEMES];
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y - rowH / 2,
        height: rowH,
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          left,
          top: 0,
          height: rowH,
          display: "flex",
          alignItems: "center",
          fontFamily: mono,
          fontSize: dateFont,
          color: c.date,
          whiteSpace: "nowrap",
        }}
      >
        {entry.date}
      </div>
      {entry.version ? (
        <div
          style={{
            position: "absolute",
            right,
            top: 0,
            height: rowH,
            display: "flex",
            alignItems: "center",
            fontFamily: mono,
            fontSize: dateFont,
            color: c.date,
            whiteSpace: "nowrap",
          }}
        >
          {entry.version}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: textLeft,
          top: 0,
          height: rowH,
          display: "flex",
          alignItems: "center",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: rowFont,
          letterSpacing: `${ROW_TRACK}em`,
          color: c.row,
          whiteSpace: "nowrap",
        }}
      >
        <EntryText text={entry.text} />
      </div>
    </div>
  );
}

export function ChangelogScroll({
  entries = DEFAULT_ENTRIES,
  focus = 9,
  title = "Changelog",
  url = "remocn.dev/changelog",
  logo,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ChangelogScrollProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];
  const n = Math.max(1, entries.length);
  const fi = Math.min(Math.max(0, Math.round(focus)), n - 1);
  const hero = entries[fi] ?? { date: "", text: "" };

  const margin = Math.round(W * 0.08);
  const cy = H / 2;
  const rowH = 56 * u;
  const rowFont = 27 * u;
  const dateFont = 19 * u;
  const textLeft = margin + 150 * u;
  const heroF = Math.min(
    112 * u,
    ((W - margin * 2) * 0.975) / heroEm(hero.text, HERO_TRACK),
  );
  const kickerGap = 18 * u;
  const bandBig = heroF * 1.12 + dateFont + kickerGap + 64 * u;

  const off = scrollOffset(t);
  const v = (off - scrollOffset(t - 1)) * rowH;
  const fast = interpolate(Math.abs(v), [10 * u, 70 * u], [0, 1], CLAMP);
  const intro = interpolate(t, [0, 8], [0, 1], CLAMP);

  const land = interpolate(t, [LAND, LAND + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const ex = interpolate(t, [EXPAND, EXPAND_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const accentIn = interpolate(t, [EXPAND_END - 8, EXPAND_END + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const chrome = interpolate(t, [EXPAND_END - 4, EXPAND_END + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const bandH = rowH + (bandBig - rowH) * ex;
  const push = (bandH - rowH) / 2;

  const visible = Math.ceil(H / rowH / 2) + 3;
  const base = Math.round(off);
  const rows: React.ReactNode[] = [];
  for (let k = -visible; k <= visible; k++) {
    const i = fi + base + k;
    const rel = i - fi - off;
    const entry = entries[((i % n) + n) % n];
    const y =
      cy + rel * rowH + Math.sign(rel) * push * Math.min(1, Math.abs(rel));
    const isFocus = i === fi;
    const dim = 1 - land * 0.45;
    const op = intro * (isFocus ? 1 : dim);
    for (let g = 5; g >= 1; g--) {
      if (fast <= 0.01) break;
      rows.push(
        <Row
          key={`g${i}-${g}`}
          entry={entry}
          y={y + v * g * 0.05}
          left={margin}
          right={margin}
          textLeft={textLeft}
          rowFont={rowFont}
          dateFont={dateFont}
          rowH={rowH}
          opacity={op * fast * 0.16 * (1 - g / 6)}
          c={c}
        />,
      );
    }
    if (isFocus && t >= LAND) continue;
    rows.push(
      <Row
        key={`r${i}`}
        entry={entry}
        y={y}
        left={margin}
        right={margin}
        textLeft={textLeft}
        rowFont={rowFont}
        dateFont={dateFont}
        rowH={rowH}
        opacity={op}
        c={c}
      />,
    );
  }

  const heroScale = (rowFont + (heroF - rowFont) * ex) / heroF;
  const heroLeft = textLeft + (margin - textLeft) * ex;
  const track = ROW_TRACK + (HERO_TRACK - ROW_TRACK) * ex;
  const heroBlockH = heroF * 1.12;
  const heroCenter = cy + ((dateFont + kickerGap) / 2) * ex;
  const dateY =
    cy + (heroCenter - heroBlockH / 2 - kickerGap - dateFont / 2 - cy) * ex;
  const bright = land;
  const mixColor = (a: string, b: string, p: number) =>
    `color-mix(in srgb, ${b} ${Math.round(p * 100)}%, ${a})`;

  const hair = Math.max(1, u);
  const bandIn = interpolate(t, [4, 24], [0, 1], { ...CLAMP, easing: EASE_IO });
  const bandHair = interpolate(t, [LAND - 4, LAND + 12], [0.55, 1], CLAMP);

  const panel = interpolate(t, [EXPAND - 2, EXPAND + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const panelLeft = W * 0.06;
  const panelRight = panelLeft + W * 0.88 * panel;

  const heroGroup = (onPanel: boolean) => {
    const kicker = onPanel
      ? `color-mix(in oklab, ${PANEL_INK} 62%, transparent)`
      : mixColor(c.date, c.muted, bright);
    const ink = onPanel ? PANEL_INK : mixColor(c.row, c.fg, bright);
    const tagInk = onPanel
      ? MIST[0]
      : mixColor(mixColor(c.row, c.fg, bright), accent, accentIn);
    const dotInk = onPanel
      ? `color-mix(in oklab, ${PANEL_INK} 45%, transparent)`
      : mixColor(c.row, c.muted, bright);
    const meta: React.CSSProperties = {
      position: "absolute",
      top: dateY - rowH / 2,
      height: rowH,
      display: "flex",
      alignItems: "center",
      fontFamily: mono,
      fontWeight: 400,
      fontSize: dateFont,
      color: kicker,
      whiteSpace: "nowrap",
    };
    return (
      <>
        <div style={{ ...meta, left: margin }}>{hero.date}</div>
        {hero.version ? (
          <div style={{ ...meta, right: margin }}>{hero.version}</div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: heroLeft,
            top: heroCenter - heroBlockH / 2,
            height: heroBlockH,
            display: "flex",
            alignItems: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: heroF,
            letterSpacing: `${track}em`,
            whiteSpace: "nowrap",
            transformOrigin: "0% 50%",
            transform: `scale(${heroScale})`,
            color: ink,
          }}
        >
          <EntryText text={hero.text} tagColor={tagInk} dotColor={dotInk} />
        </div>
      </>
    );
  };

  const label: React.CSSProperties = {
    position: "absolute",
    top: 0.075 * H,
    fontFamily: sans,
    fontWeight: 400,
    fontSize: 17 * u,
    lineHeight: 1,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 10 * u,
    opacity: chrome,
    transform: `translateY(${(1 - chrome) * 8 * u}px)`,
  };

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${c.key}, transparent 72%)`,
        }}
      />

      <AbsoluteFill
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 12%, #000 34%, #000 66%, transparent 88%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 12%, #000 34%, #000 66%, transparent 88%)",
        }}
      >
        {rows}
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: W * 0.06,
          right: W * 0.06,
          top: cy - bandH / 2,
          height: bandH,
          background: c.band,
          opacity: bandIn,
        }}
      />
      {[-1, 1].map((s) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: W * 0.06,
            width: W * 0.88 * bandIn,
            top: cy + (s * bandH) / 2 - hair / 2,
            height: hair,
            background: c.hair,
            opacity: bandHair,
          }}
        />
      ))}

      {t >= LAND ? heroGroup(false) : null}

      {panel > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(${cy - bandH / 2}px ${W - panelRight}px ${H - cy - bandH / 2}px ${panelLeft}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: panelLeft,
              width: W * 0.88,
              top: cy - bandH / 2,
              height: bandH,
              backgroundImage: mistPanel(t),
            }}
          />
          {heroGroup(true)}
        </div>
      ) : null}

      <div
        style={{
          ...label,
          left: margin,
          color: c.muted,
          alignItems: "baseline",
          gap: 14 * u,
        }}
      >
        {logo ?? <RemocnLogo fontSize={22 * u} color={c.fg} />}
        <span
          style={{
            width: hair,
            height: 16 * u,
            background: c.hair,
            alignSelf: "center",
          }}
        />
        <span>{title}</span>
      </div>
      <div
        style={{
          ...label,
          right: margin,
          color: c.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {url}
      </div>

      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
