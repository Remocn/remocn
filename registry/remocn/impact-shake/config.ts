import { impactShakeExampleCode } from "@/components/docs/examples/impact-shake-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

// Shake, dust and squash have all died out about 23 frames after the hit.
const SETTLE = 23;
const HOLD = 20;

function durationOf(values: Record<string, unknown>) {
  const impact = typeof values.impact === "number" ? values.impact : 7;
  const speed =
    typeof values.speed === "number" && values.speed > 0 ? values.speed : 1;
  return Math.ceil((impact + SETTLE) / speed) + HOLD;
}

export const impactShakeConfig: ComponentConfig = {
  componentName: "ImpactShake",
  importPath: "@/components/remocn/impact-shake",
  controls: {
    text: { type: "text-content", default: "LAUNCH", description: "Text" },
    intensity: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      description: "Intensity",
      hiddenFromList: false,
    },
    impact: {
      type: "number",
      default: 7,
      min: 2,
      max: 30,
      step: 1,
      description: "Impact frame",
      hiddenFromList: false,
    },
    foregroundColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Foreground",
    },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
    seed: {
      type: "number",
      default: 1,
      min: 1,
      max: 24,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 50,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: impactShakeExampleCode,
};
