import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const glyphBlockDecodeConfig: ComponentConfig = {
  componentName: "GlyphBlockDecode",
  importPath: "@/components/remocn/glyph-block-decode",
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
    name: {
      type: "text-content",
      default: "Remocn Studio",
      description: "Name",
    },
    url: {
      type: "text-content",
      default: "remocn.dev/studio",
      description: "Url",
    },
    seed: {
      type: "number",
      default: 7,
      min: 0,
      max: 21,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    underline: {
      type: "boolean",
      default: true,
      description: "Underline",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 138,
  fps: FPS,
  // Does not hold 60 fps in the browser yet (`audit:playback`: pixels).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
