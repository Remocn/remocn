"use client";

import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ClothRevealDirection = "right" | "left" | "up" | "down";

export type ClothRevealProps = {
  /** Content hidden under the sheet. Falls back to a placeholder "remocn" lockup. */
  children?: React.ReactNode;
  clothColor?: string;
  /** Underside tint, seen where the sheet folds over. */
  undersideColor?: string;
  /** Background behind the children. */
  background?: string;
  /** Which way the sheet is yanked. */
  direction?: ClothRevealDirection;
  /** Frame (at 30fps) when the tug starts. */
  delay?: number;
  seed?: number;
  speed?: number;
};

export const clothRevealDefaults = {
  clothColor: "#E5322D",
  undersideColor: "#8E1A16",
  background: "#111111",
  direction: "right" as ClothRevealDirection,
  delay: 6,
  seed: 2,
  speed: 1,
};

const COLS = 40;
const ROWS = 24;
const FRAMES = 72;
const SUBSTEPS = 5;
const ITERATIONS = 12;

type Sim = { frames: Float32Array[]; heights: Float32Array };

const PATHS: Record<
  ClothRevealDirection,
  { corner: [number, number]; dir: [number, number] }
> = {
  right: { corner: [1, 0], dir: [1, -0.32] },
  left: { corner: [0, 0], dir: [-1, -0.32] },
  up: { corner: [1, 0], dir: [0.4, -1] },
  down: { corner: [0, 1], dir: [-0.4, 1] },
};

const smooth = (v: number) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

