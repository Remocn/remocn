export type Vec3 = [number, number, number];
export interface RingFace {
  vertices: Vec3[];
  normal: Vec3;
  center: Vec3;
  bevel: boolean;
  edgeNormals?: [Vec3, Vec3];
}

const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};
const subtract = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const dot = (a: Vec3, b: Vec3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function face(vertices: Vec3[], bevel: boolean): RingFace {
  return {
    vertices,
    normal: normalize(
      cross(
        subtract(vertices[1], vertices[0]),
        subtract(vertices[2], vertices[0]),
      ),
    ),
    center: vertices.reduce<Vec3>(
      (s, p) => [
        s[0] + p[0] / vertices.length,
        s[1] + p[1] / vertices.length,
        s[2] + p[2] / vertices.length,
      ],
      [0, 0, 0],
    ),
    bevel,
  };
}

/** A solid 320-degree annulus with a 40-degree opening and eight chamfered edges. */
export function createRing(segments = 96): RingFace[] {
  const count = Math.max(12, Math.round(segments));
  // Counter-clockwise cross-section: radius, depth. Front faces point toward +Z.
  const profile = [
    [144, 32],
    [210, 32],
    [220, 22],
    [220, -22],
    [210, -32],
    [144, -32],
    [134, -22],
    [134, 22],
  ];
  const section = (i: number): Vec3[] => {
    const angle = ((-18 + (i / count) * 320) * Math.PI) / 180;
    return profile.map(([r, z]) => [
      r * Math.cos(angle),
      r * Math.sin(angle),
      z,
    ]);
  };
  const faces: RingFace[] = [];
  for (let i = 0; i < count; i++) {
    const a = section(i);
    const b = section(i + 1);
    for (let j = 0; j < profile.length; j++) {
      const next = (j + 1) % profile.length;
      const quad = face([a[j], a[next], b[next], b[j]], j % 2 === 1);
      const halfStep = ((160 / count) * Math.PI) / 180;
      // Continuous circumferential normals preserve the flat chamfers while
      // allowing the renderer to shade each strip without visible tessellation.
      quad.edgeNormals = [
        rotate(quad.normal, 0, 0, -halfStep),
        rotate(quad.normal, 0, 0, halfStep),
      ];
      faces.push(quad);
    }
  }
  faces.push(face(section(0).reverse(), false), face(section(count), false));
  return faces;
}

export function rotate(v: Vec3, rx: number, ry: number, rz: number): Vec3 {
  const y = v[1] * Math.cos(rx) - v[2] * Math.sin(rx);
  const z = v[1] * Math.sin(rx) + v[2] * Math.cos(rx);
  const x = v[0] * Math.cos(ry) + z * Math.sin(ry);
  const depth = -v[0] * Math.sin(ry) + z * Math.cos(ry);
  return [
    x * Math.cos(rz) - y * Math.sin(rz),
    x * Math.sin(rz) + y * Math.cos(rz),
    depth,
  ];
}

/** Compute trigonometry once for a whole frame, not for every mesh vertex. */
export function createRotator(rx: number, ry: number, rz: number) {
  const x = rotate([1, 0, 0], rx, ry, rz);
  const y = rotate([0, 1, 0], rx, ry, rz);
  const z = rotate([0, 0, 1], rx, ry, rz);
  return (v: Vec3): Vec3 => [
    x[0] * v[0] + y[0] * v[1] + z[0] * v[2],
    x[1] * v[0] + y[1] * v[1] + z[1] * v[2],
    x[2] * v[0] + y[2] * v[1] + z[2] * v[2],
  ];
}

export function project(
  v: Vec3,
  scale: number,
  x: number,
  y: number,
): [number, number] {
  const perspective = 1100 / Math.max(300, 1100 - v[2] * scale);
  return [x + v[0] * scale * perspective, y + v[1] * scale * perspective];
}

export { normalize };
