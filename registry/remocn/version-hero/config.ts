import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const versionHeroConfig: ComponentConfig = {
  componentName: "VersionHero",
  importPath: "@/components/remocn/version-hero",
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
    version: {
      type: "text-content",
      default: "2.0",
      description: "Version",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    label: {
      type: "text-content",
      default: "Now available",
      description: "Label",
    },
    depth: {
      type: "number",
      default: 0.2,
      min: 0,
      max: 0.5,
      step: 0.01,
      description: "Depth",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2.2,
      min: 0,
      max: 6,
      step: 0.1,
      description: "Slice stagger",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Bricolage Grotesque", grain: true }),
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
  durationInFrames: 150,
  fps: FPS,
  // Does not hold 60 fps in the browser yet (`audit:playback`: paint).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
