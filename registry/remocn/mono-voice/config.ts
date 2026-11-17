import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    voiceAt: {
      type: "number",
      default: 28,
      min: 0,
      max: 90,
      step: 1,
      description: "Voice at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Inter Tight" }),
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
