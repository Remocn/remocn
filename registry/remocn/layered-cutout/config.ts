import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const layeredCutoutConfig: ComponentConfig = {
  componentName: "LayeredCutout",
  importPath: "@/components/remocn/layered-cutout",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    tagline: {
      type: "text-content",
      default: "Launch films, cut from components.",
      description: "Tagline",
    },
    layers: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Layers",
      hiddenFromList: false,
    },
    push: {
      type: "number",
      default: 132,
      min: 40,
      max: 240,
      step: 4,
      description: "Dolly length (frames)",
      hiddenFromList: false,
    },
    depthBlur: {
      type: "number",
      default: 1,
      min: 0,
      max: 3,
      step: 0.1,
      description: "Depth blur",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Hanken Grotesk", grain: true }),
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
  durationInFrames: 170,
  fps: FPS,
  // Does not hold 60 fps in the browser yet (`audit:playback`: pixels).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
