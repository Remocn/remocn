"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  random,
  useVideoConfig,
} from "remotion";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ---------------------------------------------------------------------------
// ascii-dissolve — the frame becomes plain text. The outgoing scene fades as
// a fullscreen field of monospace glyphs rises over it: a deterministic
// noise field drives each cell through a density ramp (" .:-=+*#%@"), so the
// cover reads as living ASCII. It holds fully opaque long enough to be READ
// as text, then the cells drop back down the ramp to space while the
// incoming scene resolves beneath.
//
// Text mode (enterText): the outgoing scene blurs out under the rising
// field; the incoming headline is never previewed as ascii — the field
// dissolves cell by cell (per-cell staggered, never a flat plane) while
// the real text fades in over it. `enterStyle` picks what happens AROUND
// the arriving text:
//   "fade"      — plain: staggered dissolve everywhere, text fades in.
//   "clearing"  — the dissolve order is biased by distance to the text:
//                 cells near the headline vanish first, the field opens a
//                 granular cavity around it.
//   "halo"      — a smooth radial attenuation grows around the text: near
//                 cells slide down the ramp into thin glyphs, a soft dark
//                 well forms behind the headline.
//   "wave"      — one density impulse rides outward from the text: cells
//                 on the wavefront jump up the ramp for a beat, then the
//                 front leaves cleared field behind it.
//   "focus"     — the field defocuses: it blurs and dims while the sharp
//                 text resolves — a depth-of-field handoff.
//   "lime-echo" — on landing, a sparse ring of accent-colored glyphs
//                 flashes once around the headline and settles.
//
// Fully deterministic: per-cell jitter comes from remotion's seeded random,
// the flow from fixed sinusoids over progress, the letterform masks from a
// one-time offscreen-canvas sample of the loaded fonts.
// ---------------------------------------------------------------------------

export type AsciiTextSpec = {
  /** The incoming headline (used for timing and the zone styles). */
  text: string;
  /** Must match the scene's rendered text exactly. */
  fontSize: number;
  /** Concrete family list for canvas sampling (CSS vars won't resolve). */
  fontFamily: string;
  /** Default 400. */
  fontWeight?: number;
  /** Letter-spacing in em, if the scene's text carries one. Default 0. */
  letterSpacingEm?: number;
  /** Glyph color of the ASCII letterform. Default ink. */
  color?: string;
  /** Vertical offset from frame center, px. Default 0. */
  offsetY?: number;
};

export type AsciiEnterStyle =
  | "fade"
  | "clearing"
  | "halo"
  | "wave"
  | "focus"
  | "lime-echo";

export type AsciiDissolveProps = {
  /** Row height of one glyph cell in px. Default 22 (use ~14 in text mode). */
  cellSize?: number;
  /** Glyph color. Default translucent ink. */
  colorFront?: string;
  /** Canvas behind the glyphs during the hold. Default near-black. */
  colorBack?: string;
  /** Optional second color for a sparse scattering of accent cells. */
  accentColor?: string;
  /** Share of cells rendered in the accent color, 0..1. Default 0.05. */
  accentDensity?: number;
  /** Density ramp, lightest → densest. Default " .:-=+*#%@". */
  ramp?: string;
  /** Monospace stack for the field. */
  fontFamily?: string;
  /** Text mode: the incoming headline (used for timing and as the zone). */
  enterText?: AsciiTextSpec;
  /** What happens around the arriving text. Default "fade". */
  enterStyle?: AsciiEnterStyle;
  /** Progress window over which the outgoing scene fades out. */
  exitFade?: [number, number];
  /** Progress window over which the incoming scene resolves. */
  enterFade?: [number, number];
};

// Per-cell stagger: global window progress g plus jitter j → this cell's
// local progress. spread controls how far cells drift apart.
const stagger = (g: number, j: number, spread = 0.55) =>
  Math.max(0, Math.min(1, (g - j * spread) / (1 - spread)));

// The field's mono advance, measured at the size the <pre> renders.
const measureAdvance = (fontFamily: string, fontSize: number): number => {
  const fallback = fontSize * 0.6;
  if (typeof document === "undefined") return fallback;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return fallback;
  ctx.font = `400 ${fontSize}px ${fontFamily}`;
  const w = ctx.measureText("0").width;
  return w > 0 ? w : fallback;
};

