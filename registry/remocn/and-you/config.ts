import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const andYouConfig: ComponentConfig = {
  componentName: "AndYou",
  importPath: "@/components/remocn/and-you",
  lists: {
    clauses: {
      default: [
        "For the founder who launches on Monday,",
        "the designer who just learned React,",
        "the two-person studio,",
        "the student with a weekend project,",
      ],
      description: "Clauses",
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
    last: {
      type: "text-content",
      default: "and you.",
      description: "Last",
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
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Gabarito" }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
