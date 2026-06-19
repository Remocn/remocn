import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const heroDeviceAssembleConfig: ComponentConfig = {
  componentName: "HeroDeviceAssemble",
  importPath: "@/components/remocn/hero-device-assemble",
  controls: {
    device: {
      type: "select",
      default: "laptop",
      options: ["laptop", "phone"],
      label: "Device",
    },
    accentColor: {
      type: "color",
      default: "#22c55e",
      label: "Accent color",
    },
    assembleStart: {
      type: "number",
      default: 0,
      min: 0,
      max: 60,
      step: 1,
      label: "Assemble start",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: {
    type: "gradient",
    value: "radial-gradient(ellipse at center, #1a1a22 0%, #050507 70%)",
  },
};
