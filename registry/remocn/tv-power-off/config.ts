import { tvPowerOffExampleCode } from "@/components/docs/examples/tv-power-off-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tvPowerOffConfig: ComponentConfig = {
  componentName: "TvPowerOff",
  importPath: "@/components/remocn/tv-power-off",
  controls: {
    durationInFrames: {
      type: "number",
      min: 8,
      max: 30,
      step: 1,
      default: 18,
      description: "Duration",
      hiddenFromList: false,
    },
    gain: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 1,
      description: "Surge",
      hiddenFromList: false,
    },
    afterglow: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 1,
      description: "Afterglow",
      hiddenFromList: false,
    },
    phosphor: {
      type: "color",
      default: "#d8ecff",
      description: "Phosphor",
    },
  },
  durationInFrames: 62,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#050505" },
  snippet: tvPowerOffExampleCode,
};
