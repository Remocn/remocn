import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

/**
 * A draped sheet of silk seen edge-on. Parallel folds run along the sheet,
 * bunching and spreading as a slow wave travels through it; a fake normal
 * from the folds gives deep troughs, thin specular crests and a sheen that
 * shifts colour with the facing direction. The top hem follows one fold, so
 * the edge is a crisp line of light, and the sheet falls off into the
 * background below it.
 *
 * Colour 1 is the body, colour 2 the sheen and hem, colour 3 an optional
 * second sheen for folds facing the other way. `scale` sets the fold
 * density, `warp` how much the folds twist, `blur` softens the light.
 */
export const silk: GradientKindDefinition = {
  defaults: {
    background: "#030308",
    blur: 0.3,
    colors: ["#3b3fd8", "#f3d6c0", "#8a7bff"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.08,
    interaction: { pointer: 0.15, scroll: 0.2 },
    loopSeconds: 24,
    scale: 1,
    seed: 4,
    speed: 0.6,
    warp: 0.4,
  },
  description: "A draped sheet of silk with lit folds and a bright hem.",
  fallbackLayers: (colors) => [
    `linear-gradient(172deg, transparent 30%, color-mix(in oklab, ${pick(colors, 1)} 60%, transparent) 36%, color-mix(in oklab, ${pick(colors, 0)} 70%, transparent) 44%, transparent 85%)`,
    `radial-gradient(70% 40% at 45% 45%, color-mix(in oklab, ${pick(colors, 2)} 35%, transparent), transparent 70%)`,
  ],
  glsl: `
// Distance across the sheet, in fold units: constant along each fold.
float silkPhase(vec2 q, vec2 t1, vec2 t2, float ph) {
  float x = q.x;
  float centre = 0.075 * turnSin(1.25 * x + 0.7 + ph, t1) + 0.05 * turnSin(2.7 * x - 1.9 + 2.0 * ph, t2);
  float spread = 1.0 + 0.22 * turnSin(1.6 * x + 2.1 - ph, t1) + 0.3 * sin(0.9 * x + 4.0 + 3.0 * ph);
  float twist = flowNoise(vec2(x * 0.5, q.y * 0.8), 2.0);
  return (q.y - centre) * spread + (0.02 + 0.07 * u_warp) * twist;
}

vec3 kindColor(vec2 p, vec2 uv) {
  float sa = seedAngle();
  // The seed picks the drape: its tilt, height, fold size, and whether it
  // hangs from above or rises from below.
  float tilt = 0.4 * sin(sa);
  vec2 q = rot2(tilt) * p;
  q.y -= 0.04 + 0.16 * cos(sa * 1.7);
  q.y *= fract(sa * 0.91) > 0.66 ? -1.0 : 1.0;
  float ph = sa * 2.3;
  vec2 t1 = loopTurn();
  vec2 t2 = vec2(t1.x * t1.x - t1.y * t1.y, 2.0 * t1.x * t1.y);

  float e = 0.0025;
  float v = silkPhase(q, t1, t2, ph);
  vec2 grad = vec2(silkPhase(q + vec2(e, 0.0), t1, t2, ph) - v, silkPhase(q + vec2(0.0, e), t1, t2, ph) - v) / e;

  // Two scales of fold: a broad swell of the whole sheet, and fine strands
  // that gather into bundles along it.
  float x = q.x;
  float bend = 0.45 * turnSin(1.1 * x + 0.4 + ph, t1) + 0.2 * sin(2.3 * x + 1.0 - ph);
  float f1 = 5.5 * u_scale * (0.8 + 0.45 * fract(sa * 1.37));
  float phi1 = v * f1 + bend;
  vec2 slope = 0.7 * cos(phi1) * grad * f1;
  vec3 n = normalize(vec3(-slope, 1.0));

  // Lit like a studio shot: the folds reflect a sharp key, a broad fill and a
  // dimmer bounce below, plus a little diffuse light.
  vec3 light = normalize(vec3(0.3 * cos(sa * 2.3), 0.85, 0.4));
  float diffuse = 0.5 + 0.5 * dot(n, light);
  diffuse *= diffuse;
  vec2 r = 2.0 * n.z * n.xy;
  float w = mix(0.07, 0.3, u_blur);
  float key = exp(-pow((r.y - 0.42) / w, 2.0));
  float bounce = exp(-pow((r.y + 0.35) / (1.6 * w), 2.0));
  // A broad, softer fill band, so the body between the crests has sheen too.
  float fill = exp(-pow((r.y - 0.12) / (2.4 * w), 2.0));
  float spec = key * (0.75 + 0.25 * diffuse) + 0.38 * fill;

  // On a dark ground the folds are lit out of the dark; on a light ground the
  // body is the light and the folds shade toward colour 1.
  float lightBg = smoothstep(0.55, 0.75, u_bg.x);
  vec3 body = mix(
    labMix(u_bg, paletteColor(0), smoothstep(0.12, 0.9, diffuse)),
    labMix(paletteColor(0), u_bg, 0.15 + 0.85 * diffuse),
    lightBg
  );
  float facing = smoothstep(-0.25, 0.25, n.x);
  vec3 tint = labMix(paletteColor(1), paletteColor(u_count > 2 ? 2 : 1), facing);
  // Fine strands gathered into bundles: thin lines along the folds.
  float f2 = 40.0 * u_scale;
  float v2 = v * f2 + 1.5 * sin(v * f1 * 1.7 + 1.0);
  float thread = exp(-pow((fract(v2) - 0.5) / mix(0.08, 0.22, u_blur), 2.0));
  float bundle = smoothstep(0.1, 0.9, sin(phi1 * 0.5 + 2.0)) * (0.4 + 0.6 * u_warp);
  // Strands only show where their fold catches the light.
  float shine = spec + 0.55 * thread * bundle * clamp(key + fill, 0.0, 1.0);
  vec3 lab = labMix(body, paletteColor(u_count > 2 ? 2 : 0), 0.3 * bounce * (1.0 - lightBg));
  lab = labMix(lab, tint, clamp(shine, 0.0, 1.0));
  lab.x += (0.32 - 0.25 * lightBg) * spec * spec + 0.05 * thread * bundle * diffuse;

  // The sheet: everything below the hem fold, fading with depth.
  float top = 0.16;
  float px = length(grad) / min(u_full.x, u_full.y);
  float soft = max(px * 1.5, 1e-4) + 0.03 * u_blur;
  float below = top - v;
  float mask = smoothstep(-soft, soft, below);
  float fade = exp(-max(below, 0.0) * mix(1.8, 1.2, u_blur));
  float rim = exp(-pow(below / (soft + 0.006), 2.0));

  // The top fold rolls toward the light, so the body is brightest just under the hem.
  lab = labMix(lab, labMix(paletteColor(0), tint, 0.35), 0.7 * exp(-max(below, 0.0) * mix(16.0, 8.0, u_blur)) * (1.0 - lightBg));
  vec3 back = labMix(u_bg, paletteColor(0), 0.14 * exp(-abs(below) * 5.0));
  vec3 outLab = labMix(back, lab, mask * fade);
  // The hem catches the light unevenly along its length.
  float catchLight = 0.45 + 0.55 * smoothstep(-0.6, 0.8, flowNoise(vec2(q.x * 0.9, 3.0), 5.0));
  outLab = labMix(outLab, paletteColor(1), 0.9 * rim * catchLight);
  outLab.x += 0.12 * rim * catchLight;
  return filmGrade(outLab);
}
`,
  wgsl: () => import("./wgsl/silk").then((module) => module.wgsl),
  label: "Silk",
  name: "silk",
};
