import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pullInConfig: ComponentConfig = {
  componentName: "PullIn",
  importPath: "@/components/remocn/pull-in",
  lists: {
    places: {
      default: ["vertical.", "4K.", "your codebase."],
      description: "Places",
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
    lead: {
      type: "text-content",
      default: "Now in",
      description: "Lead",
    },
    hold: {
      type: "number",
      default: 24,
      min: 0,
      max: 72,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 1.25,
      min: 0,
      max: 4,
      step: 0.05,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    brake: {
      type: "number",
      default: 20,
      min: 8,
      max: 40,
      step: 1,
      description: "Brake (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Plus Jakarta Sans" }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
