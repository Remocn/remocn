import type { GradientKindDefinition } from "../kind";

/**
 * Light seen through a wall of square glass blocks. Behind the glass, one
 * soft blob per colour drifts on its own path. Each block takes one clear
 * tone from the light behind its centre and refracts the patch around it
 * like a small lens, then catches the light on a bevelled edge that faces
 * the brightest neighbour, with a pressed inner face and a dark grout seam.
 * The brightest cells bloom over the grout. The glass stays put and only
 * the light behind it moves.
 *
 * Params: `scale` sets the block size (about 14 blocks across the short side
 * at 1), `warp` the lens strength (0 is flat glass, 1 flips each block's
 * image), `blur` the softness of the blobs. The seed lays the blobs out.
 * Pale backgrounds read as frosted glass on paper, dark ones as a lit wall
 * at night.
 *
 * Helpers are prefixed `pg` and only depend on the prelude.
 */
export const pixelGlass: GradientKindDefinition = {
  defaults: {
    background: "#f4f3f1",
    blur: 0.55,
    colors: ["#7a3cff", "#ff4fb8", "#3d6bff"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.05,
    interaction: { pointer: 0.2, scroll: 0 },
    loopSeconds: 20,
    scale: 1,
    seed: 4,
    speed: 0.5,
    warp: 0.5,
  },
  description:
    "Soft colour drifting behind a wall of square glass blocks, each a small lens.",
  // One soft blob per colour, along a loose arc.
  fallbackLayers: (colors) =>
    colors.map(
      (color, i) =>
        `radial-gradient(${24 - 3 * i}% ${30 - 3 * i}% at ${34 + 16 * i}% ${50 - 8 * (i % 2)}%, ${color}, transparent 72%)`,
    ),
  glsl: `
// The light behind the glass: one soft, elongated blob per colour.
vec3 pgScene(vec2 q, vec2 h) {
  vec3 lab = u_bg;
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  float a0 = seedAngle();
  float size = (0.17 + 0.1 * u_blur);
  // The cluster leans off centre, toward an edge picked by the seed.
  vec2 lean = vec2(cos(a0 + 1.3), sin(a0 + 1.3)) * vec2(0.32, 0.3) * h;
  for (int i = 0; i < 6; i++) {
    if (i >= u_count) break;
    float fi = float(i);
    // A loose arc of blobs, big first, each drifting on its own circle.
    float a = a0 + fi * 2.1;
    vec2 base = vec2(cos(a) * 0.42 * h.x, sin(a) * 0.3 * h.y) * min(fi, 1.0) * (0.8 + 0.25 * fi);
    vec2 c = lean + base + vec2(0.55, 0.38) * drift(fi + 1.0);
    float r = size * (1.0 - 0.5 * min(fi, 1.0) / (1.0 + 0.4 * fi)) * mix(1.0, 1.15, lightBg);
    vec2 d = rot2(a * 0.5 + 0.4 * fi) * (q - c);
    d *= vec2(0.62, 1.0);
    float k = dot(d, d) / (r * r);
    float w = exp(-k * (1.3 - 0.6 * u_blur));
    // A brighter, shifted rim, the way colour pools at a blob's edge.
    vec3 col = paletteColor(i);
    vec3 rim = labMix(col, paletteColor(i + 1), 0.55);
    col = labMix(col, rim, smoothstep(0.15, 0.9, k) * 0.7);
    lab = labMix(lab, col, clamp(w * 1.15, 0.0, 1.0));
  }
  return lab;
}

// How far the palette stands from the background. Clear glass over a plain
// ground is invisible, so with nothing to bend the wall disappears and a
// flat palette renders flat.
float pgGlass() {
  float most = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= u_count) break;
    most = max(most, length(u_colors[i] - u_bg));
  }
  return clamp(most * 7.0, 0.0, 1.0);
}

// Lightness of the light behind the glass, for a block's shading to face.
float pgLight(vec2 q, vec2 h) {
  return pgScene(q, h).x;
}

vec3 kindColor(vec2 p, vec2 uv) {
  vec2 h = frameHalf();
  float minSide = min(u_full.x, u_full.y);
  float lightBg = smoothstep(0.55, 0.85, u_bg.x);
  // Whole pixels per block, so the grid is crisp at any size.
  float block = max(8.0, floor(minSide * 0.072 / u_scale + 0.5));
  vec2 px = uv * u_full;
  // Centre the grid on the frame.
  vec2 g = px - 0.5 * u_full;
  vec2 id = floor(g / block);
  vec2 inPx = g - id * block;
  vec2 lp = inPx / block - 0.5;
  lp.y = -lp.y;
  vec2 c = (id + 0.5) * block / minSide;
  c.y = -c.y;
  vec2 ci = interact(c);
  float cell = block / minSide;

  // Each block holds one clear tone, the light behind its centre, so the
  // wall reads as crisp cells rather than a smudge. Inside, the block is a
  // small lens: it shows the patch behind it squeezed (warp 0.5) or flipped
  // (warp 1), which keeps every cell's edge distinct from its neighbour's.
  vec3 tone = pgScene(ci, h);
  float lens = mix(0.6, -0.9, u_warp);
  vec3 seenThrough = pgScene(ci + 1.6 * cell * lens * lp, h);
  vec3 lab = labMix(tone, seenThrough, 0.55);

  // Which way the light brightens across this block: the side facing it
  // catches the bevel, the far side falls into shade.
  float e = 0.75 * cell;
  vec2 grad = vec2(
    pgLight(ci + vec2(e, 0.0), h) - pgLight(ci - vec2(e, 0.0), h),
    pgLight(ci + vec2(0.0, e), h) - pgLight(ci - vec2(0.0, e), h)
  );
  float slope = length(grad);
  vec2 toLight = normalize(mix(vec2(-0.7071, 0.7071), grad / max(slope, 1e-4), smoothstep(0.002, 0.03, slope)));

  // How much light this block passes, against the bare background.
  float glow = clamp((tone.x - u_bg.x) * mix(3.0, -3.0, lightBg), 0.0, 1.0);
  // Unlit blocks still show as faint glass, so the wall reads edge to edge.
  float glass = pgGlass();
  float lit = max(glow, mix(0.18, 0.35, lightBg) * glass);

  // A convex block: brighter toward the light, falling off to its rim.
  float r = max(abs(lp.x), abs(lp.y));
  float facing = dot(lp, toLight) / 0.5;
  lab.x += lit * (0.05 * facing - 0.07 * smoothstep(0.22, 0.5, r)) * mix(1.0, 0.5, lightBg);
  // A broad sheen where the lens focuses the light, toward its source.
  vec2 spot = lp - 0.18 * toLight;
  lab.x += glow * 0.05 * exp(-dot(spot, spot) * 9.0) * mix(1.0, 0.4, lightBg);

  // Bevel: a bright lip on the edges that face the light, shade opposite.
  vec2 fromEdge = min(inPx, block - inPx);
  float edgePx = min(fromEdge.x, fromEdge.y);
  float lipWidth = max(1.5, block * 0.07);
  float lip = 1.0 - smoothstep(0.0, lipWidth, edgePx);
  vec2 side = abs(lp.x) > abs(lp.y) ? vec2(sign(lp.x), 0.0) : vec2(0.0, sign(lp.y));
  float toward = dot(side, toLight);
  lab.x += lip * lit * (toward > 0.0 ? 0.11 * toward : 0.06 * toward) * mix(1.0, 0.45, lightBg);

  // Glass blocks are pressed with a recessed inner face: a thin ring a
  // third of the way in, shaded on the side toward the light.
  float ringPx = abs(r - 0.32) * block;
  float ring = 1.0 - smoothstep(0.0, max(1.0, block * 0.022), ringPx);
  float inner = dot(side, toLight);
  lab.x += ring * lit * (0.03 - 0.07 * inner) * mix(1.0, 0.5, lightBg);

  // Grout: a dark seam between blocks, a little wider on big blocks.
  float grout = max(1.0, block * 0.03);
  float seam = 1.0 - smoothstep(grout - 0.5, grout + 0.5, edgePx);
  lab = labMix(lab, u_bg * vec3(mix(0.55, 0.9, lightBg), 1.0, 1.0), seam * glass * mix(0.85, 0.5, lightBg));

  // Where the light is strongest it blooms past the glass and over the
  // grout, so the bright cells glow instead of sitting flat.
  vec2 q = interact(vec2(g.x, -g.y) / minSide);
  vec3 halo = pgScene(q, h);
  float bloom = clamp((halo.x - u_bg.x) * mix(1.0, -1.0, lightBg), 0.0, 1.0);
  lab = labMix(lab, halo, 0.32 * bloom * bloom * (1.0 - lightBg));
  return filmGrade(lab);
}
`,
  label: "Pixel glass",
  name: "pixel-glass",
  wgsl: () => import("./wgsl/pixel-glass").then((module) => module.wgsl),
};
