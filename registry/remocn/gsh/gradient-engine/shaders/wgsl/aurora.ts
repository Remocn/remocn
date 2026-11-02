/**
 * WGSL twin of the aurora kind's GLSL (aurora.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
// One curtain sheet. Returns its intensity and the height above its hem (0..1).
fn auroraSheet(p: vec2f, layer: f32, hem0: f32, detail: bool) -> vec2f {
  var x = p.x * u.scale;
  // Folds sway the sheet sideways, more so higher up.
  var fold = flowNoise(vec2f(x * 0.5, p.y * 0.25 + layer), layer);
  var xf = x + (0.1 + 0.3 * u.warp) * fold;
  var hem = hem0 + 0.24 * flowNoise(vec2f(xf * 0.6, layer * 3.1), layer + 1.0)
    + 0.1 * sin(x * 1.2 + layer) + 0.06 * fold + 0.08 * x * x;
  var rise = p.y - hem;
  var up = exp(-max(rise, 0.0) * (2.8 - 1.0 * u.blur));
  var down = exp(min(rise, 0.0) * (9.0 - 5.0 * u.blur));
  // Rays: fine across the sheet, stretched along it.
  var n = 0.65 * flowNoise(vec2f(xf * 4.0, p.y * 0.15), layer + 2.0);
  if (detail) {
    n += 0.35 * flowNoise(vec2f(xf * 11.0, p.y * 0.3), layer + 3.0);
  }
  var rays = mix(1.0, 0.6 + 0.55 * n, 0.85 - 0.45 * u.blur);
  // The sheet thins where it folds edge-on.
  var density = 0.45 + 0.55 * smoothstep(-0.6, 0.6, fold);
  return vec2f(up * down * rays * density, clamp(rise / 0.75, 0.0, 1.0));
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var h = frameHalf();
  var lab = u.bg;
  lab.x += 0.035 * smoothstep(0.3, -h.y, p.y);
  var back = auroraSheet(p * vec2f(0.75, 1.0) + vec2f(0.9, 0.0), 11.0, -0.02, false);
  var front = auroraSheet(p, 13.0, -0.3, true);
  lab = labMix(lab, ramp(0.3 + 0.7 * back.y), clamp(back.x * 0.35, 0.0, 1.0));
  lab = labMix(lab, ramp(front.y), clamp(front.x * 1.45, 0.0, 1.0));
  // A bright hem, and the light it throws onto the horizon.
  lab.x += 0.12 * front.x * (1.0 - front.y);
  var horizon = exp(-(p.y + h.y) * 5.0) * (0.5 + 0.5 * front.x);
  lab = labMix(lab, paletteColor(1), clamp(horizon * 0.2, 0.0, 1.0));
  lab.x *= vignette(p, 0.3);
  return filmGrade(lab);
}
`;
