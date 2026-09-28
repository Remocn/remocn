import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getTruchetFlipDuration } from ".";

function durationOf(values: Record<string, unknown>) {
  const speed = typeof values.speed === "number" ? values.speed : undefined;
  const passes = typeof values.passes === "number" ? values.passes : undefined;
  return getTruchetFlipDuration({ speed, passes, loop: values.loop === true });
}

export const truchetFlipConfig: ComponentConfig = {
  componentName: "TruchetFlip",
  importPath: "@/components/remocn/truchet-flip",
  controls: {
    tiles: {
      type: "number",
      default: 10,
      min: 4,
      max: 24,
      step: 1,
      description: "Tiles across",
      hiddenFromList: false,
    },
    weight: {
      type: "number",
      default: 0.2,
      min: 0.04,
      max: 0.34,
      step: 0.01,
      description: "Stroke weight",
      hiddenFromList: false,
    },
    passes: {
      type: "number",
      default: 2,
      min: 0,
      max: 4,
      step: 1,
      description: "Passes",
      hiddenFromList: false,
    },
    waveMode: {
      type: "enum",
      default: "radial",
      variants: { radial: {}, diagonal: {}, random: {} },
      description: "Wave",
    },
    resolve: {
      type: "enum",
      default: "rings",
      variants: { rings: {}, field: {}, silhouette: {} },
      description: "Resolve to",
    },
    variant: {
      type: "enum",
      default: "stroke",
      variants: { stroke: {}, filled: {} },
      description: "Variant",
    },
    color: { type: "color", default: "#ffffff", description: "Line color" },
    secondaryColor: {
      type: "color",
      default: "#ffffff",
      description: "Alternate tiles",
    },
    seed: {
      type: "number",
      default: 1,
      min: 1,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    loop: { type: "boolean", default: false, description: "Loop" },
  },
  durationInFrames: 120,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#002fa7" },
};
