import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const trackingInConfig: ComponentConfig = {
  componentName: "TrackingIn",
  importPath: "@/components/remocn/tracking-in",
  controls: {
    text: {
      type: "text-content",
      default: "tracking in",
      description: "Text",
    },
    startTracking: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 0.5,
      description: "Start tracking (em)",
      hiddenFromList: false,
    },
    startBlur: {
      type: "number",
      min: 0,
      max: 40,
      step: 1,
      default: 12,
      description: "Start blur",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 200,
      step: 1,
      default: 96,
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
      default: "700",
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
