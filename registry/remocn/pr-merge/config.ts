import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const prMergeConfig: ComponentConfig = {
  componentName: "PrMerge",
  importPath: "@/components/remocn/pr-merge",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    repo: {
      type: "text-content",
      default: "remocn/remocn",
      description: "Repo",
    },
    title: {
      type: "text-content",
      default: "Add launch pack",
      description: "Title",
    },
    author: {
      type: "text-content",
      default: "maya-chen",
      description: "Author",
    },
    reviewer: {
      type: "text-content",
      default: "leo-park",
      description: "Reviewer",
    },
    branch: {
      type: "text-content",
      default: "feat/launch-pack",
      description: "Branch",
    },
    base: {
      type: "text-content",
      default: "main",
      description: "Base",
    },
    mergeSha: {
      type: "text-content",
      default: "3f2a9c1",
      description: "Merge sha",
    },
    number: {
      type: "number",
      default: 312,
      min: 0,
      max: 936,
      step: 1,
      description: "Number",
      hiddenFromList: false,
    },
  },
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
