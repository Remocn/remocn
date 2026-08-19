import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ImageResponse } from "takumi-js/response";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const asset = (p: string) => path.join(root, p);

const FONT_SIZE = 200;
const MARK_HEIGHT = FONT_SIZE * 0.76;
const MARK_WIDTH = MARK_HEIGHT * (124.06 / 134.26);
const MARK_BASELINE_LIFT = FONT_SIZE * 0.2;
const CANVAS = { width: 1400, height: 500 };

const VARIANTS = [
  { color: "#ffffff", output: "public/logo-wordmark.png" },
  { color: "#0a0a0a", output: "public/logo-wordmark-dark.png" },
];

const manrope700 = readFileSync(asset("app/og/fonts/manrope-700.woff2"));

function markDataUri(color: string) {
  const svg = readFileSync(asset("public/logo-mark.svg"), "utf8").replace(
    /currentColor/g,
    color,
  );
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function render(color: string, output: string) {
  const response = new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "flex-end",
        justifyContent: "center",
        fontFamily: "Manrope",
      }}
    >
      {/** biome-ignore lint/performance/noImgElement: satori renders plain img only */}
      <img
        src={markDataUri(color)}
        width={MARK_WIDTH}
        height={MARK_HEIGHT}
        alt=""
        style={{ marginBottom: MARK_BASELINE_LIFT }}
      />
      <span
        style={{
          color,
          fontSize: FONT_SIZE,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -FONT_SIZE * 0.02,
          marginLeft: FONT_SIZE * 0.04,
        }}
      >
        emocn
      </span>
    </div>,
    {
      ...CANVAS,
      fonts: [
        { name: "Manrope", data: manrope700, weight: 700, style: "normal" },
      ],
    },
  );

  const raw = Buffer.from(await response.arrayBuffer());
  const trimmed = await sharp(raw)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 })
    .extend({
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  writeFileSync(asset(output), trimmed);
  const { width, height } = await sharp(trimmed).metadata();
  console.log(`${output} ✓ ${width}×${height}`);
}

async function main() {
  for (const variant of VARIANTS) {
    await render(variant.color, variant.output);
  }
}

main().catch((err) => {
  console.error("\nrender-logo failed:", err);
  process.exit(1);
});
