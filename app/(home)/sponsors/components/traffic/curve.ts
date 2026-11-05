export type Point = { x: number; y: number };

/** Evenly spaced points across `width`, `y` mapped by the caller. */
export function spread(
  values: number[],
  width: number,
  toY: (value: number) => number,
): Point[] {
  const step = width / Math.max(values.length - 1, 1);
  return values.map((value, i) => ({ x: i * step, y: toY(value) }));
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom spline through every point, as cubic Bézier segments. */
export function smoothPath(points: Point[]) {
  if (points.length === 0) return "";
  const [first] = points;
  let d = `M${round(first.x)},${round(first.y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p2.x)},${round(p2.y)}`;
  }
  return d;
}

/** The line closed down to `baseline`, for the area fill. */
export function areaPath(points: Point[], baseline: number) {
  if (points.length === 0) return "";
  const last = points[points.length - 1];
  return `${smoothPath(points)} L${round(last.x)},${baseline} L${round(points[0].x)},${baseline} Z`;
}
