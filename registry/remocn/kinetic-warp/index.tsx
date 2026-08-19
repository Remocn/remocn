"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export interface KineticWarpProps {
  className?: string;
  compWidth?: number;
  compHeight?: number;
  textColor?: string;
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  fontWeight?: number;
  fontSize?: number;
  leading?: number;
  tracking?: number;
  layerScale?: number;
  positionX?: number;
  positionY?: number;
  meshRows?: number;
  meshColumns?: number;
  colRestX?: number;
  colRightX?: number;
  colLeftX?: number;
  rowRestY?: number;
  rowDownY?: number;
  rowUpY?: number;
  keyframeStride?: number;
  easingBezier?: [number, number, number, number];
  resampleStep?: number;
}

function monotoneSpline(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length;
  const dx: number[] = [];
  const secant: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    secant.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }

  const m: number[] = new Array(n);
  m[0] = secant[0];
  m[n - 1] = secant[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = secant[i - 1] * secant[i] <= 0 ? 0 : (secant[i - 1] + secant[i]) / 2;
  }

  for (let i = 0; i < n - 1; i++) {
    if (secant[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / secant[i];
    const b = m[i + 1] / secant[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * secant[i];
      m[i + 1] = t * b * secant[i];
    }
  }

  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = n - 2;
    while (i > 0 && x < xs[i]) i--;
    const h = dx[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

export function KineticWarp({
  className,
  compWidth = 1920,
  compHeight = 1080,
  textColor = "#FFFFFF",
  text = "REM\nOCN",
  fontFamily = "sans-serif",
  fontUrl = "",
  fontWeight = 700,
  fontSize = 107.1,
  leading = 70,
  tracking = -21,
  layerScale = 480,
  positionX = 960,
  positionY = 540,
  meshRows = 2,
  meshColumns = 4,
  colRestX = 960,
  colRightX = 1255,
  colLeftX = 678,
  rowRestY = 540,
  rowDownY = 850,
  rowUpY = 387,
  keyframeStride = 20,
  easingBezier = [0.3, 0.74, 0.09, 1],
  resampleStep = 4,
}: KineticWarpProps) {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fontReady, setFontReady] = useState(false);

  const scale = layerScale / 100;
  const pxSize = fontSize * scale;
  const pxLeading = leading * scale;
  const pxTracking = (tracking / 1000) * pxSize;

  useEffect(() => {
    const handle = delayRender("kinetic-warp: loading font");
    let cancelled = false;
    const done = () => {
      if (!cancelled) setFontReady(true);
      continueRender(handle);
    };
    if (typeof document === "undefined" || !document.fonts) {
      done();
      return;
    }
    document.fonts
      .load(`${fontWeight} ${pxSize}px "${fontFamily}"`)
      .then(done, done);
    return () => {
      cancelled = true;
    };
  }, [fontFamily, fontWeight, pxSize]);

  const source = useMemo(() => {
    if (!fontReady || typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = compWidth;
    canvas.height = compHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.font = `${fontWeight} ${pxSize}px "${fontFamily}", sans-serif`;
    ctx.letterSpacing = `${pxTracking}px`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const lines = text.split("\n");
    const metrics = lines.map((line) => ctx.measureText(line));

    const ascent = metrics[0].actualBoundingBoxAscent;
    const descent = metrics[metrics.length - 1].actualBoundingBoxDescent;
    const span = (lines.length - 1) * pxLeading;
    const firstBaseline = positionY - (span - ascent + descent) / 2;

    lines.forEach((line, i) => {
      const m = metrics[i];
      const x =
        positionX - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
      ctx.fillText(line, x, firstBaseline + i * pxLeading);
    });

    return canvas;
  }, [
    compWidth,
    compHeight,
    text,
    fontFamily,
    fontWeight,
    pxSize,
    pxLeading,
    pxTracking,
    textColor,
    positionX,
    positionY,
    fontReady,
  ]);

  const scratch = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = compWidth;
    canvas.height = compHeight;
    return canvas;
  }, [compWidth, compHeight]);

  const easing = Easing.bezier(...easingBezier);
  const stops = [0, 1, 2, 3, 4, 5].map((i) => i * keyframeStride);
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  } as const;

  const colX = interpolate(
    frame,
    stops,
    [colRestX, colRightX, colRightX, colLeftX, colLeftX, colRestX],
    clamp,
  );
  const rowY = interpolate(
    frame,
    stops,
    [rowRestY, rowRestY, rowDownY, rowDownY, rowUpY, rowRestY],
    clamp,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source || !scratch) return;
    const out = canvas.getContext("2d");
    const mid = scratch.getContext("2d");
    if (!out || !mid) return;

    const xs = Array.from(
      { length: meshColumns + 1 },
      (_, i) => (i * compWidth) / meshColumns,
    );
    const ys = Array.from(
      { length: meshRows + 1 },
      (_, i) => (i * compHeight) / meshRows,
    );
    const xd = xs.slice();
    const yd = ys.slice();
    xd[Math.round(meshColumns / 2)] = colX;
    yd[Math.round(meshRows / 2)] = rowY;

    const gx = monotoneSpline(xd, xs);
    const gy = monotoneSpline(yd, ys);

    mid.clearRect(0, 0, compWidth, compHeight);
    out.clearRect(0, 0, compWidth, compHeight);

    for (let d0 = 0; d0 < compWidth; d0 += resampleStep) {
      const d1 = Math.min(d0 + resampleStep, compWidth);
      const s0 = gx(d0);
      const sw = gx(d1) - s0;
      if (sw <= 0) continue;
      mid.drawImage(source, s0, 0, sw, compHeight, d0, 0, d1 - d0, compHeight);
    }

    for (let d0 = 0; d0 < compHeight; d0 += resampleStep) {
      const d1 = Math.min(d0 + resampleStep, compHeight);
      const s0 = gy(d0);
      const sh = gy(d1) - s0;
      if (sh <= 0) continue;
      out.drawImage(scratch, 0, s0, compWidth, sh, 0, d0, compWidth, d1 - d0);
    }
  }, [
    source,
    scratch,
    colX,
    rowY,
    compWidth,
    compHeight,
    meshRows,
    meshColumns,
    resampleStep,
  ]);

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {fontUrl ? <link rel="stylesheet" href={fontUrl} /> : null}
      <canvas
        ref={canvasRef}
        width={compWidth}
        height={compHeight}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
