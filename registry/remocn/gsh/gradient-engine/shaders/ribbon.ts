import type { GradientKindDefinition } from "../kind";
import { pick, stops } from "../kind";

/**
 * Two twisting ribbons crossing the frame. The palette runs across each
 * ribbon's width, so it reads as stripes printed on a strip; as a ribbon
 * turns edge-on it narrows to a bright crease and shows its back. Edges go
 * from crisp to soft along the length, like a shallow depth of field, and
 * fine threads run parallel to the edges. Works on light and dark grounds.
 *
 * `scale` zooms in or out, `warp` adds twist and swing, `blur` softens the
 * edges and the far ribbon.
 */
export const ribbon: GradientKindDefinition = {
  defaults: {
    background: "#ffffff",
    blur: 0.35,
    colors: ["#ff3d9a", "#ff8a3d", "#ffc83d", "#7a5cff"],
    dither: { cell: 3, enabled: false, levels: 8 },
    grain: 0.06,
    interaction: { pointer: 0.15, scroll: 0.25 },
    loopSeconds: 22,
    scale: 1,
    seed: 2,
    speed: 0.6,
    warp: 0.45,
  },
  description: "Twisting ribbons with stripes of colour across their width.",
  fallbackLayers: (colors) => [
    `linear-gradient(155deg, transparent 30%, ${stops(colors, 32, 52)}, transparent 54%)`,
    `linear-gradient(28deg, transparent 52%, color-mix(in oklab, ${pick(colors, 1)} 60%, transparent) 58%, transparent 66%)`,
  ],
  glsl: `
// cos(a - angle), where cs = (cos, sin)(angle); turnSin is its sine twin.
float ribbonCos(float a, vec2 cs) {
  return cos(a) * cs.x + sin(a) * cs.y;
}

// Draws one ribbon over lab. far is 0 for the near ribbon, 1 for the far one.
vec3 ribbonLayer(vec3 lab, vec2 p, float angle, float offset, float layer, float far, float ph, vec2 t1, vec2 t2, float lightBg) {
  vec2 q = rot2(angle) * p * u_scale;
  float s = q.x;
  float amp = 0.1 + 0.12 * u_warp;
  float a1 = 1.5 * s + layer + 2.0 * ph;
  float a2 = 2.9 * s + 2.0 * layer - ph;
  float wobble = 0.03 * flowNoise(vec2(s * 0.6, layer), layer);
  float centre = offset + amp * turnSin(a1, t1) + 0.04 * turnSin(a2, t2) + wobble;
  float dc = amp * 1.5 * ribbonCos(a1, t1) + 0.116 * ribbonCos(a2, t2);
  float dist = (q.y - centre) / sqrt(1.0 + dc * dc);

  // Twist: the strip turns about its centre line as it travels.
  float twist = (0.6 + 1.1 * u_warp) * s + 1.7 * layer + 0.6 + 1.3 * ph;
  float turn = ribbonCos(twist, t1);
  float facing = abs(turn);
  float width = (0.23 - 0.08 * far) * (0.12 + 0.88 * facing) + 0.002;
  float u = dist / width;
  // Which face we see, softened so the flip at edge-on has no seam.
  float side = turn / (facing + 0.12);

  // Focus drifts along the ribbon: crisp in places, soft in others.
  float focus = smoothstep(-0.4, 0.8, sin(0.9 * s + 1.3 * layer + 0.5 - ph));
  float px = u_scale / min(u_full.x, u_full.y);
  float soft = 1.5 * px + (0.004 + 0.05 * u_blur) * (1.0 - focus) + 0.04 * far * (0.4 + u_blur);
  float alpha = 1.0 - smoothstep(width - soft, width + soft, abs(dist));

  // Colour runs across the width; the back of the strip reads the other way.
  float slide = 0.22 * sin(0.8 * s + 2.3 * layer + ph);
  float across = clamp(0.5 + 0.5 * u * side + slide, 0.0, 1.0);
  vec3 col = ramp(across);
  col = labMix(col, u_bg, 0.18 * (1.0 - smoothstep(-0.6, 0.0, side)) + 0.25 * far);
  // A soft highlight across the slight curl of the strip, stronger face-on.
  float curl = exp(-pow((u * side - 0.25) / 0.45, 2.0)) * facing;
  col.x += (0.07 - 0.05 * lightBg) * curl;
  // The strip's face turns toward and away from a light above the viewer.
  float lit = abs(0.85 * turn - 0.5 * turnSin(twist, t1));
  col.x *= mix(mix(0.62, 0.84, lightBg), 1.04, lit);
  // Threads parallel to the edges, only where the ribbon is in focus.
  col.x += 0.024 * (1.0 - u_blur) * focus * facing * sin(u * 120.0) * (1.0 - far);
  // Bright edges, as on a thin sheet of glass.
  float edge = smoothstep(0.7, 1.0, abs(u)) * facing;
  col = labMix(col, labMix(ramp(1.0 - across), vec3(1.0, 0.0, 0.0), 0.5 - 0.5 * lightBg), 0.35 * edge);

  float opacity = mix(0.97, 0.88, lightBg) - 0.3 * far;
  // On a dark ground the ribbon lights the air around it.
  float halo = exp(-max(abs(dist) - width, 0.0) / (0.03 + 0.08 * u_blur)) * (1.0 - lightBg);
  lab = labMix(lab, col, 0.22 * halo * opacity);
  lab = labMix(lab, col, alpha * opacity);
  // Edge-on, the strip collapses to a bright crease.
  float crease = exp(-pow(dist / (0.003 + soft), 2.0)) * pow(1.0 - facing, 6.0);
  vec3 hot = labMix(ramp(0.5), vec3(1.0, 0.0, 0.0), 0.6 - 0.6 * lightBg);
  lab = labMix(lab, hot, clamp(crease * opacity, 0.0, 1.0));
  return lab;
}

vec3 kindColor(vec2 p, vec2 uv) {
  float sa = seedAngle();
  vec2 t1 = loopTurn();
  vec2 t2 = vec2(t1.x * t1.x - t1.y * t1.y, 2.0 * t1.x * t1.y);
  float lightBg = smoothstep(0.55, 0.75, u_bg.x);
  float a0 = 0.5 * sin(sa) + 0.25;
  float a1 = a0 - (0.85 + 0.35 * cos(sa * 1.3));
  vec3 lab = u_bg;
  lab = ribbonLayer(lab, p, a1, -0.08 * sin(sa * 1.7), 3.0, 1.0, sa * 1.7, t1, t2, lightBg);
  lab = ribbonLayer(lab, p, a0, 0.06 * cos(sa * 2.1), 1.0, 0.0, sa * 1.7, t1, t2, lightBg);
  return filmGrade(lab);
}
`,
  wgsl: () => import("./wgsl/ribbon").then((module) => module.wgsl),
  label: "Ribbon",
  name: "ribbon",
};
