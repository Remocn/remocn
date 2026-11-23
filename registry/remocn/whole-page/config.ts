import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const wholePageConfig: ComponentConfig = {
  componentName: "WholePage",
  importPath: "@/components/remocn/whole-page",
  lists: {
    beliefs: {
      default: [
        "A launch video is part of the launch, not the chore you do after it.",
        "If it lives in code, it can live in the repo with everything else.",
        "Every frame you install is a file you are free to rewrite.",
        "Motion should explain the product. It should never show off.",
        "A team of one deserves a real film, too.",
        "The video goes out the same day the product does.",
      ],
      description: "Beliefs",
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
    title: {
      type: "text-content",
      default: "What we believe",
      description: "Title",
    },
    hold: {
      type: "number",
      default: 40,
      min: 0,
      max: 120,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    pull: {
      type: "number",
      default: 36,
      min: 12,
      max: 90,
      step: 1,
      description: "Pull back (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Gloock" }),
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
  durationInFrames: 390,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
