import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const changelogScrollConfig: ComponentConfig = {
  componentName: "ChangelogScroll",
  importPath: "@/components/remocn/changelog-scroll",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Changelog",
      description: "Title",
    },
    url: {
      type: "text-content",
      default: "remocn.dev/changelog",
      description: "Url",
    },
    focus: {
      type: "number",
      default: 9,
      min: 0,
      max: 27,
      step: 1,
      description: "Focus",
      hiddenFromList: false,
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
