import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const verbedConfig: ComponentConfig = {
  componentName: "Verbed",
  importPath: "@/components/remocn/verbed",
  lists: {
    inflections: {
      default: ["remocns", "remocned", "remocning"],
      description: "Inflections",
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
    headword: {
      type: "text-content",
      default: "remocn",
      description: "Headword",
    },
    pronunciation: {
      type: "text-content",
      default: "/rem-uh-kun/",
      description: "Pronunciation",
    },
    nounLabel: {
      type: "text-content",
      default: "noun",
      description: "Noun label",
    },
    verbLabel: {
      type: "text-content",
      default: "verb",
      description: "Verb label",
    },
    nounSense: {
      type: "text-content",
      default:
        "a set of video scenes you copy into your repo and edit like any other code.",
      description: "Noun sense",
    },
    verbSense: {
      type: "text-content",
      default:
        "to make the launch film in the same pull request as the feature.",
      description: "Verb sense",
    },
    example: {
      type: "text-content",
      default: "We remocned the changelog before lunch.",
      description: "Example",
    },
    turnAt: {
      type: "number",
      default: 84,
      min: 30,
      max: 150,
      step: 1,
      description: "Turn at (frame)",
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
