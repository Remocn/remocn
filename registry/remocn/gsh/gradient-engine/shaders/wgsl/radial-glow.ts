/**
 * WGSL twin of the radial-glow kind's GLSL (radial-glow.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  let lightBg = smoothstep(0.55, 0.85, u.bg.x);
  let h = frameHalf();
  let framing = fract(u.seed.x * 0.0731 + 0.5);
  var radius = 0.34;
  var centre = vec2f(0.0, -0.3);
  var spread = 0.28;
  if (framing > 0.7) {
    radius = 0.75;
    centre = vec2f(0.35 * h.x * sign(u.seed.y), -0.95);
    spread = 0.1;
  } else if (framing > 0.4) {
    radius = 0.26;
    centre = vec2f(0.0, -0.04);
    spread = 0.6;
  }
  radius /= u.scale;
  centre.y -= 0.04 * flowNoise(vec2f(0.3, 0.7), 1.0);
  let d = p - centre;
  let r = length(d);
  let dir = d / max(r, 1e-4);
  let x = r - radius;
  let xo = max(x, 0.0);
  let soft = (0.01 + 0.045 * u.blur) * (1.0 + 5.0 * lightBg);

  let sweep = 1.3 * u.loopv.x;
  let up = vec2f(sin(sweep), cos(sweep));
  let facing = 0.5 + 0.5 * dot(dir, up) * smoothstep(0.0, radius, r);
  let key = mix(spread, 1.0, facing * facing);

  var rays = 0.5 + 0.5 * flowNoise(dir * 2.6 - vec2f(0.0, r * 0.35), 2.0);
  rays = mix(rays, 0.5 + 0.5 * flowNoise(dir * 6.0 - vec2f(r * 0.5, 0.0), 3.0), 0.35);
  rays = mix(1.0, 0.25 + 1.3 * rays * rays, u.warp);

  let rim = exp(-xo / soft);
  let corona = exp(-xo / (0.05 + 0.1 * u.blur));
  let haze = exp(-xo / (0.3 + 0.3 * u.blur));
  let ringD = (x - 0.05 - 0.04 * u.blur) / ((0.018 + 0.03 * u.blur) * (1.0 + 2.0 * lightBg));
  let ring = exp(-ringD * ringD);
  var glow = (rim + 0.5 * corona * (0.6 + 0.4 * rays) + (0.4 + 0.35 * lightBg) * haze * mix(1.0, rays, 0.8) + 0.35 * ring) * key;

  let inside = 1.0 - smoothstep(-soft * 0.5, soft * 0.5, x);
  let innerRim = exp(min(x, 0.0) / (0.01 + 0.12 * lightBg));
  glow = mix(glow, (0.3 * innerRim + 0.06) * key, inside * (1.0 - 0.85 * lightBg));

  let reach = clamp(xo / (0.6 + 0.3 * u.blur), 0.0, 1.0);
  let t = mix(sqrt(reach), smoothstep(0.0, 0.7, reach), lightBg);
  var col = ramp(t);
  let hot = vec3f(min(1.0, paletteColor(0).x + 0.06), paletteColor(0).yz * 0.4);
  col = labMix(col, hot, rim * (1.0 - inside) * (0.45 + 0.5 * lightBg));
  col = labMix(col, paletteColor(2), ring * (0.6 - 0.35 * lightBg) * (1.0 - rim));

  var base = u.bg;
  base.x *= mix(1.0, mix(0.35, 1.0, lightBg), inside);
  var lab = labMix(base, col, clamp(glow, 0.0, 1.0));
  lab.x += 0.1 * max(glow - 0.9, 0.0);
  lab.x *= vignette(p, 0.3 * (1.0 - lightBg));
  return filmGrade(lab);
}
`;
