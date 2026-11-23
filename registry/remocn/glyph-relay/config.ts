import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const glyphRelayConfig: ComponentConfig = {
  componentName: "GlyphRelay",
  importPath: "@/components/remocn/glyph-relay",
  lists: {
    line1: {
      default: ["Building a", "product"],
      description: "Line 1",
      min: 2,
      max: 2,
    },
    line2: {
      default: ["is", "easy."],
      description: "Line 2",
      min: 2,
      max: 2,
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
    line3: {
      type: "text-content",
      default: "Launching it?",
      description: "Line3",
    },
    push: {
      type: "number",
      default: 0.045,
      min: 0,
      max: 0.2,
      step: 0.005,
      description: "Push-in",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
  durationInFrames: 146,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
