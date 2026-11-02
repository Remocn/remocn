import { venetianBlindsExampleCode } from "@/components/docs/examples/venetian-blinds-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const venetianBlindsConfig: ComponentConfig = {
  componentName: "venetianBlinds",
  importPath: "@/components/remocn/venetian-blinds",
  controls: {
    slats: {
      type: "number",
      min: 2,
      max: 32,
      step: 1,
      default: 12,
      description: "Slats",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      min: 0,
      max: 0.9,
      step: 0.05,
      default: 0.55,
      description: "Stagger",
      hiddenFromList: false,
    },
    direction: {
      type: "enum",
      default: "top-down",
      variants: {
        "top-down": {},
        "bottom-up": {},
        center: {},
      },
      description: "Direction",
    },
    shadeColor: {
      type: "color",
      default: "#000000",
      description: "Shade color",
    },
  },
  durationInFrames: 114,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: venetianBlindsExampleCode,
};
