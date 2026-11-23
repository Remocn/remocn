import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const saidWhoConfig: ComponentConfig = {
  componentName: "SaidWho",
  importPath: "@/components/remocn/said-who",
  lists: {
    details: {
      default: ["backend engineer", "never edited a video before"],
      description: "Details",
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
    quote: {
      type: "text-content",
      default: "Took me one evening.",
      description: "Quote",
    },
    highlight: {
      type: "text-content",
      default: "one evening",
      description: "Highlight",
    },
    name: {
      type: "text-content",
      default: "Tobias Lind",
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
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Young Serif" }),
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
