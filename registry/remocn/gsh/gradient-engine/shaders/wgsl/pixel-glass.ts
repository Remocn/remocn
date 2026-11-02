/**
 * WGSL twin of the pixel-glass kind's GLSL (pixel-glass.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn pgScene(q: vec2f, h: vec2f) -> vec3f {
  var lab = u.bg;
  let lightBg = smoothstep(0.55, 0.85, u.bg.x);
  let a0 = seedAngle();
  let size = (0.17 + 0.1 * u.blur);
  let lean = vec2f(cos(a0 + 1.3), sin(a0 + 1.3)) * vec2f(0.32, 0.3) * h;
  for (var i = 0; i < 6; i++) {
    if (i >= u.count) { break; }
    let fi = f32(i);
    let a = a0 + fi * 2.1;
    let base = vec2f(cos(a) * 0.42 * h.x, sin(a) * 0.3 * h.y) * min(fi, 1.0) * (0.8 + 0.25 * fi);
    let c = lean + base + vec2f(0.55, 0.38) * drift(fi + 1.0);
    let r = size * (1.0 - 0.5 * min(fi, 1.0) / (1.0 + 0.4 * fi)) * mix(1.0, 1.15, lightBg);
    var d = rot2(a * 0.5 + 0.4 * fi) * (q - c);
    d *= vec2f(0.62, 1.0);
    let k = dot(d, d) / (r * r);
    let w = exp(-k * (1.3 - 0.6 * u.blur));
    var col = paletteColor(i);
    let rim = labMix(col, paletteColor(i + 1), 0.55);
    col = labMix(col, rim, smoothstep(0.15, 0.9, k) * 0.7);
    lab = labMix(lab, col, clamp(w * 1.15, 0.0, 1.0));
  }
  return lab;
}

fn pgGlass() -> f32 {
  var most = 0.0;
  for (var i = 0; i < 6; i++) {
    if (i >= u.count) { break; }
    most = max(most, length(u.colors[i].xyz - u.bg));
  }
  return clamp(most * 7.0, 0.0, 1.0);
}

fn pgLight(q: vec2f, h: vec2f) -> f32 {
  return pgScene(q, h).x;
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let h = frameHalf();
  let minSide = min(u.full.x, u.full.y);
  let lightBg = smoothstep(0.55, 0.85, u.bg.x);
  let block = max(8.0, floor(minSide * 0.072 / u.scale + 0.5));
  let px = uv * u.full;
  let g = px - 0.5 * u.full;
  let id = floor(g / block);
  let inPx = g - id * block;
  var lp = inPx / block - 0.5;
  lp.y = -lp.y;
  var c = (id + 0.5) * block / minSide;
  c.y = -c.y;
  let ci = interact(c);
  let cell = block / minSide;

  let tone = pgScene(ci, h);
  let lens = mix(0.6, -0.9, u.warp);
  let seenThrough = pgScene(ci + 1.6 * cell * lens * lp, h);
  var lab = labMix(tone, seenThrough, 0.55);

  let e = 0.75 * cell;
  let grad = vec2f(
    pgLight(ci + vec2f(e, 0.0), h) - pgLight(ci - vec2f(e, 0.0), h),
    pgLight(ci + vec2f(0.0, e), h) - pgLight(ci - vec2f(0.0, e), h)
  );
  let slope = length(grad);
  let toLight = normalize(mix(vec2f(-0.7071, 0.7071), grad / max(slope, 1e-4), smoothstep(0.002, 0.03, slope)));

  let glow = clamp((tone.x - u.bg.x) * mix(3.0, -3.0, lightBg), 0.0, 1.0);
  let glass = pgGlass();
  let lit = max(glow, mix(0.18, 0.35, lightBg) * glass);

  let r = max(abs(lp.x), abs(lp.y));
  let facing = dot(lp, toLight) / 0.5;
  lab.x += lit * (0.05 * facing - 0.07 * smoothstep(0.22, 0.5, r)) * mix(1.0, 0.5, lightBg);
  let spot = lp - 0.18 * toLight;
  lab.x += glow * 0.05 * exp(-dot(spot, spot) * 9.0) * mix(1.0, 0.4, lightBg);

  let fromEdge = min(inPx, block - inPx);
  let edgePx = min(fromEdge.x, fromEdge.y);
  let lipWidth = max(1.5, block * 0.07);
  let lip = 1.0 - smoothstep(0.0, lipWidth, edgePx);
  let side = select(vec2f(0.0, sign(lp.y)), vec2f(sign(lp.x), 0.0), abs(lp.x) > abs(lp.y));
  let toward = dot(side, toLight);
  lab.x += lip * lit * select(0.06 * toward, 0.11 * toward, toward > 0.0) * mix(1.0, 0.45, lightBg);

  let ringPx = abs(r - 0.32) * block;
  let ring = 1.0 - smoothstep(0.0, max(1.0, block * 0.022), ringPx);
  let inner = dot(side, toLight);
  lab.x += ring * lit * (0.03 - 0.07 * inner) * mix(1.0, 0.5, lightBg);

  let grout = max(1.0, block * 0.03);
  let seam = 1.0 - smoothstep(grout - 0.5, grout + 0.5, edgePx);
  lab = labMix(lab, u.bg * vec3f(mix(0.55, 0.9, lightBg), 1.0, 1.0), seam * glass * mix(0.85, 0.5, lightBg));

  let q = interact(vec2f(g.x, -g.y) / minSide);
  let halo = pgScene(q, h);
  let bloom = clamp((halo.x - u.bg.x) * mix(1.0, -1.0, lightBg), 0.0, 1.0);
  lab = labMix(lab, halo, 0.32 * bloom * bloom * (1.0 - lightBg));
  return filmGrade(lab);
}
`;
