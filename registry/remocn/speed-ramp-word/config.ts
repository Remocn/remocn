import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const speedRampWordConfig: ComponentConfig = {
  componentName: "SpeedRampWord",
  importPath: "@/components/remocn/speed-ramp-word",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    text: {
      type: "text-content",
      default: "Everything changes in an instant.",
      description: "Text",
    },
    keyWord: {
      type: "text-content",
      default: "instant",
      description: "Key word",
    },
    hud: {
      type: "boolean",
      default: true,
      description: "Hud",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 121,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
