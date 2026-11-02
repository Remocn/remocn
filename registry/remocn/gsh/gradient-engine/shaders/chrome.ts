import type { GradientKindDefinition } from "../kind";
import { pick } from "../kind";

/**
 * Liquid chrome filling the frame. A slow, flowing surface reflects a
 * studio of soft light bands, so highlights run along the folds and the
 * troughs fall to black. Colour 1 is the studio light the metal mostly
 * shows, colour 2 the hot highlight, colour 3 an optional cool rim seen at
 * grazing angles. `scale` sets the size of the swells, `warp` how much the
 * surface folds, `blur` softens the reflections.
 */
export const chrome: GradientKindDefinition = {
  defaults: {
    background: "#050203",
    blur: 0.2,
    colors: ["#e0202e", "#ffd6b8", "#4fe3f0"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.06,
    interaction: { pointer: 0.2, scroll: 0.2 },
    loopSeconds: 24,
    scale: 1,
    seed: 6,
    speed: 0.5,
    warp: 0.5,
  },
  description: "Liquid metal folding slowly under studio light.",
  fallbackLayers: (colors) => [
    `radial-gradient(60% 30% at 40% 38%, color-mix(in oklab, ${pick(colors, 1)} 70%, transparent), transparent 70%)`,
    `linear-gradient(160deg, transparent 20%, ${pick(colors, 0)} 45%, transparent 60%, color-mix(in oklab, ${pick(colors, 0)} 60%, transparent) 75%, transparent 90%)`,
    `linear-gradient(20deg, transparent 60%, color-mix(in oklab, ${pick(colors, 2)} 35%, transparent) 70%, transparent 78%)`,
  ],
  glsl: `
// Height of the metal: long folds running one way, their crests bent by a
// slow noise field so they curve and bunch like draped cloth, with a faint
// cross fold. Ridges rather than domes, so reflections stream along the
// folds instead of ringing. The folds roll a whole wavelength each loop.
float chromeHeight(vec2 q, vec2 t1, vec2 t2) {
  float bendBy = (0.9 + 1.6 * u_warp) * flowNoise(q * vec2(0.35, 0.55), 2.0);
  float a = 2.1 * q.y + bendBy;
  float c = 1.3 * q.x + 0.4 * bendBy + 1.3;
  return sin(a) * t1.x - cos(a) * t1.y
    + 0.2 * (sin(2.0 * a + 0.9) * t2.x - cos(2.0 * a + 0.9) * t2.y) * (1.0 - 0.6 * u_blur)
    + 0.15 * (sin(c) * t2.x - cos(c) * t2.y);
}

// The studio as seen in a reflection direction: a dark floor with a soft
// bounce and a light behind the camera, a dark horizon line, a bright sky with a cool band and a hot key, and darker ceiling.
vec3 chromeStudio(vec3 r, float sa) {
  float t = r.y * 0.9 + 0.3 * r.x * cos(sa);
  float soft = 0.04 + 0.12 * u_blur;
  vec3 floorC = labMix(u_bg, paletteColor(0), 0.08 + 0.5 * smoothstep(0.9, 1.0, r.z));
  // A broad, dimmer bounce off the floor, so downward slopes still read as metal.
  floorC = labMix(floorC, paletteColor(0), 0.7 * exp(-pow((t + 0.5) / (0.18 + soft), 2.0)));
  vec3 env = labMix(floorC, paletteColor(0), smoothstep(0.1, 0.3, t));
  float horizon = exp(-pow((t - 0.12) / (soft * 1.3), 2.0));
  env = labMix(env, u_bg, 0.92 * horizon);
  float cool = exp(-pow((t - 0.4) / (soft * 0.9), 2.0));
  env = labMix(env, paletteColor(u_count > 2 ? 2 : 1), 0.55 * cool);
  float key = exp(-pow((t - 0.58) / soft, 2.0));
  env = labMix(env, paletteColor(1), key);
  env.x += 0.16 * key * key;
  env = labMix(env, u_bg, 0.6 * smoothstep(0.75, 1.0, t));
  return env;
}

vec3 kindColor(vec2 p, vec2 uv) {
  float sa = seedAngle();
  vec2 t1 = loopTurn();
  vec2 t2 = vec2(t1.x * t1.x - t1.y * t1.y, 2.0 * t1.x * t1.y);
  vec2 q = rot2(0.6 * sin(sa) + 0.3) * p * 1.75 * u_scale + vec2(1.7, -0.9) * cos(sa);

  float e = 0.004;
  float h = chromeHeight(q, t1, t2);
  vec2 g = vec2(chromeHeight(q + vec2(e, 0.0), t1, t2) - h, chromeHeight(q + vec2(0.0, e), t1, t2) - h) / e;
  vec3 n = normalize(vec3(-g * 0.6 / sqrt(u_scale), 1.0));
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);

  vec3 lab = chromeStudio(r, sa);
  // Low ground sits in shadow.
  lab = labMix(lab, u_bg, 0.3 * (1.0 - smoothstep(-1.8, -0.6, h)));
  lab.x *= vignette(p, 0.35);
  return filmGrade(lab);
}
`,
  label: "Chrome",
  name: "chrome",
  wgsl: () => import("./wgsl/chrome").then((module) => module.wgsl),
};
