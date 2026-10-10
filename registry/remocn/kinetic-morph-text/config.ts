import {
  type ComponentConfig,
  enumVariants,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";
import { getKineticMorphTextDuration } from ".";

export const kineticMorphTextConfig: ComponentConfig = {
  componentName: "KineticMorphText",
  importPath: "@/components/remocn/kinetic-morph-text",
  controls: {
    text: {
      type: "text-content",
      default: "Hello | Make it move | Shape what's next",
      description: "Phrases (separate with |)",
    },
    fontSize: {
      type: "number",
      default: 100,
      min: 24,
      max: 180,
      step: 1,
      description: "Font size",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: enumVariants(FONT_WEIGHT_OPTIONS),
      description: "Font weight",
    },
    spread: {
      type: "number",
      default: 180,
      min: 0,
      max: 230,
      step: 5,
      description: "Flight spread",
      hiddenFromList: false,
    },
    rotation: {
      type: "number",
      default: 110,
      min: 0,
      max: 240,
      step: 5,
      description: "Rotation",
      hiddenFromList: false,
    },
    morph: {
      type: "number",
      default: 0.75,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Morph strength",
      hiddenFromList: false,
    },
    trails: {
      type: "number",
      default: 0.45,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Outline trails",
      hiddenFromList: false,
    },
    transitionFrames: {
      type: "number",
      default: 54,
      min: 18,
      max: 90,
      step: 1,
      description: "Transition frames",
      hiddenFromList: false,
    },
    holdFrames: {
      type: "number",
      default: 42,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold frames",
      hiddenFromList: false,
    },
    loop: {
      type: "boolean",
      default: false,
      description: "Loop phrases",
    },
    color: {
      type: "color",
      default: "#b4f4d9",
      description: "Text color",
    },
    backgroundColor: {
      type: "color",
      default: "#a800b7",
      description: "Background",
    },
  },
  durationInFrames: 288,
  getDurationInFrames: (values) => getKineticMorphTextDuration(values),
  snippet: (values) => {
    const props = Object.entries(values).map(([name, value]) => {
      const typedValue = name === "fontWeight" ? Number(value) : value;
      return `  ${name}={${JSON.stringify(typedValue)}}`;
    });
    return `import { KineticMorphText } from "@/components/remocn/kinetic-morph-text";\n\n<KineticMorphText\n${props.join("\n")}\n/>`;
  },
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
