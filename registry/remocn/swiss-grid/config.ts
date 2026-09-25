import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getSwissGridDuration, swissGridDefaults, swissGridPaper } from ".";

const textOf = (value: unknown) =>
  typeof value === "string" ? value : undefined;
const numberOf = (value: unknown) =>
  typeof value === "number" ? value : undefined;

function durationOf(values: Record<string, unknown>) {
  return getSwissGridDuration({
    kicker: textOf(values.kicker),
    title: textOf(values.title),
    number: textOf(values.number),
    metaStart: textOf(values.metaStart),
    metaEnd: textOf(values.metaEnd),
    modules: numberOf(values.modules),
    speed: numberOf(values.speed),
    exit: values.exit === true,
    width: W,
    height: H,
  });
}

export const swissGridConfig: ComponentConfig = {
  componentName: "SwissGrid",
  importPath: "@/components/remocn/swiss-grid",
  controls: {
    kicker: {
      type: "text-content",
      default: swissGridDefaults.kicker,
      description: "Kicker",
    },
    title: {
      type: "text-content",
      default: swissGridDefaults.title,
      description: "Title",
    },
    number: {
      type: "text-content",
      default: swissGridDefaults.number,
      description: "Number",
    },
    metaStart: {
      type: "text-content",
      default: swissGridDefaults.metaStart,
      description: "Meta start",
    },
    metaEnd: {
      type: "text-content",
      default: swissGridDefaults.metaEnd,
      description: "Meta end",
    },
    fontFamily: {
      type: "text-content",
      default: swissGridDefaults.fontFamily,
      description: "Font family",
    },
    inkColor: {
      type: "color",
      default: swissGridDefaults.inkColor,
      description: "Ink",
    },
    accentColor: {
      type: "color",
      default: swissGridDefaults.accentColor,
      description: "Accent",
    },
    modules: {
      type: "number",
      default: swissGridDefaults.modules,
      min: 16,
      max: 36,
      step: 1,
      description: "Grid modules",
      hiddenFromList: false,
    },
    exit: {
      type: "boolean",
      default: swissGridDefaults.exit,
      description: "Exit",
    },
  },
  durationInFrames: getSwissGridDuration({ width: W, height: H }),
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: swissGridPaper },
};