// Sample the headline's letterforms: draw the text once on an offscreen
// canvas at 2× cell resolution and grade each cell by subsample coverage
// (0..4). Edge cells get mid-ramp glyphs, core cells the densest — the
// grading anti-aliases the letter contours, so strokes thinner than a cell
// still read as continuous letters.
const buildTextMask = (
  spec: AsciiTextSpec,
  width: number,
  height: number,
  cols: number,
  rows: number,
  advance: number,
  cellH: number,
): Uint8Array | null => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = cols * 2;
  canvas.height = rows * 2;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.setTransform(2 / advance, 0, 0, 2 / cellH, 0, 0);
  ctx.font = `${spec.fontWeight ?? 400} ${spec.fontSize}px ${spec.fontFamily}`;
  const spacing = (spec.letterSpacingEm ?? 0) * spec.fontSize;
  if (spacing !== 0) {
    (
      ctx as CanvasRenderingContext2D & { letterSpacing?: string }
    ).letterSpacing = `${spacing}px`;
  }
  ctx.textAlign = "center";
  // Canvas "middle" baseline is computed from the em square and lands
  // visibly ABOVE where a flex-centered DOM span puts the same text. Rebuild
  // the DOM's math instead: a flex-centered span (line-height normal) puts
  // its baseline at H/2 + (ascent - descent)/2, with ascent/descent taken
  // from the font's own metrics.
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  const metrics = ctx.measureText(spec.text);
  const ascent = metrics.fontBoundingBoxAscent ?? spec.fontSize * 0.8;
  const descent = metrics.fontBoundingBoxDescent ?? spec.fontSize * 0.2;
  const baselineY = height / 2 + (ascent - descent) / 2 + (spec.offsetY ?? 0);
  ctx.fillText(spec.text, width / 2, baselineY);
  const data = ctx.getImageData(0, 0, cols * 2, rows * 2).data;
  const mask = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let hits = 0;
      if (data[(y * 2 * cols * 2 + x * 2) * 4 + 3] > 100) hits++;
      if (data[(y * 2 * cols * 2 + x * 2 + 1) * 4 + 3] > 100) hits++;
      if (data[((y * 2 + 1) * cols * 2 + x * 2) * 4 + 3] > 100) hits++;
      if (data[((y * 2 + 1) * cols * 2 + x * 2 + 1) * 4 + 3] > 100) hits++;
      mask[y * cols + x] = hits;
    }
  }
  return mask;
};

const AsciiDissolvePresentation: React.FC<
  TransitionPresentationComponentProps<AsciiDissolveProps>
> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const {
    cellSize = 22,
    colorFront = "rgba(242,242,242,0.6)",
    colorBack = "#0d0d10",
    accentColor,
    accentDensity = 0.05,
    ramp = " .:-=+*#%@",
    fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace",
    enterText,
    enterStyle = "fade",
    exitFade,
    enterFade,
  } = passedProps;
  const { width, height } = useVideoConfig();
  const entering = presentationDirection === "entering";
  const p = presentationProgress;
  const textMode = enterText !== undefined;

  // The outgoing scene blurs out under the rising field.
  const exitWindow = exitFade ?? [0.14, 0.3];
  // The real text fades in while the field dissolves cell by cell.
  const enterWindow = enterFade ?? (textMode ? [0.6, 0.8] : [0.62, 0.8]);

  // The masks and the mono advance must be measured with the REAL webfonts.
  // The component can mount while they are still loading (a fallback font
  // would bake wrong metrics into the memoized masks and shift the letterform
  // off the scene's text) — so gate on document.fonts and hold the render.
  const [fontsReady, setFontsReady] = React.useState(
    () => typeof document === "undefined" || document.fonts.status === "loaded",
  );
  React.useEffect(() => {
    if (fontsReady || typeof document === "undefined") return;
    const handle = delayRender("ascii-dissolve: waiting for fonts");
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) setFontsReady(true);
      continueRender(handle);
    });
    return () => {
      alive = false;
      continueRender(handle);
    };
  }, [fontsReady]);

  const fontSize = cellSize * 0.86;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fontsReady is an intentional extra dep — remeasure the mono advance once the real webfonts load
  const advance = React.useMemo(
    () => measureAdvance(fontFamily, fontSize),
    [fontFamily, fontSize, fontsReady],
  );
  const cols = Math.ceil(width / advance);
  const rows = Math.ceil(height / cellSize) + 1;

  // The zone styles need to know where the incoming text sits — a capsule
  // around its center line, derived from the letterform mask's bounds. The
  // mask itself is never displayed.
  const zoneStyles: AsciiEnterStyle[] = [
    "clearing",
    "halo",
    "wave",
    "lime-echo",
  ];
  const needZone = enterText !== undefined && zoneStyles.includes(enterStyle);
  const enterMask = React.useMemo(
    () =>
      enterText && needZone && fontsReady
        ? buildTextMask(enterText, width, height, cols, rows, advance, cellSize)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      enterText,
      needZone,
      fontsReady,
      width,
      height,
      cols,
      rows,
      advance,
      cellSize,
    ],
  );
  const enterZone = React.useMemo(() => {
    if (enterMask === null) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (enterMask[y * cols + x] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX) return null;
    return {
      x0: minX * advance,
      x1: (maxX + 1) * advance,
      cy: ((minY + maxY + 1) / 2) * cellSize,
      halfH: ((maxY - minY + 1) / 2) * cellSize,
    };
  }, [enterMask, cols, rows, advance, cellSize]);

  if (!entering) {
    const exitStyle: React.CSSProperties = {
      opacity: interpolate(p, exitWindow, [1, 0], clampOpts),
      filter: `blur(${interpolate(p, [exitWindow[0], exitWindow[1] + 0.06], [0, 8], clampOpts)}px)`,
    };
    return <AbsoluteFill style={exitStyle}>{children}</AbsoluteFill>;
  }

  // -------------------------------------------------------------------------
  // Envelopes.
  // -------------------------------------------------------------------------
  // Generic mode keeps the original flat envelopes; text mode staggers the
  // rise and the dissolve per cell instead, so nothing moves as one plane.
  const coverage = textMode
    ? 1
    : interpolate(p, [0.06, 0.28, 0.6, 0.9], [0, 1, 1, 0], clampOpts);
  const fieldOpacity = textMode
    ? 1
    : interpolate(p, [0.04, 0.2, 0.66, 0.94], [0, 1, 1, 0], clampOpts);
  const panelOpacity = textMode
    ? interpolate(p, [0.06, 0.24, 0.55, 0.75], [0, 1, 1, 0], clampOpts)
    : fieldOpacity;

  // Text-mode phase clocks. The outgoing scene blurs out as the field
  // rises; the field boils, then dissolves cell by cell while the real
  // text fades in.
  const riseG = interpolate(p, [0.04, 0.3], [0, 1], clampOpts);
  const dissolveG = interpolate(
    p,
    enterStyle === "clearing" ? [0.52, 0.85] : [0.5, 0.82],
    [0, 1],
    clampOpts,
  );

  // Style clocks for the arriving text's surroundings.
  const haloG = interpolate(p, [0.52, 0.74], [0, 1], clampOpts);
  const waveT = interpolate(p, [0.56, 0.94], [0, 1], {
    ...clampOpts,
    easing: Easing.out(Easing.quad),
  });
  const waveR = waveT * 860; //  the impulse front, px from the text capsule
  const echoFlash = interpolate(p, [0.56, 0.64, 0.82], [0, 0.9, 0], clampOpts);
  const focusBlur = interpolate(p, [0.55, 0.9], [0, 4], clampOpts);
  const focusFade = interpolate(p, [0.62, 0.94], [1, 0], clampOpts);

  const cx = cols / 2;
  const cy = rows / 2;
  const t = p * 5;
  const rampLen = ramp.length;

  const mainRows: string[] = [];
  const accentRows: string[] = [];
  const echoRows: string[] = [];
  const fieldAlive = textMode ? p < 0.999 : fieldOpacity > 0.001;

  if (fieldAlive) {
    for (let y = 0; y < rows; y++) {
      let mainRow = "";
      let accentRow = "";
      let echoRow = "";
      for (let x = 0; x < cols; x++) {
        // A slow sinusoid flow plus per-cell jitter — organic, but textual.
        const base =
          0.5 +
          (Math.sin(x * 0.33 + t * 1.7) +
            Math.sin(y * 0.51 - t * 1.2) +
            Math.sin((x * 0.5 + y) * 0.24 + t * 0.9) +
            Math.sin(Math.hypot(x - cx, (y - cy) * 1.8) * 0.42 - t * 2.1)) /
            8;
        const jitter = random(`ascii-${x}-${y}`);

        // Distance to the incoming text's capsule, for the zone styles —
        // and the plain circular distance from its center, for the wave.
        let dist = Infinity;
        let distC = Infinity;
        let s = 0; // proximity, 1 at the text's center line → 0 far away
        if (enterZone !== null) {
          const px = (x + 0.5) * advance;
          const py = (y + 0.5) * cellSize;
          const nx = Math.min(Math.max(px, enterZone.x0), enterZone.x1);
          dist = Math.hypot(px - nx, py - enterZone.cy);
          distC = Math.hypot(
            px - (enterZone.x0 + enterZone.x1) / 2,
            py - enterZone.cy,
          );
          s = Math.max(0, 1 - dist / (enterZone.halfH + 64));
        }

        let cellCoverage: number;
        if (!textMode) {
          cellCoverage = coverage;
        } else if (enterStyle === "clearing" && enterZone !== null) {
          // Dissolve order biased by proximity: cells near the headline
          // vanish first, a granular cavity opens outward.
          const order = (1 - s) * 0.6 + random(`ascii-d-${x}-${y}`) * 0.4;
          const gone = Math.max(
            0,
            Math.min(1, (dissolveG * 1.35 - order) / 0.3),
          );
          cellCoverage = stagger(riseG, jitter) * (1 - gone);
        } else if (enterStyle === "wave" && enterZone !== null) {
          // The impulse front — a CIRCLE from the text's center — clears
          // the field behind it.
          const passed = Math.max(0, Math.min(1, (waveR - distC) / 55));
          cellCoverage = stagger(riseG, jitter) * (1 - passed);
        } else {
          cellCoverage =
            stagger(riseG, jitter) *
            (1 - stagger(dissolveG, random(`ascii-d-${x}-${y}`)));
        }

        let d = Math.max(
          0,
          Math.min(
            0.999,
            (base * 0.72 + jitter * 0.28) * cellCoverage * 1.2 - 0.08,
          ),
        );
        if (enterStyle === "halo" && enterZone !== null) {
          // A smooth radial attenuation: near cells slide down the ramp.
          d *= 1 - haloG * s;
        }
        if (enterStyle === "wave" && enterZone !== null && waveT > 0) {
          // Cells on the circular wavefront jump up the ramp for a beat.
          const bump = Math.exp(-(((distC - waveR) / 55) ** 2));
          d = Math.min(0.999, d + bump * 0.5);
        }
        const ch = ramp[Math.floor(d * rampLen)] ?? " ";
        const isAccent =
          accentColor !== undefined &&
          random(`ascii-a-${x}-${y}`) < accentDensity;
        mainRow += isAccent ? " " : ch;
        accentRow += isAccent ? ch : " ";

        // The lime echo: a sparse ring of accent glyphs around the headline.
        if (
          enterStyle === "lime-echo" &&
          enterZone !== null &&
          echoFlash > 0.01 &&
          dist > 8 &&
          dist < 84 &&
          ch !== " " &&
          random(`ascii-e-${x}-${y}`) < 0.5
        ) {
          echoRow += ch;
        } else {
          echoRow += " ";
        }
      }
      mainRows.push(mainRow);
      accentRows.push(accentRow);
      echoRows.push(echoRow);
    }
  }

  // The blur must hit exactly 0 by p = 1: the entering presentation stays
  // mounted at p = 1 for the whole scene, so any residue would soften the
  // incoming scene permanently. In text mode the incoming scene resolves
  // with NO transform at all — it must sit pixel-exact under the letterform.
  const enterBlur = textMode
    ? 0
    : interpolate(
        p,
        [enterWindow[0], Math.min(1, enterWindow[1] + 0.05)],
        [10, 0],
        clampOpts,
      );
  const childStyle: React.CSSProperties = textMode
    ? { opacity: interpolate(p, enterWindow, [0, 1], clampOpts) }
    : {
        opacity: interpolate(p, enterWindow, [0, 1], clampOpts),
        transform: `scale(${interpolate(p, [enterWindow[0], 1], [1.04, 1], {
          ...clampOpts,
          easing: Easing.out(Easing.cubic),
        })})`,
        filter: enterBlur > 0.01 ? `blur(${enterBlur}px)` : undefined,
      };

  const preStyle: React.CSSProperties = {
    margin: 0,
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    whiteSpace: "pre",
    fontFamily,
    fontSize,
    lineHeight: `${cellSize}px`,
    color: colorFront,
  };

  const renderLayer = (
    layerRows: string[],
    color: string,
    layerOpacity: number,
  ) =>
    layerOpacity > 0.001 ? (
      <pre style={{ ...preStyle, color, opacity: layerOpacity }}>
        {layerRows.join("\n")}
      </pre>
    ) : null;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={childStyle}>{children}</AbsoluteFill>
      {fieldAlive ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <AbsoluteFill
            style={{ background: colorBack, opacity: panelOpacity }}
          />
          <AbsoluteFill
            style={
              enterStyle === "focus" && textMode
                ? {
                    opacity: focusFade,
                    filter:
                      focusBlur > 0.01 ? `blur(${focusBlur}px)` : undefined,
                  }
                : undefined
            }
          >
            {renderLayer(mainRows, colorFront, fieldOpacity)}
            {accentColor !== undefined
              ? renderLayer(accentRows, accentColor, fieldOpacity)
              : null}
          </AbsoluteFill>
          {enterStyle === "lime-echo"
            ? renderLayer(echoRows, accentColor ?? "#C3E88D", echoFlash)
            : null}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export function asciiDissolve(
  props: AsciiDissolveProps = {},
): TransitionPresentation<AsciiDissolveProps> {
  return {
    component: AsciiDissolvePresentation,
    props,
  };
}
