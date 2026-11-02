import { gravityPileExampleCode } from "@/components/docs/examples/gravity-pile-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const HOLD = 26;

// The heap goes to sleep 18 frames after it starts settling, and weaker
// gravity starts that later (see `simulate` in the component).
function durationOf(values: Record<string, unknown>) {
  const gravity = typeof values.gravity === "number" ? values.gravity : 1;
  const speed =
    typeof values.speed === "number" && values.speed > 0 ? values.speed : 1;
  const settled = Math.min(150, 46 / Math.sqrt(Math.max(0.2, gravity)) + 18);
  return Math.ceil(settled / speed) + HOLD;
}

export const gravityPileConfig: ComponentConfig = {
  componentName: "GravityPile",
  importPath: "@/components/remocn/gravity-pile",
  controls: {
    count: {
      type: "number",
      default: 30,
      min: 4,
      max: 60,
      step: 1,
      description: "Bodies",
      hiddenFromList: false,
    },
    gravity: {
      type: "number",
      default: 1,
      min: 0.5,
      max: 2.5,
      step: 0.1,
      description: "Gravity",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 7,
      min: 1,
      max: 40,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    accentColor: { type: "color", default: "#E5322D", description: "Accent" },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 90,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: gravityPileExampleCode,
};
