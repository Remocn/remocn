import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const focusFrontSwapConfig: ComponentConfig = {
  componentName: "FocusFrontSwap",
  importPath: "@/components/remocn/focus-front-swap",
  lists: {
    lines: {
      default: [
        "Remocn knows the beat",
        "You describe it once",
        "Ship it {tonight}.",
      ],
      description: "Lines",
    },
  },
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
    logo: {
      type: "boolean",
      default: true,
      description: "Logo",
    },
    blur: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Blur",
      hiddenFromList: false,
    },
    swap: {
      type: "number",
      default: 30,
      min: 12,
      max: 60,
      step: 1,
      description: "Swap (frames)",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 300,
      max: 400,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
