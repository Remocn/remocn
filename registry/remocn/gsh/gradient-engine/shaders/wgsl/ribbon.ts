/**
 * WGSL twin of the ribbon kind's GLSL (ribbon.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
// cos(a - angle), where cs = (cos, sin)(angle); turnSin is its sine twin.
fn ribbonCos(a: f32, cs: vec2f) -> f32 {
  return cos(a) * cs.x + sin(a) * cs.y;
}

// GLSL's local "u" is "w" here: u is the uniform block in WGSL.
fn ribbonLayer(lab0: vec3f, p: vec2f, angle: f32, offset: f32, layer: f32, far: f32, ph: f32, t1: vec2f, t2: vec2f, lightBg: f32) -> vec3f {
  var lab = lab0;
  let q = rot2(angle) * p * u.scale;
  let s = q.x;
  let amp = 0.1 + 0.12 * u.warp;
  let a1 = 1.5 * s + layer + 2.0 * ph;
  let a2 = 2.9 * s + 2.0 * layer - ph;
  let wobble = 0.03 * flowNoise(vec2f(s * 0.6, layer), layer);
  let centre = offset + amp * turnSin(a1, t1) + 0.04 * turnSin(a2, t2) + wobble;
  let dc = amp * 1.5 * ribbonCos(a1, t1) + 0.116 * ribbonCos(a2, t2);
  let dist = (q.y - centre) / sqrt(1.0 + dc * dc);

  let twist = (0.6 + 1.1 * u.warp) * s + 1.7 * layer + 0.6 + 1.3 * ph;
  let turn = ribbonCos(twist, t1);
  let facing = abs(turn);
  let width = (0.23 - 0.08 * far) * (0.12 + 0.88 * facing) + 0.002;
  let w = dist / width;
  let side = turn / (facing + 0.12);

  let focus = smoothstep(-0.4, 0.8, sin(0.9 * s + 1.3 * layer + 0.5 - ph));
  let px = u.scale / min(u.full.x, u.full.y);
  let soft = 1.5 * px + (0.004 + 0.05 * u.blur) * (1.0 - focus) + 0.04 * far * (0.4 + u.blur);
  let alpha = 1.0 - smoothstep(width - soft, width + soft, abs(dist));

  let slide = 0.22 * sin(0.8 * s + 2.3 * layer + ph);
  let across = clamp(0.5 + 0.5 * w * side + slide, 0.0, 1.0);
  var col = ramp(across);
  col = labMix(col, u.bg, 0.18 * (1.0 - smoothstep(-0.6, 0.0, side)) + 0.25 * far);
  let curl = exp(-pow((w * side - 0.25) / 0.45, 2.0)) * facing;
  col.x += (0.07 - 0.05 * lightBg) * curl;
  let lit = abs(0.85 * turn - 0.5 * turnSin(twist, t1));
  col.x *= mix(mix(0.62, 0.84, lightBg), 1.04, lit);
  col.x += 0.024 * (1.0 - u.blur) * focus * facing * sin(w * 120.0) * (1.0 - far);
  let edge = smoothstep(0.7, 1.0, abs(w)) * facing;
  col = labMix(col, labMix(ramp(1.0 - across), vec3f(1.0, 0.0, 0.0), 0.5 - 0.5 * lightBg), 0.35 * edge);

  let opacity = mix(0.97, 0.88, lightBg) - 0.3 * far;
  let halo = exp(-max(abs(dist) - width, 0.0) / (0.03 + 0.08 * u.blur)) * (1.0 - lightBg);
  lab = labMix(lab, col, 0.22 * halo * opacity);
  lab = labMix(lab, col, alpha * opacity);
  let crease = exp(-pow(dist / (0.003 + soft), 2.0)) * pow(1.0 - facing, 6.0);
  let hot = labMix(ramp(0.5), vec3f(1.0, 0.0, 0.0), 0.6 - 0.6 * lightBg);
  lab = labMix(lab, hot, clamp(crease * opacity, 0.0, 1.0));
  return lab;
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let sa = seedAngle();
  let t1 = loopTurn();
  let t2 = vec2f(t1.x * t1.x - t1.y * t1.y, 2.0 * t1.x * t1.y);
  let lightBg = smoothstep(0.55, 0.75, u.bg.x);
  let a0 = 0.5 * sin(sa) + 0.25;
  let a1 = a0 - (0.85 + 0.35 * cos(sa * 1.3));
  var lab = u.bg;
  lab = ribbonLayer(lab, p, a1, -0.08 * sin(sa * 1.7), 3.0, 1.0, sa * 1.7, t1, t2, lightBg);
  lab = ribbonLayer(lab, p, a0, 0.06 * cos(sa * 2.1), 1.0, 0.0, sa * 1.7, t1, t2, lightBg);
  return filmGrade(lab);
}
`;
