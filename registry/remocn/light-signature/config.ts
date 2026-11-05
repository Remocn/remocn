import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lightSignatureConfig: ComponentConfig = {
  componentName: "LightSignature",
  importPath: "@/components/remocn/light-signature",
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
    eyebrow: {
      type: "text-content",
      default: "The all-new",
      description: "Eyebrow",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    tagline: {
      type: "text-content",
      default: "Launch-video scenes, ready to render.",
      description: "Tagline",
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
