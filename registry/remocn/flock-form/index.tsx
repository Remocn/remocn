"use client";

import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface FlockFormProps {
  /** Number of birds. Formations resample to match. */
  count?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const FORM1 = 18;
const STAGGER = 18;
const FLY_IN = 28;
const LAUNCH = 74;
const RELEASE = 24;
const CRUISE = 20;
const FLY_IN2 = 28;
const HOLD = 32;
const PATH_PX = 1100;

export const flockFormLength = () =>
  LAUNCH + RELEASE + 2 + CRUISE + FLY_IN2 + HOLD;

const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const HEADING = -Math.PI / 4;

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface Pt {
  x: number;
  y: number;
}

/* The remocn.dev "R" mark (viewBox 124.06 × 134.26), flattened once into a
   polygon so the formation can be sampled without the DOM. */
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const MARK_BOX = { x: 0, y: 0, w: 124.06, h: 134.26 };
/* Lead birds (the arrow tip) land on the R's leg, then fade to ink. */
const LEG = { x: 96, y: 116 };

function flattenPath(d: string): Pt[] {
  const tok = d.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  const out: Pt[] = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  const num = () => Number(tok[i++]);
  while (i < tok.length) {
    if (/^[MCLZ]$/.test(tok[i])) cmd = tok[i++];
    if (cmd === "Z") break;
    if (cmd === "M" || cmd === "L") {
      x = num();
      y = num();
      out.push({ x, y });
    } else if (cmd === "C") {
      const x1 = num();
      const y1 = num();
      const x2 = num();
      const y2 = num();
      const x3 = num();
      const y3 = num();
      for (let k = 1; k <= 12; k++) {
        const t = k / 12;
        const m = 1 - t;
        out.push({
          x:
            m * m * m * x +
            3 * m * m * t * x1 +
            3 * m * t * t * x2 +
            t * t * t * x3,
          y:
            m * m * m * y +
            3 * m * m * t * y1 +
            3 * m * t * t * y2 +
            t * t * t * y3,
        });
      }
      x = x3;
      y = y3;
    }
  }
  return out;
}

const R_POLY = flattenPath(REMOCN_R_PATH);

function inPoly(poly: Pt[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

function inMark(x: number, y: number): "ink" | "dot" | null {
  if (!inPoly(R_POLY, x, y)) return null;
  return y > 96 && x > 66 ? "dot" : "ink";
}

function inArrow(x: number, y: number): boolean {
  // Arrow pointing +x in a unit box: shaft then head.
  if (x >= 0 && x <= 0.56 && Math.abs(y) <= 0.11) return true;
  if (x >= 0.5 && x <= 1) {
    const half = 0.36 * (1 - (x - 0.5) / 0.5);
    return Math.abs(y) <= half;
  }
  return false;
}

function hexSample(
  test: (x: number, y: number) => boolean,
  box: { x: number; y: number; w: number; h: number },
  n: number,
): { pts: Pt[]; spacing: number } {
  const grid = (s: number) => {
    const out: Pt[] = [];
    const rowH = s * 0.866;
    let row = 0;
    for (let y = box.y + rowH / 2; y < box.y + box.h; y += rowH, row++) {
      const off = row % 2 ? s / 2 : 0;
      for (let x = box.x + off + s / 2; x < box.x + box.w; x += s) {
        if (test(x, y)) out.push({ x, y });
      }
    }
    return out;
  };
  let lo = 0.001;
  let hi = Math.max(box.w, box.h);
  for (let it = 0; it < 28; it++) {
    const mid = (lo + hi) / 2;
    if (grid(mid).length >= n) lo = mid;
    else hi = mid;
  }
  const pts = grid(lo);
  const picked: Pt[] = [];
  for (let j = 0; j < n; j++) {
    picked.push(pts[Math.floor(((j + 0.5) * pts.length) / n)] ?? pts[0]);
  }
  return { pts: picked, spacing: lo };
}

function hilbert(x: number, y: number, order = 64): number {
  let d = 0;
  let px = x;
  let py = y;
  for (let s = order / 2; s >= 1; s = Math.floor(s / 2)) {
    const rx = (px & s) > 0 ? 1 : 0;
    const ry = (py & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        px = s - 1 - px;
        py = s - 1 - py;
      }
      const t = px;
      px = py;
      py = t;
    }
  }
  return d;
}

function hilbertOrder(pts: Pt[], idx: number[]): number[] {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const i of idx) {
    minX = Math.min(minX, pts[i].x);
    minY = Math.min(minY, pts[i].y);
    maxX = Math.max(maxX, pts[i].x);
    maxY = Math.max(maxY, pts[i].y);
  }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  return idx
    .map((i) => ({
      i,
      h: hilbert(
        Math.min(63, Math.floor(((pts[i].x - minX) / span) * 64)),
        Math.min(63, Math.floor(((pts[i].y - minY) / span) * 64)),
      ),
    }))
    .sort((a, b) => a.h - b.h)
    .map((m) => m.i);
}

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Deterministic boids: returns positions per frame, frames [0, steps]. */
function flock(
  init: Boid[],
  steps: number,
  leader: (i: number, f: number) => Pt,
  u: number,
  top = 6.4,
  held: (i: number, f: number) => boolean = () => false,
  cohesion = 0.0035,
): Pt[][] {
  const n = init.length;
  const b = init.map((p) => ({ ...p }));
  const out: Pt[][] = [b.map((p) => ({ x: p.x, y: p.y }))];
  const rN = 64 * u;
  const rS = 15 * u;
  const vMin = 2.4 * u;
  const vMax = top * u;
  for (let f = 1; f <= steps; f++) {
    const ax = new Float64Array(n);
    const ay = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const p = b[i];
      if (held(i, f)) continue;
      const L = leader(i, f);
      let cnt = 0;
      let sx = 0;
      let sy = 0;
      let svx = 0;
      let svy = 0;
      let px = 0;
      let py = 0;
      for (let j = 0; j < n; j++) {
        if (j === i || held(j, f)) continue;
        const q = b[j];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > rN * rN) continue;
        cnt++;
        sx += q.x;
        sy += q.y;
        svx += q.vx;
        svy += q.vy;
        if (d2 < rS * rS && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const k = (rS - d) / rS / d;
          px -= dx * k;
          py -= dy * k;
        }
      }
      if (cnt) {
        ax[i] += (svx / cnt - p.vx) * 0.07;
        ay[i] += (svy / cnt - p.vy) * 0.07;
        ax[i] += (sx / cnt - p.x) * cohesion;
        ay[i] += (sy / cnt - p.y) * cohesion;
      }
      ax[i] += px * 0.9 * u;
      ay[i] += py * 0.9 * u;
      const lx = L.x - p.x;
      const ly = L.y - p.y;
      const ld = Math.hypot(lx, ly) || 1;
      ax[i] += ((lx / ld) * vMax - p.vx) * 0.035;
      ay[i] += ((ly / ld) * vMax - p.vy) * 0.035;
    }
    for (let i = 0; i < n; i++) {
      const p = b[i];
      if (held(i, f)) continue;
      p.vx += ax[i];
      p.vy += ay[i];
      const sp = Math.hypot(p.vx, p.vy) || 1;
      const k = Math.min(vMax, Math.max(vMin, sp)) / sp;
      p.vx *= k;
      p.vy *= k;
      p.x += p.vx;
      p.y += p.vy;
    }
    out.push(b.map((p) => ({ x: p.x, y: p.y })));
  }
  return out;
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function Grain({ opacity, light }: { opacity: number; light: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={`${uid}-grain`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.85}
          numOctaves={2}
          seed={5}
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"
        />
      </filter>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${uid}-grain)`}
        opacity={opacity}
        style={{ mixBlendMode: light ? "multiply" : "screen" }}
      />
    </svg>
  );
}

/* gradients.sh "waves" palette: a dusk sky behind the flock (dark), or the
   fill of the birds themselves on the off-white stage (light). */
const WAVES = {
  bg: "#05070d",
  colors: ["#a9c1df", "#5479b0", "#24467e", "#0f1c38"],
} as const;

function skyGround(d: number) {
  const [c0, c1, c2, c3] = WAVES.colors;
  return `linear-gradient(${(172 - 3 * d).toFixed(2)}deg, ${WAVES.bg} 0%, ${c3} 30%, ${c2} 66%, ${c1} 90%, ${c0} 112%)`;
}

function tri(x: number, y: number, a: number, len: number, wid: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const tx = x + c * len * 0.62;
  const ty = y + s * len * 0.62;
  const bx = x - c * len * 0.38;
  const by = y - s * len * 0.38;
  const ox = -s * wid * 0.5;
  const oy = c * wid * 0.5;
  return `M${tx.toFixed(1)} ${ty.toFixed(1)}L${(bx + ox).toFixed(1)} ${(by + oy).toFixed(1)}L${(bx - ox).toFixed(1)} ${(by - oy).toFixed(1)}Z`;
}

export function FlockForm({
  count = 340,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: FlockFormProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const isLight = theme === "light";
  const bg = isLight ? "#F5F4F0" : "#0A0A0B";
  const ink = isLight ? "#141416" : "#EEEEF0";
  const n = Math.max(120, Math.round(count));
  const u = Math.min(W, H) / 720;

  const model = useMemo(() => {
    const cx = W / 2;
    const cy = H / 2;

    // Mark targets.
    const markH = H * 0.54;
    const ms = markH / MARK_BOX.h;
    const mark = hexSample((x, y) => inMark(x, y) !== null, MARK_BOX, n);
    const markPts = mark.pts.map((p) => ({
      x: cx + (p.x - (MARK_BOX.x + MARK_BOX.w / 2)) * ms,
      y: cy + (p.y - (MARK_BOX.y + MARK_BOX.h / 2)) * ms,
      dot: inMark(p.x, p.y) === "dot",
    }));
    const spacing = mark.spacing * ms;
    const dotIdx = markPts.flatMap((p, i) => (p.dot ? [i] : []));
    const inkIdx = markPts.flatMap((p, i) => (p.dot ? [] : [i]));
    const nDot = dotIdx.length;

    // Arrow targets, rotated to point up-right.
    const arrowLen = H * 0.62;
    const arrow = hexSample(inArrow, { x: 0, y: -0.4, w: 1, h: 0.8 }, n);
    const ca = Math.cos(HEADING);
    const sa = Math.sin(HEADING);
    const arrowPts = arrow.pts.map((p) => {
      const lx = (p.x - 0.5) * arrowLen;
      const ly = p.y * arrowLen;
      return {
        x: cx + lx * ca - ly * sa,
        y: cy + lx * sa + ly * ca,
        t: p.x,
        side: p.y,
      };
    });

    // Flight 1: the flock sweeps in from the lower left.
    const init: Boid[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(hash(i * 3.1)) * H * 0.23;
      const th = hash(i * 7.9) * Math.PI * 2;
      const front = i < nDot ? H * 0.12 : 0;
      init.push({
        x: W * 0.24 + Math.cos(th) * r * 1.6 + front,
        y: H * 0.66 + Math.sin(th) * r * 0.75 - front * 0.4,
        vx: (4.2 + hash(i * 1.7)) * u,
        vy: (-1.6 + hash(i * 2.3) * 0.8) * u,
      });
    }
    const lead1 = (f: number) => {
      const k = f / (FORM1 + STAGGER + FLY_IN);
      return {
        x: W * (0.3 + 0.55 * k),
        y: H * (0.62 - 0.5 * Math.sin(k * Math.PI * 0.75)),
      };
    };
    const free1 = flock(init, FORM1 + STAGGER + FLY_IN, (_, f) => lead1(f), u);

    // Assign arrow targets: accent birds take the tip, the rest by Hilbert order.
    const tipOrder = arrowPts
      .map((p, i) => ({ i, t: p.t }))
      .sort((a, b) => b.t - a.t)
      .map((m) => m.i);
    const arrowOf: number[] = new Array(n);
    const tip = tipOrder.slice(0, nDot);
    const restT = tipOrder.slice(nDot);
    const atForm = free1[FORM1 + 8];
    tip.forEach((ti, k) => {
      arrowOf[k] = ti;
    });
    const birdsRest = hilbertOrder(
      atForm,
      Array.from({ length: n - nDot }, (_, k) => k + nDot),
    );
    const targRest = hilbertOrder(arrowPts, restT);
    birdsRest.forEach((bi, k) => {
      arrowOf[bi] = targRest[k];
    });

    // Flight 2: the arrow peels off from the tip as one ribbon, loops right
    // and streams back into the mark, the accent birds leading into the dot.
    const release = arrowOf.map(
      (ti, i) => (1 - arrowPts[ti].t) * RELEASE + hash(i * 5.3) * 2,
    );
    const P = [
      { x: cx + 0.3 * H, y: cy - 0.3 * H },
      { x: cx + 0.56 * H, y: cy - 0.5 * H },
      { x: cx + 0.86 * H, y: cy + 0.1 * H },
      { x: cx + 0.34 * H, y: cy + 0.24 * H },
    ];
    const path = (k: number) => {
      const t = Math.min(1, Math.max(0, k));
      const m = 1 - t;
      return {
        x:
          m * m * m * P[0].x +
          3 * m * m * t * P[1].x +
          3 * m * t * t * P[2].x +
          t * t * t * P[3].x,
        y:
          m * m * m * P[0].y +
          3 * m * m * t * P[1].y +
          3 * m * t * t * P[2].y +
          t * t * t * P[3].y,
      };
    };
    // Mark: birds in release order fill outward from the dot.
    const dotC = {
      x: cx + (LEG.x - (MARK_BOX.x + MARK_BOX.w / 2)) * ms,
      y: cy + (LEG.y - (MARK_BOX.y + MARK_BOX.h / 2)) * ms,
    };
    const byDist = (idx: number[]) =>
      [...idx].sort(
        (a, b) =>
          Math.hypot(markPts[a].x - dotC.x, markPts[a].y - dotC.y) -
          Math.hypot(markPts[b].x - dotC.x, markPts[b].y - dotC.y),
      );
    const markOf: number[] = new Array(n);
    const accBirds = Array.from({ length: nDot }, (_, k) => k).sort(
      (a, b) => release[a] - release[b],
    );
    const dotT = byDist(dotIdx);
    accBirds.forEach((bi, k) => {
      markOf[bi] = dotT[k];
    });
    const inkBirds = Array.from({ length: n - nDot }, (_, k) => k + nDot).sort(
      (a, b) => release[a] - release[b],
    );
    const inkT = byDist(inkIdx);
    inkBirds.forEach((bi, k) => {
      markOf[bi] = inkT[k];
    });

    const delay1 = arrowOf.map(
      (ti, i) => (1 - arrowPts[ti].t) * STAGGER * 0.85 + hash(i * 5.3) * 3,
    );
    const delay2 = release.map((r) => r + CRUISE);

    return {
      arrowPts,
      markPts,
      arrowOf,
      markOf,
      free1,
      path,
      release,
      arrowLen,
      delay1,
      delay2,
      nDot,
      spacing,
    };
  }, [W, H, n, u]);

  const posAt = (i: number, f: number): Pt => {
    const m = model;
    if (f < LAUNCH) {
      const fr = Math.max(0, Math.min(m.free1.length - 1, f));
      const f0 = Math.floor(fr);
      const a = m.free1[f0][i];
      const b = m.free1[Math.min(m.free1.length - 1, f0 + 1)][i];
      const k = fr - f0;
      const fx = a.x + (b.x - a.x) * k;
      const fy = a.y + (b.y - a.y) * k;
      const w = INOUT(
        Math.max(0, Math.min(1, (f - FORM1 - m.delay1[i]) / FLY_IN)),
      );
      const t = m.arrowPts[m.arrowOf[i]];
      return { x: fx + (t.x - fx) * w, y: fy + (t.y - fy) * w };
    }
    const home = m.arrowPts[m.arrowOf[i]];
    const tau = f - LAUNCH;
    const rel = tau - m.release[i];
    // Before release the whole arrow eases forward along its heading.
    const drift = (tt: number) => 0.2 * u * Math.max(0, tt) ** 2;
    const held = drift(Math.min(tau, m.release[i]));
    const sx = home.x + Math.cos(HEADING) * held;
    const sy = home.y + Math.sin(HEADING) * held;
    let fx = sx;
    let fy = sy;
    if (rel > 0) {
      const v0 = 0.4 * u * m.release[i];
      const k = Math.min(1, (rel * (22 * u + v0 * 0.5)) / (PATH_PX * u));
      const pa = m.path(k);
      const pb = m.path(k + 0.01);
      const tl = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
      const off = home.side * m.arrowLen * 1.3;
      const px = pa.x - ((pb.y - pa.y) / tl) * off;
      const py = pa.y + ((pb.x - pa.x) / tl) * off;
      const p0 = m.path(0);
      const q0 = m.path(0.01);
      const t0 = Math.hypot(q0.x - p0.x, q0.y - p0.y) || 1;
      const ex = sx - (p0.x - ((q0.y - p0.y) / t0) * off);
      const ey = sy - (p0.y + ((q0.x - p0.x) / t0) * off);
      const keep = 1 - INOUT(Math.min(1, rel / 14));
      fx = px + ex * keep;
      fy = py + ey * keep;
    }
    const w = INOUT(
      Math.max(0, Math.min(1, (f - LAUNCH - m.delay2[i]) / FLY_IN2)),
    );
    const t = m.markPts[m.markOf[i]];
    return { x: fx + (t.x - fx) * w, y: fy + (t.y - fy) * w };
  };

  const settle1 = (i: number, f: number) =>
    f >= LAUNCH
      ? 0
      : Math.max(0, Math.min(1, (f - FORM1 - model.delay1[i]) / FLY_IN));
  const settle2 = (i: number, f: number) =>
    f < LAUNCH
      ? 0
      : Math.max(0, Math.min(1, (f - LAUNCH - model.delay2[i]) / FLY_IN2));

  const len = model.spacing * 0.92;
  const wid = model.spacing * 0.58;
  const FADES = 5;
  const inkD: string[] = [];
  const accD: string[][] = Array.from({ length: FADES }, () => []);
  for (let i = 0; i < n; i++) {
    const p = posAt(i, frame);
    const q = posAt(i, frame - 1);
    const vx = p.x - q.x;
    const vy = p.y - q.y;
    const moving = Math.hypot(vx, vy) > 0.05 * u;
    const vel = moving ? Math.atan2(vy, vx) : HEADING;
    const s = Math.max(settle1(i, frame), settle2(i, frame));
    const a = lerpAngle(vel, HEADING, s ** 2);
    const d = tri(p.x, p.y, a, len, wid);
    if (i < model.nDot) {
      // Lead birds stay accent in flight and settle into the mark's ink.
      const k = Math.round(settle2(i, frame) ** 2 * (FADES - 1));
      if (k >= FADES - 1) inkD.push(d);
      else accD[k].push(d);
    } else inkD.push(d);
  }

  const gid = `ff${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const drift = Math.min(1, frame / flockFormLength());
  const birdFill = isLight ? `url(#${gid})` : ink;

  return (
    <AbsoluteFill
      style={{
        background: isLight
          ? `radial-gradient(80% 75% at 50% 45%, #FBFAF7 0%, ${bg} 72%)`
          : skyGround(drift),
        overflow: "hidden",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gid}
            gradientUnits="userSpaceOnUse"
            x1={W * (0.46 + 0.04 * drift)}
            y1={H * 0.1}
            x2={W * (0.54 - 0.04 * drift)}
            y2={H * 0.92}
          >
            <stop offset="0" stopColor={WAVES.colors[3]} />
            <stop offset="0.45" stopColor={WAVES.colors[2]} />
            <stop offset="1" stopColor={WAVES.colors[1]} />
          </linearGradient>
        </defs>
        <path d={inkD.join("")} fill={birdFill} />
        {accD.map((segs, k) =>
          segs.length ? (
            <path
              key={`a${k.toString()}`}
              d={segs.join("")}
              fill={interpolateColors(
                k / (FADES - 1),
                [0, 1],
                [accent, isLight ? WAVES.colors[2] : ink],
              )}
            />
          ) : null,
        )}
      </svg>
      <Grain opacity={isLight ? 0.045 : 0.06} light={isLight} />
    </AbsoluteFill>
  );
}
