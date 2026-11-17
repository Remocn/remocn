import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const negationDropConfig: ComponentConfig = {
  componentName: "NegationDrop",
  importPath: "@/components/remocn/negation-drop",
  lists: {
    lines: {
      default: [
        "You can’t animate.",
        "You don’t have a team.",
        "It isn’t done.",
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
    dropAt: {
      type: "number",
      default: 44,
      min: 0,
      max: 90,
      step: 1,
      description: "Drop at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Barlow Condensed" }),
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
