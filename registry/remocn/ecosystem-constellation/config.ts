import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ecosystemConstellationConfig: ComponentConfig = {
  componentName: "EcosystemConstellation",
  importPath: "@/components/remocn/ecosystem-constellation",
  controls: {
    satelliteCount: {
      type: "number",
      min: 3,
      max: 8,
      step: 1,
      default: 6,
      description: "Satellite count",
      hiddenFromList: false,
    },
    centerLabel: {
      type: "text-content",
      default: "V",
      description: "Center label",
    },
    accentColor: {
      type: "color",
      default: "#a855f7",
      description: "Accent color",
    },
  },
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: {
    type: "gradient",
    value: "radial-gradient(ellipse at center, #14101e 0%, #05030a 75%)",
  },
};
