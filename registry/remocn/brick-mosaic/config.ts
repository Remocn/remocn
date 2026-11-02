import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { brickMosaicDefaults, getBrickMosaicLength } from ".";

const HOLD = 29;

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function durationOf(values: Record<string, unknown>) {
  const motion = getBrickMosaicLength(
    numberOr(values.rows, brickMosaicDefaults.rows),
    numberOr(values.cols, brickMosaicDefaults.cols),
    numberOr(values.rowDelay, brickMosaicDefaults.rowDelay),
  );
  const speed = numberOr(values.speed, 1);
  return Math.ceil(motion / (speed > 0 ? speed : 1)) + HOLD;
}

export const brickMosaicConfig: ComponentConfig = {
  componentName: "BrickMosaic",
  importPath: "@/components/remocn/brick-mosaic",
  controls: {
    cols: {
      type: "number",
      default: 24,
      min: 6,
      max: 40,
      step: 1,
      description: "Columns",
      hiddenFromList: false,
    },
    rows: {
      type: "number",
      default: 14,
      min: 4,
      max: 24,
      step: 1,
      description: "Rows",
      hiddenFromList: false,
    },
    rowDelay: {
      type: "number",
      default: 3,
      min: 1,
      max: 8,
      step: 1,
      description: "Row delay",
      hiddenFromList: false,
    },
    background: {
      type: "color",
      default: "#111111",
      description: "Baseplate",
    },
  },
  durationInFrames: 85,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
};
