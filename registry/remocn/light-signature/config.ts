import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    sweep: {
      type: "number",
      default: 40,
      min: 16,
      max: 80,
      step: 2,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    glow: {
      type: "number",
      default: 6,
      min: 0,
      max: 20,
      step: 1,
      description: "Glow",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    lightColor: {
      type: "color",
      default: "#e0202e",
      description: "Light color",
    },
    ...sceneControls({ font: "Geist", grain: true }),
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
