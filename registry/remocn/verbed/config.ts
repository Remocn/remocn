import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const verbedConfig: ComponentConfig = {
  componentName: "Verbed",
  importPath: "@/components/remocn/verbed",
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
