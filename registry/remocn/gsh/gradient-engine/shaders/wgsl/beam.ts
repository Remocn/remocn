/**
 * WGSL twin of the beam kind's GLSL (beam.ts): same maths, line
 * for line, against shaders/wgsl-common.ts. Imported only when the WebGPU
 * backend draws this kind, so WebGL-only pages never download it.
 */
export const wgsl = /* wgsl */ `
// Light from a point on or beyond the frame edge, spread into a cone of
// rays. The rays are noise sampled across the cone's angle, so they are
// fine across and long along the beam. scale widens the cone; warp sets
// ray contrast.

// One beam. Returns glow, the palette position, and how much of the light
// is the white-hot core and needle.
fn beamLight(p: vec2f, source: vec2f, aim: f32, width: f32, reach: f32, layer: f32, omni: f32) -> vec3f {
  var axis = vec2f(sin(aim), cos(aim));
  var v = p - source;
  var dist = length(v);
  var along = dot(v, axis);
  var across = axis.x * v.y - axis.y * v.x;
  var ang = atan2(across, max(along, 1e-3));
  // GLSL calls this u, which would shadow the uniform block here.
  var cu = ang / width;
  var forward = smoothstep(-0.02, 0.06, along);
  var cone = exp(-cu * cu) * forward;

  // Rays: two scales of noise across the cone, stretched along it. A flare
  // rays out all round, so it samples on the unit circle instead, which
  // has no seam behind the source.
  var dir = v / max(dist, 1e-4);
  var coarseAt = select(vec2f(cu * 2.2, dist * 0.35), dir * 3.2 + vec2f(dist * 0.35, 0.0), omni > 0.5);
  var fineAt = select(vec2f(cu * 6.0 + 13.0, dist * 0.9), dir * 9.0 + vec2f(13.0, dist * 0.9), omni > 0.5);
  var coarse = flowNoise(coarseAt, layer);
  var fine = flowNoise(fineAt, layer + 1.0);
  cone = mix(cone, 0.55 + 0.45 * exp(-cu * cu), omni);
  forward = mix(forward, 1.0, omni);
  var fineAmount = 0.55 * (1.0 - 0.6 * u.blur);
  var rays = 0.5 + 0.5 * (coarse + fineAmount * fine) / (1.0 + fineAmount);
  rays = mix(1.0, smoothstep(0.1, 0.95, rays) * 1.5, u.warp);

  var fall = exp(-dist / reach);
  var core = exp(-dist / (0.05 + 0.05 * u.blur));
  // A hairline down the axis, the brightest ray.
  var needle = exp(-pow(across / (0.0035 + 0.01 * u.blur), 2.0)) * exp(-dist / (0.6 * reach)) * smoothstep(0.0, 0.03, along) * u.warp * (1.0 - 0.5 * omni);
  var haze = exp(-dist / (0.4 + 0.5 * u.blur));
  // A broad, soft fill under the rays gives the beam volume.
  var fill = mix(exp(-cu * cu * 0.35), 1.0, omni) * forward * fall;

  var glow = cone * fall * (0.2 + 0.8 * rays) + 0.22 * fill + 0.85 * core + 0.55 * needle + 0.08 * haze;
  // Near the source the light is colour 0; colour takes over along the
  // beam and at the cone's edges.
  var t = clamp(dist / (reach * 1.4) + 0.35 * abs(cu) * (1.0 - omni) - 0.25 * core, 0.0, 1.0);
  return vec3f(glow, t, clamp(core + needle, 0.0, 1.0));
}

fn kindColor(p: vec2f, uv: vec2f) -> vec3f {
  var lightBg = smoothstep(0.55, 0.85, u.bg.x);
  var h = frameHalf();
  // The seed picks the source: bottom centre, a bottom corner, the top
  // edge, a top corner, a side edge, two crossing beams from the bottom
  // corners, a source far below or above the frame, so only its rays
  // reach in, or a flare inside the frame raying out all round.
  var framing = floor(fract(u.seed.x * 0.0731 + 0.5) * 9.0);
  var side = sign(u.seed.y + 0.01);
  var source = vec2f(0.0, -h.y - 0.02);
  var aim = 0.0;
  var width = 0.3 * u.scale;
  var reach = 0.55 + 0.6 * u.scale;
  if (framing == 1.0) {
    source = vec2f(-side * (h.x - 0.06), -h.y - 0.02);
    aim = side * 0.62;
  } else if (framing == 2.0) {
    source = vec2f(0.0, h.y + 0.02);
    aim = 3.14159265;
  } else if (framing == 3.0) {
    source = vec2f(-side * (h.x - 0.1), h.y + 0.02);
    aim = 3.14159265 - side * 0.5;
  } else if (framing == 4.0) {
    source = vec2f(-side * (h.x + 0.02), -0.12);
    aim = side * 1.32;
  } else if (framing == 5.0) {
    source = vec2f(-(h.x - 0.12), -h.y - 0.02);
    aim = 0.42;
    width *= 0.7;
  } else if (framing == 6.0) {
    source = vec2f(0.3 * h.x * side, -h.y - 1.0);
    aim = -side * 0.12;
    width *= 0.45;
    reach *= 2.4;
  } else if (framing == 7.0) {
    source = vec2f(0.3 * h.x * side, h.y + 1.0);
    aim = 3.14159265 + side * 0.15;
    width *= 0.45;
    reach *= 2.4;
  } else if (framing == 8.0) {
    source = vec2f(0.22 * h.x * side, 0.04);
    aim = seedAngle();
    width = 0.6 * u.scale;
    reach = 0.3 + 0.3 * u.scale;
  }
  // The cone sways a little through the loop.
  var sway = 0.22 * u.loopv.y;
  var light = beamLight(p, source, aim + sway, width, reach, 1.0, select(0.0, 1.0, framing == 8.0));
  if (framing == 5.0) {
    // The second beam mirrors the first and sways the other way.
    var twin = beamLight(p, vec2f(-source.x, source.y), -aim - sway, width, reach, 4.0, 0.0);
    var total = max(light.x + twin.x, 1e-4);
    light = vec3f(light.x + twin.x, (light.x * light.y + twin.x * twin.y) / total, max(light.z, twin.z));
  }
  var glow = light.x;

  var col = ramp(light.y);
  col = labMix(col, paletteColor(0), light.z);
  var lab = labMix(u.bg, col, clamp(glow, 0.0, 1.0));
  lab.x += 0.08 * max(glow - 0.9, 0.0) * (1.0 - lightBg);
  return filmGrade(lab);
}
`;
