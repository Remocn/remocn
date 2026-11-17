import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const introducingConfig: ComponentConfig = {
  componentName: "Introducing",
  importPath: "@/components/remocn/introducing",
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
      default: "Introducing",
      description: "Eyebrow",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    tagline: {
      type: "text-content",
      default: "Launch-video scenes for Remotion. Copy, paste, render.",
      description: "Tagline",
    },
    pass: {
      type: "number",
      default: 44,
      min: 12,
      max: 80,
      step: 1,
      description: "Beam pass (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
