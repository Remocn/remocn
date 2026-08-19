import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const githubStarsConfig: ComponentConfig = {
  componentName: "GitHubStars",
  importPath: "@/components/remocn/github-stars",
  controls: {
    repo: {
      type: "text-content",
      default: "Remocn/remocn",
      description: "Repository",
    },
    totalStars: {
      type: "number",
      min: 0,
      step: 1,
      default: 24813,
      description: "Total stars",
      hiddenFromList: false,
    },
    orientation: {
      type: "enum",
      default: "horizontal",
      variants: {
        horizontal: {},
        vertical: {},
      },
      description: "Orientation",
    },
    accentColor: {
      type: "color",
      default: "#ffbb00",
      description: "Accent",
    },
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
