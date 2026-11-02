import { clothRevealExampleCode } from "@/components/docs/examples/cloth-reveal-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

// At the defaults the yank clears the frame about 28 frames after the tug starts.
const PULL = 28;
const HOLD = 30;

function durationOf(values: Record<string, unknown>) {
  const delay = typeof values.delay === "number" ? values.delay : 6;
  const speed =
    typeof values.speed === "number" && values.speed > 0 ? values.speed : 1;
  return Math.ceil((delay + PULL) / speed) + HOLD;
}

export const clothRevealConfig: ComponentConfig = {
  componentName: "ClothReveal",
  importPath: "@/components/remocn/cloth-reveal",
  controls: {
    direction: {
      type: "enum",
      default: "right",
      variants: { right: {}, left: {}, up: {}, down: {} },
      description: "Direction",
    },
    clothColor: { type: "color", default: "#E5322D", description: "Cloth" },
    undersideColor: {
      type: "color",
      default: "#8E1A16",
      description: "Underside",
    },
    background: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
    delay: {
      type: "number",
      default: 6,
      min: 0,
      max: 30,
      step: 1,
      description: "Delay",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 2,
      min: 1,
      max: 24,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 60,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: clothRevealExampleCode,
};
