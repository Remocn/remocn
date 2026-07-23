import { caretWipeExampleCode } from "@/components/docs/examples/caret-wipe-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caretWipeConfig: ComponentConfig = {
  componentName: "caretWipe",
  importPath: "@/components/remocn/caret-wipe",
  controls: {
    direction: {
      type: "select",
      default: "right",
      options: ["left", "right"],
      label: "Direction",
    },
    caretColor: { type: "color", default: "#C3E88D", label: "Caret" },
    caretWidth: {
      type: "number",
      default: 3,
      min: 1,
      max: 8,
      step: 1,
      label: "Caret width",
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0d0d10" },
  snippet: caretWipeExampleCode,
};
