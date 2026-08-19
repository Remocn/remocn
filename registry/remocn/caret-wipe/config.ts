import { caretWipeExampleCode } from "@/components/docs/examples/caret-wipe-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caretWipeConfig: ComponentConfig = {
  componentName: "caretWipe",
  importPath: "@/components/remocn/caret-wipe",
  controls: {
    direction: {
      type: "enum",
      default: "right",
      variants: {
        left: {},
        right: {},
      },
      description: "Direction",
    },
    caretColor: {
      type: "color",
      default: "#C3E88D",
      description: "Caret",
    },
    caretWidth: {
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      description: "Caret width",
      hiddenFromList: false,
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0d0d10" },
  snippet: caretWipeExampleCode,
};
