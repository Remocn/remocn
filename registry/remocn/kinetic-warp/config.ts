import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const kineticWarpConfig: ComponentConfig = {
  componentName: "KineticWarp",
  importPath: "@/components/remocn/kinetic-warp",
  controls: {
    text: {
      type: "text-content",
      default: "REM\nOCN",
      description: "Text",
    },
    textColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Color",
    },
    fontFamily: {
      type: "text-content",
      default: "Passion One",
      description: "Font family",
    },
    fontUrl: {
      type: "text-content",
      default:
        "https://fonts.googleapis.com/css2?family=Passion+One:wght@400;700;900&display=block",
      description: "Font URL",
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
    fontSize: {
      type: "number",
      min: 40,
      max: 200,
      step: 0.1,
      default: 107.1,
      description: "Font size",
      hiddenFromList: false,
    },
    layerScale: {
      type: "number",
      min: 100,
      max: 800,
      step: 10,
      default: 480,
      description: "Layer scale (%)",
      hiddenFromList: false,
    },
    keyframeStride: {
      type: "number",
      min: 5,
      max: 40,
      step: 1,
      default: 20,
      description: "Keyframe stride",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
