import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ecosystemConstellationConfig: ComponentConfig = {
  componentName: "EcosystemConstellation",
  importPath: "@/components/remocn/ecosystem-constellation",
  controls: {
    satelliteCount: {
      type: "number",
      default: 6,
      min: 3,
      max: 8,
      step: 1,
      label: "Satellite count",
    },
    centerLabel: {
      type: "text",
      default: "V",
      label: "Center label",
    },
    accentColor: {
      type: "color",
      default: "#a855f7",
      label: "Accent color",
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