// Verlet cloth in table space: x/y on the table, z up toward the camera. The
// sheet rests on a soft bump (whatever it hides) with seeded wrinkles baked
// into its rest shape, so frame 0 is already at equilibrium.
function simulate(
  width: number,
  height: number,
  direction: ClothRevealDirection,
  delay: number,
  seed: number,
): Sim {
  const n = COLS * ROWS;
  const pos = new Float64Array(n * 3);
  const prev = new Float64Array(n * 3);
  const floorZ = new Float64Array(n);
  const pinned = new Uint8Array(n);
  const unit = Math.min(width, height);
  const bump = (x: number, y: number) => {
    const dx = (x - width / 2) / (width * 0.3);
    const dy = (y - height / 2) / (height * 0.34);
    return unit * 0.09 * Math.exp(-(dx * dx + dy * dy) * 1.4);
  };
  // Folds radiate from the hidden object and deepen toward the hem, plus a
  // couple of long soft waves so the sheet never looks ironed.
  const folds = 7 + Math.floor(random(`cloth-${seed}-n`) * 4);
  const twist = random(`cloth-${seed}-t`) * Math.PI * 2;
  const waves = [0, 1].map((k) => ({
    a: random(`cloth-${seed}-a${k}`) * Math.PI,
    f: 0.8 + random(`cloth-${seed}-f${k}`) * 1.2,
    p: random(`cloth-${seed}-p${k}`) * Math.PI * 2,
  }));

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const u = c / (COLS - 1);
      const v = r / (ROWS - 1);
      const x = width * (-0.06 + u * 1.12);
      const y = height * (-0.08 + v * 1.16);
      const dx = (x - width / 2) / width;
      const dy = (y - height / 2) / width;
      const rho = Math.hypot(dx, dy);
      const theta = Math.atan2(dy, dx);
      const radial =
        (0.5 + 0.5 * Math.sin(theta * folds + twist + rho * 9)) ** 1.6 *
        smooth((rho - 0.12) / 0.35);
      let wave = 0;
      for (const w of waves) {
        const s = u * Math.cos(w.a) + v * Math.sin(w.a);
        wave += 0.5 + 0.5 * Math.sin(s * w.f * Math.PI * 2 + w.p);
      }
      floorZ[i] = unit * (0.045 * radial + 0.012 * wave);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = floorZ[i] + bump(x, y);
    }
  }
  prev.set(pos);
  const heights = new Float32Array(n);
  for (let i = 0; i < n; i++) heights[i] = pos[i * 3 + 2];

  const links: number[] = [];
  const add = (a: number, b: number, stiff: number) => {
    const dx = pos[a * 3] - pos[b * 3];
    const dy = pos[a * 3 + 1] - pos[b * 3 + 1];
    const dz = pos[a * 3 + 2] - pos[b * 3 + 2];
    links.push(a, b, Math.hypot(dx, dy, dz), stiff);
  };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      if (c + 1 < COLS) add(i, i + 1, 1);
      if (r + 1 < ROWS) add(i, i + COLS, 1);
      if (c + 1 < COLS && r + 1 < ROWS) {
        add(i, i + COLS + 1, 0.7);
        add(i + 1, i + COLS, 0.7);
      }
      if (c + 2 < COLS) add(i, i + 2, 0.25);
      if (r + 2 < ROWS) add(i, i + COLS * 2, 0.25);
    }
  }

  // The hand pinches a small patch around the corner, not a single vertex.
  const path = PATHS[direction];
  const cc = path.corner[0] * (COLS - 1);
  const cr = path.corner[1] * (ROWS - 1);
  const grip: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (Math.abs(c - cc) + Math.abs(r - cr) <= 3) grip.push(r * COLS + c);
    }
  }
  const gripStart = grip.map((i) => [
    pos[i * 3],
    pos[i * 3 + 1],
    pos[i * 3 + 2],
  ]);
  for (const i of grip) pinned[i] = 1;
  const len = Math.hypot(path.dir[0], path.dir[1]);
  const dir = [path.dir[0] / len, path.dir[1] / len];
  const reach = Math.abs(dir[0]) * width + Math.abs(dir[1]) * height;
  const g = unit * 0.006;
  const dt = 1 / SUBSTEPS;

  const hand = (t: number) => {
    const s = Math.max(0, t - delay);
    // Quick lift, then an accelerating yank that keeps going off-frame.
    const lift = unit * 0.5 * smooth(s / 9);
    const travel =
      s < 30
        ? reach * 1.25 * (s / 30) ** 2
        : reach * 1.25 * (1 + ((s - 30) * 2) / 30);
    return [dir[0] * travel, dir[1] * travel, lift];
  };

  const frames: Float32Array[] = [];
  const record = () => {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) out[i] = pos[i];
    frames.push(out);
  };
  record();

  for (let f = 1; f <= FRAMES; f++) {
    for (let s = 1; s <= SUBSTEPS; s++) {
      const t = f - 1 + s * dt;
      const [hx, hy, hz] = hand(t);
      for (let i = 0; i < n; i++) {
        const k = i * 3;
        if (pinned[i]) continue;
        const z = pos[k + 2];
        const lifted = z - floorZ[i] - bump(pos[k], pos[k + 1]) > 1;
        const drag = lifted ? 0.985 : 0.6;
        const vx = (pos[k] - prev[k]) * drag;
        const vy = (pos[k + 1] - prev[k + 1]) * drag;
        const vz = (pos[k + 2] - prev[k + 2]) * 0.985;
        prev[k] = pos[k];
        prev[k + 1] = pos[k + 1];
        prev[k + 2] = z;
        // Flutter: a travelling ripple that only bites on fast-moving cloth.
        const speedXY = Math.hypot(vx, vy);
        const flutter =
          Math.sin(pos[k] * 0.02 + pos[k + 1] * 0.013 + t * 1.7) *
          speedXY *
          0.06;
        pos[k] += vx;
        pos[k + 1] += vy;
        pos[k + 2] += vz + flutter - g * dt * dt;
      }
      grip.forEach((i, j) => {
        pos[i * 3] = gripStart[j][0] + hx;
        pos[i * 3 + 1] = gripStart[j][1] + hy;
        pos[i * 3 + 2] = gripStart[j][2] + hz;
      });
      for (let it = 0; it < ITERATIONS; it++) {
        for (let l = 0; l < links.length; l += 4) {
          const a = links[l];
          const b = links[l + 1];
          const rest = links[l + 2];
          const stiff = links[l + 3];
          const ka = a * 3;
          const kb = b * 3;
          const dx = pos[kb] - pos[ka];
          const dy = pos[kb + 1] - pos[ka + 1];
          const dz = pos[kb + 2] - pos[ka + 2];
          const d = Math.hypot(dx, dy, dz) || 1e-6;
          const wa = pinned[a] ? 0 : 1;
          const wb = pinned[b] ? 0 : 1;
          if (wa + wb === 0) continue;
          const diff = ((d - rest) / d / (wa + wb)) * stiff;
          pos[ka] += dx * diff * wa;
          pos[ka + 1] += dy * diff * wa;
          pos[ka + 2] += dz * diff * wa;
          pos[kb] -= dx * diff * wb;
          pos[kb + 1] -= dy * diff * wb;
          pos[kb + 2] -= dz * diff * wb;
        }
        for (let i = 0; i < n; i++) {
          const k = i * 3;
          const ground = floorZ[i] + bump(pos[k], pos[k + 1]);
          if (pos[k + 2] < ground) pos[k + 2] = ground;
        }
      }
    }
    record();
  }
  return { frames, heights };
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const v = Number.parseInt(full, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

// Wordmark color for the placeholder: dark ink on light backgrounds.
function placeholderText(background: string): string {
  const [r, g, b] = parseHex(background);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#111111" : "#FFFFFF";
}

const LIGHT = (() => {
  const l = [-0.45, -0.6, 0.75];
  const m = Math.hypot(l[0], l[1], l[2]);
  return l.map((c) => c / m);
})();
const HALF = (() => {
  const h = [LIGHT[0], LIGHT[1], LIGHT[2] + 1];
  const m = Math.hypot(h[0], h[1], h[2]);
  return h.map((c) => c / m);
})();

const PLACEHOLDER_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

// Neutral lockup shown when no children are passed.
function PlaceholderLockup({
  mark,
  dot,
  text,
  scale = 1,
}: {
  mark: string;
  dot: string;
  text: string;
  scale?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 * scale }}>
      <div
        style={{
          width: 120 * scale,
          height: 120 * scale,
          borderRadius: 32 * scale,
          backgroundColor: mark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36 * scale,
            height: 36 * scale,
            borderRadius: "50%",
            backgroundColor: dot,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: PLACEHOLDER_FONT,
          fontSize: 104 * scale,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: text,
        }}
      >
        remocn
      </span>
    </div>
  );
}

