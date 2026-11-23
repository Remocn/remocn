import {
  AUTO,
  type ComponentConfig,
  enumVariants,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const keycapPressConfig: ComponentConfig = {
  componentName: "KeycapPress",
  importPath: "@/components/remocn/keycap-press",
  controls: {
    theme: {
      type: "enum",
      default: AUTO,
      variants: enumVariants([AUTO, "dark", "light"]),
      description: "Theme",
    },
    label: {
      type: "text-content",
      default: "Everything, one shortcut away",
      description: "Label",
    },
    material: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Material",
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    glow: {
      type: "number",
      default: 1,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Underglow",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Bricolage Grotesque" }),
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
  durationInFrames: 135,
  fps: FPS,
  // Does not hold 60 fps in the browser yet (`audit:playback`: paint).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
