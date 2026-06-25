import {
  type ComponentConfig,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const githubStarsConfig: ComponentConfig = {
  componentName: "GitHubStars",
  importPath: "@/components/remocn/github-stars",
  controls: {
    repo: {
      type: "text",
      default: "kapishdima/remocn",
      label: "Repository",
    },
    totalStars: {
      type: "number-input",
      default: 24813,
      min: 0,
      max: 500000,
      step: 1,
      label: "Total stars",
    },
    orientation: {
      type: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      label: "Orientation",
    },
    accentColor: { type: "color", default: "#ffbb00", label: "Accent" },
    theme: {
      type: "select",
      default: "light",
      options: ["light", "dark"],
      label: "Theme",
    },
    // `speed` is appended from SHARED_CONTROLS in registry/__index__.tsx.
    // `stargazers` is an array → not a control; preview uses SAMPLE_STARGAZERS.
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
