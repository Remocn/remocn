import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const staggeredFadeUpConfig: ComponentConfig = {
  componentName: "StaggeredFadeUp",
  importPath: "@/components/remocn/staggered-fade-up",
  controls: {
    text: {
      type: "text-content",
      default: "Ship faster with remocn",
      description: "Text",
    },
    staggerDelay: {
      type: "number",
      min: 0,
      max: 30,
      step: 1,
      default: 4,
      description: "Stagger delay",
      hiddenFromList: false,
    },
    distance: {
      type: "number",
      min: 0,
      max: 120,
      step: 1,
      default: 20,
      description: "Distance",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