export function ClothReveal({
  children,
  clothColor = clothRevealDefaults.clothColor,
  undersideColor = clothRevealDefaults.undersideColor,
  background = clothRevealDefaults.background,
  direction = clothRevealDefaults.direction,
  delay = clothRevealDefaults.delay,
  seed = clothRevealDefaults.seed,
  speed = clothRevealDefaults.speed,
}: ClothRevealProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const uid = `cloth-reveal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const shadowId = `${uid}-shadow`;
  const softenId = `${uid}-soften`;
  const sim = useMemo(
    () => simulate(width, height, direction, delay, seed),
    [width, height, direction, delay, seed],
  );
  const t = Math.min(FRAMES, Math.max(0, (frame * speed * 30) / fps));
  const f0 = Math.floor(t);
  const f1 = Math.min(FRAMES, f0 + 1);
  const mix = t - f0;
  const A = sim.frames[f0];
  const B = sim.frames[f1];

  // Pinhole camera above the table: higher cloth projects larger.
  const camera = Math.max(width, height) * 1.6;
  const cx = width / 2;
  const cy = height / 2;
  const n = COLS * ROWS;
  const world = new Float64Array(n * 3);
  const screen = new Float64Array(n * 2);
  for (let i = 0; i < n * 3; i++) world[i] = A[i] + (B[i] - A[i]) * mix;
  for (let i = 0; i < n; i++) {
    const z = Math.min(world[i * 3 + 2], camera * 0.8);
    const s = camera / (camera - z);
    screen[i * 2] = cx + (world[i * 3] - cx) * s;
    screen[i * 2 + 1] = cy + (world[i * 3 + 1] - cy) * s;
  }

  const front = parseHex(clothColor);
  const back = parseHex(undersideColor);
  // Per-vertex normals from central differences; each quad averages its four
  // corners, which hides the mesh facets.
  const shades = new Float64Array(n * 3);
  const at = (c: number, r: number, k: number) =>
    world[
      (Math.min(ROWS - 1, Math.max(0, r)) * COLS +
        Math.min(COLS - 1, Math.max(0, c))) *
        3 +
        k
    ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ux = at(c + 1, r, 0) - at(c - 1, r, 0);
      const uy = at(c + 1, r, 1) - at(c - 1, r, 1);
      const uz = at(c + 1, r, 2) - at(c - 1, r, 2);
      const vx = at(c, r + 1, 0) - at(c, r - 1, 0);
      const vy = at(c, r + 1, 1) - at(c, r - 1, 1);
      const vz = at(c, r + 1, 2) - at(c, r - 1, 2);
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const m = Math.hypot(nx, ny, nz) || 1;
      const flip = nz < 0 ? -1 : 1;
      nx = (nx / m) * flip;
      ny = (ny / m) * flip;
      nz = (nz / m) * flip;
      const diffuse = Math.max(
        0,
        nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2],
      );
      const spec =
        Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]) ** 36 * 0.28;
      const base = flip < 0 ? back : front;
      const shade = 0.22 + 0.95 * diffuse;
      const i = r * COLS + c;
      for (let k = 0; k < 3; k++) {
        shades[i * 3 + k] = Math.min(255, base[k] * shade + 255 * spec);
      }
    }
  }

  const quads: { d: string; fill: string; z: number; shadow: string | null }[] =
    [];
  const offscreen = (x: number, y: number) =>
    x < -width * 0.1 ||
    x > width * 1.1 ||
    y < -height * 0.1 ||
    y > height * 1.1;

  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const ids = [
        r * COLS + c,
        r * COLS + c + 1,
        (r + 1) * COLS + c + 1,
        (r + 1) * COLS + c,
      ];
      const pts = ids.map((i) => [screen[i * 2], screen[i * 2 + 1]]);
      if (pts.every(([x, y]) => offscreen(x, y))) {
        const xs = pts.map((p) => p[0]);
        const ys = pts.map((p) => p[1]);
        const spans =
          (Math.min(...xs) < 0 && Math.max(...xs) > width) ||
          (Math.min(...ys) < 0 && Math.max(...ys) > height);
        if (!spans) continue;
      }
      const rgb = [0, 1, 2].map((k) =>
        Math.round(ids.reduce((sum, i) => sum + shades[i * 3 + k], 0) / 4),
      );
      const fill = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      const P = ids.map((i) => [
        world[i * 3],
        world[i * 3 + 1],
        world[i * 3 + 2],
      ]);
      const z = (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4;
      const d = `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`;
      const lift = z - (sim.heights[ids[0]] ?? 0);
      const shadow =
        lift > 4
          ? `M${P.map(([x, y, h]) => `${(x + h * 0.35).toFixed(1)},${(y + h * 0.45).toFixed(1)}`).join("L")}Z`
          : null;
      quads.push({ d, fill, z, shadow });
    }
  }
  quads.sort((a, b) => a.z - b.z);

  return (
    <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {children ?? (
          <PlaceholderLockup
            mark={clothColor}
            dot={background}
            text={placeholderText(background)}
          />
        )}
      </AbsoluteFill>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.min(width, height) * 0.02} />
          </filter>
          {/* Normalized blur: blurring premultiplied color and then forcing
              alpha to 1 averages only covered pixels, which smooths the facet
              steps without bleeding the background in. The source alpha then
              restores the crisp silhouette. */}
          <filter
            id={softenId}
            filterUnits="userSpaceOnUse"
            x={-width}
            y={-height}
            width={width * 3}
            height={height * 3}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={(width * 1.12) / (COLS - 1) / 2.2}
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1"
              result="smooth"
            />
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation={Math.min(width, height) / 600}
              result="edge"
            />
            <feComposite in="smooth" in2="edge" operator="in" />
          </filter>
        </defs>
        <g filter={`url(#${shadowId})`} opacity={0.45}>
          {quads.map((q, i) =>
            q.shadow ? <path key={i} d={q.shadow} fill="#000000" /> : null,
          )}
        </g>
        {/* Aliased quads share edges without hairline seams. */}
        <g filter={`url(#${softenId})`}>
          {quads.map((q, i) => (
            <path key={i} d={q.d} fill={q.fill} shapeRendering="crispEdges" />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
