import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const weCallItConfig: ComponentConfig = {
  componentName: "WeCallIt",
  importPath: "@/components/remocn/we-call-it",
  lists: {
    descriptions: {
      default: [
        "Scenes you install like components.",
        "Edits that land as commits.",
        "A film that ships with the release.",
      ],
      description: "Descriptions",
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
      default: "We call it a",
      description: "Lead",
    },
    name: {
      type: "text-content",
      default: "video registry.",
      description: "Name",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    beat: {
      type: "number",
      default: 40,
      min: 20,
      max: 80,
      step: 1,
      description: "Line beat (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Bitter" }),
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
