import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const tldrOnTopConfig: ComponentConfig = {
  componentName: "TldrOnTop",
  importPath: "@/components/remocn/tldr-on-top",
  lists: {
    lines: {
      default: [
        "Every scene is a component.",
        "Your brand is one file.",
        "It renders on your laptop.",
      ],
      description: "Lines",
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
    text: {
      type: "text-content",
      default:
        "Last spring we had a launch on Thursday and no video. The timeline editor crashed twice, every export took forty minutes, and each copy change meant opening the project, finding the layer and rendering the whole thing again. So we tried something else: we wrote the video the way we write the product. Every scene became a React component, with props for its words and its colors. The brand moved into one config file, so a new color reached every shot at once. A typo turned into a one-line commit. Transitions became functions you could read, review and reuse. The film now lives in the same repo as the code, gets reviewed in pull requests like everything else, and renders on the laptop it was written on. You install a scene with one command, change its words, and every file is yours to keep. That’s the whole story, more or less, and it took us a lot longer to tell than it will take you to try.",
      description: "Text",
    },
    label: {
      type: "text-content",
      default: "TL;DR",
      description: "Label",
    },
    read: {
      type: "number",
      default: 34,
      min: 0,
      max: 90,
      step: 1,
      description: "Read hold (frames)",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Rubik" }),
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
