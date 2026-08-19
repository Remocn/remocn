import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const slotMachineRollConfig: ComponentConfig = {
  componentName: "SlotMachineRoll",
  importPath: "@/components/remocn/slot-machine-roll",
  controls: {
    from: {
      type: "text-content",
      default: "$99",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "$199",
      description: "To",
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 240,
      step: 1,
      default: 120,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "700",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
