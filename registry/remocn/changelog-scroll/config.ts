import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    scrollLength: {
      type: "number",
      default: 58,
      min: 20,
      max: 100,
      step: 1,
      description: "Scroll (frames)",
      hiddenFromList: false,
    },
    scrollRows: {
      type: "number",
      default: 30,
      min: 0,
      max: 60,
      step: 1,
      description: "Rows scrolled",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Onest", grain: true }),
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
  // Does not hold 60 fps in the browser yet (`audit:playback`: script).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
