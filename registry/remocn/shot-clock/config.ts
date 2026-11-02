import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shotClockConfig: ComponentConfig = {
  componentName: "ShotClock",
  importPath: "@/components/remocn/shot-clock",
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
    alarm: {
      type: "color",
      default: "#FF4433",
      description: "Alarm",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Shipped",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "at the buzzer",
      description: "Subtitle",
    },
    label: {
      type: "text-content",
      default: "Shot clock",
      description: "Label",
    },
    period: {
      type: "text-content",
      default: "Q4 · 00:24",
      description: "Period",
    },
    from: {
      type: "number",
      default: 24,
      min: 0,
      max: 72,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    tenthsBelow: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Tenths below",
      hiddenFromList: false,
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
