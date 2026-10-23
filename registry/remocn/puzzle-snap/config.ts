import { puzzleSnapExampleCode } from "@/components/docs/examples/puzzle-snap-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const puzzleSnapConfig: ComponentConfig = {
  componentName: "PuzzleSnap",
  importPath: "@/components/remocn/puzzle-snap",
  controls: {
    square: { type: "boolean", default: true, description: "Square piece" },
    seed: {
      type: "number",
      default: 3,
      min: 1,
      max: 99,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    primaryColor: { type: "color", default: "#E5322D", description: "Primary" },
    secondaryColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Secondary",
    },
    sparkColor: { type: "color", default: "#FFFFFF", description: "Sparks" },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 66,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: puzzleSnapExampleCode,
};
