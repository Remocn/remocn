import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const phoneScrollConfig: ComponentConfig = {
  componentName: "PhoneScroll",
  importPath: "@/components/remocn/phone-scroll",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    label: {
      type: "text-content",
      default: "Find your next stay in two taps.",
      description: "Label",
    },
    labelAccent: {
      type: "text-content",
      default: "two taps.",
      description: "Label accent",
    },
    eyebrow: {
      type: "text-content",
      default: "remocn for iOS",
      description: "Eyebrow",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
