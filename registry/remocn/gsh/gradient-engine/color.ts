export type Rgb = readonly [number, number, number];
export type Oklab = readonly [number, number, number];

const FALLBACK_RGB: Rgb = [0.5, 0.5, 0.5];

function srgbToLinear(c: number): number {
  return c <= 0.040_45 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number): number {
  return c <= 0.003_130_8 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** sRGB (0-1, gamma encoded) to OKLab. */
export function srgbToOklab(rgb: Rgb): Oklab {
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  const l = Math.cbrt(
    0.412_221_470_8 * r + 0.536_332_536_3 * g + 0.051_445_992_9 * b,
  );
  const m = Math.cbrt(
    0.211_903_498_2 * r + 0.680_699_545_1 * g + 0.107_396_956_6 * b,
  );
  const s = Math.cbrt(
    0.088_302_461_9 * r + 0.281_718_837_6 * g + 0.629_978_700_5 * b,
  );
  return [
    0.210_454_255_3 * l + 0.793_617_785 * m - 0.004_072_046_8 * s,
    1.977_998_495_1 * l - 2.428_592_205 * m + 0.450_593_709_9 * s,
    0.025_904_037_1 * l + 0.782_771_766_2 * m - 0.808_675_766 * s,
  ];
}

/** OKLab to sRGB (0-1, gamma encoded, clamped). */
export function oklabToSrgb(lab: Oklab): Rgb {
  const l = (lab[0] + 0.396_337_777_4 * lab[1] + 0.215_803_757_3 * lab[2]) ** 3;
  const m = (lab[0] - 0.105_561_345_8 * lab[1] - 0.063_854_172_8 * lab[2]) ** 3;
  const s = (lab[0] - 0.089_484_177_5 * lab[1] - 1.291_485_548 * lab[2]) ** 3;
  const out = [
    4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s,
    -1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s,
    -0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s,
  ].map((c) => Math.min(1, Math.max(0, linearToSrgb(c))));
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0];
}

const HEX_RE = /^#([0-9a-f]{3,8})$/i;
const RGB_RE = /^rgba?\(\s*([^)]+)\)$/i;

function parseChannel(token: string): number | null {
  const value = Number.parseFloat(token);
  if (Number.isNaN(value)) {
    return null;
  }
  return token.endsWith("%") ? value / 100 : value / 255;
}

/** Parses hex and rgb() colours without a DOM. Returns null for anything else. */
export function parseColorLiteral(value: string): Rgb | null {
  const input = value.trim();
  const hex = HEX_RE.exec(input)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((ch) => ch + ch).join("") : hex;
    if (full.length !== 6 && full.length !== 8) {
      return null;
    }
    return [
      Number.parseInt(full.slice(0, 2), 16) / 255,
      Number.parseInt(full.slice(2, 4), 16) / 255,
      Number.parseInt(full.slice(4, 6), 16) / 255,
    ];
  }
  const body = RGB_RE.exec(input)?.[1];
  if (body) {
    const parts = body
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3);
    const channels = parts.map(parseChannel);
    const [r, g, b] = channels;
    if (channels.length === 3 && r != null && g != null && b != null) {
      return [r, g, b];
    }
  }
  return null;
}

type Probe = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
let probe: Probe | null | undefined;

function getProbe(): Probe | null {
  if (probe !== undefined) {
    return probe;
  }
  probe = null;
  // OffscreenCanvas first: it works in Workers and never touches document.
  if (typeof OffscreenCanvas !== "undefined") {
    probe = new OffscreenCanvas(1, 1).getContext("2d", {
      willReadFrequently: true,
    });
  } else if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext("2d", { willReadFrequently: true });
  }
  return probe;
}

/** Lets the browser parse any CSS colour (oklch, hsl, names...) by painting one pixel. */
function probeColor(value: string): Rgb | null {
  const ctx = getProbe();
  if (!ctx) {
    return null;
  }
  const sentinel = "#010203";
  ctx.fillStyle = sentinel;
  ctx.fillStyle = value;
  if (ctx.fillStyle === sentinel && value.trim().toLowerCase() !== sentinel) {
    return null;
  }
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

const VAR_RE = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/;

/** Expands var(--x) (with fallbacks, nested) against an element's computed style. */
export function resolveCssVariables(
  value: string,
  scope: Element | null,
  depth = 0,
): string {
  const match = VAR_RE.exec(value.trim());
  if (!match || depth > 8) {
    return value.trim();
  }
  const [, name = "", fallback] = match;
  const resolved =
    scope && typeof getComputedStyle !== "undefined"
      ? getComputedStyle(scope).getPropertyValue(name).trim()
      : "";
  if (resolved) {
    return resolveCssVariables(resolved, scope, depth + 1);
  }
  return fallback ? resolveCssVariables(fallback, scope, depth + 1) : "";
}

const literalCache = new Map<string, Rgb>();

/** Resolves any CSS colour, including var(--x), to sRGB. Unknown colours become mid grey. */
export function resolveColor(value: string, scope: Element | null): Rgb {
  const literal = resolveCssVariables(value, scope);
  const cached = literalCache.get(literal);
  if (cached) {
    return cached;
  }
  const rgb = parseColorLiteral(literal) ?? probeColor(literal) ?? FALLBACK_RGB;
  if (literalCache.size > 256) {
    literalCache.clear();
  }
  literalCache.set(literal, rgb);
  return rgb;
}

export function hasCssVariable(values: readonly string[]): boolean {
  return values.some((value) => value.includes("var("));
}

function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, channel)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Resolves any CSS colour (var(), oklch, names...) to a concrete #rrggbb. */
export function resolveColorToHex(
  value: string,
  scope: Element | null,
): string {
  return toHex(resolveColor(value, scope));
}
