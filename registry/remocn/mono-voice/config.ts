import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const monoVoiceConfig: ComponentConfig = {
  componentName: "MonoVoice",
  importPath: "@/components/remocn/mono-voice",
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
    text: {
      type: "text-content",
      default: "Same script.\nA whole new\ndelivery.",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "delivery.",
      description: "Highlight",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
