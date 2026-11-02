function bayer(size: number): number[][] {
  if (size === 1) return [[0]];
  const half = bayer(size / 2);
  const out: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0),
  );
  for (let y = 0; y < size / 2; y++) {
    for (let x = 0; x < size / 2; x++) {
      const v = half[y][x] * 4;
      out[y][x] = v;
      out[y][x + size / 2] = v + 2;
      out[y + size / 2][x] = v + 3;
      out[y + size / 2][x + size / 2] = v + 1;
    }
  }
  return out;
}

const MATRIX = bayer(8);
const LEVELS = 64;

const ANGLE = (115 * Math.PI) / 180;
const DIR_X = Math.sin(ANGLE);
const DIR_Y = -Math.cos(ANGLE);

export type SweepOptions = {
  canvas: HTMLCanvasElement;
  layer: HTMLElement;
  width: number;
  height: number;
  cell: number;
  band: number;
  passes: number;
  duration: number;
  color: string;
  onDone: () => void;
};

function project(x: number, y: number, width: number, height: number) {
  const corners = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ].map(([cx, cy]) => cx * DIR_X + cy * DIR_Y);
  const min = Math.min(...corners);
  const max = Math.max(...corners);
  return (x * DIR_X + y * DIR_Y - min) / (max - min);
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function runDitherSweep(options: SweepOptions) {
  const {
    canvas,
    layer,
    width,
    height,
    cell,
    band,
    passes,
    duration,
    color,
    onDone,
  } = options;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext("2d");
  if (!context) {
    onDone();
    return () => {};
  }
  context.scale(ratio, ratio);
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const positions: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push(
        project((col + 0.5) * cell, (row + 0.5) * cell, width, height),
      );
    }
  }
  const dot = Math.max(1, cell - 1);
  const total = duration * (passes + 1);
  const start = performance.now();
  let frame = 0;

  const draw = (now: number) => {
    const elapsed = Math.min((now - start) / total, 1);
    const pass = Math.min(Math.floor(elapsed * (passes + 1)), passes);
    const local = easeInOut(elapsed * (passes + 1) - pass);
    const reveal = pass === passes;
    const edge = -band + local * (1 + 2 * band);

    context.clearRect(0, 0, width, height);
    context.fillStyle = color;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const u = positions[row * cols + col];
        const distance = Math.abs(u - edge) / band;
        if (distance >= 1) continue;
        const density = (1 - distance) ** 1.6;
        if (MATRIX[row % 8][col % 8] < density * LEVELS) {
          context.fillRect(col * cell, row * cell, dot, dot);
        }
      }
    }

    const cut = reveal ? edge * 100 : -100;
    const mask = `linear-gradient(${115}deg, #000 ${cut - 0.5}%, transparent ${cut + 0.5}%)`;
    layer.style.maskImage = elapsed >= 1 ? "" : mask;
    layer.style.webkitMaskImage = elapsed >= 1 ? "" : mask;

    if (elapsed < 1) {
      frame = requestAnimationFrame(draw);
    } else {
      context.clearRect(0, 0, width, height);
      onDone();
    }
  };
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
}
