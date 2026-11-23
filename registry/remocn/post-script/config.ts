import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const postScriptConfig: ComponentConfig = {
  componentName: "PostScript",
  importPath: "@/components/remocn/post-script",
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
    signoff: {
      type: "text-content",
      default: "Thanks for watching.",
      description: "Signoff",
    },
    signature: {
      type: "text-content",
      default: "— the remocn team",
      description: "Signature",
    },
    label: {
      type: "text-content",
      default: "P.S.",
      description: "Label",
    },
    ps: {
      type: "text-content",
      default: "The next launch film is yours.",
      description: "Ps",
    },
    install: {
      type: "text-content",
      default: "npx shadcn add @remocn/zoom-blur",
      description: "Install",
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
    flip: {
      type: "number",
      default: 30,
      min: 10,
      max: 60,
      step: 1,
      description: "Flip (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Lexend" }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
