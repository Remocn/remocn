import { orbitLockExampleCode } from "@/components/docs/examples/orbit-lock-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const orbitLockConfig: ComponentConfig = {
  componentName: "OrbitLock",
  importPath: "@/components/remocn/orbit-lock",
  controls: {
    moons: {
      type: "number",
      default: 3,
      min: 1,
      max: 8,
      step: 1,
      description: "Moons",
      hiddenFromList: false,
    },
    tilt: {
      type: "number",
      default: 64,
      min: 0,
      max: 85,
      step: 1,
      description: "Orbit tilt",
      hiddenFromList: false,
    },
    coreColor: { type: "color", default: "#E5322D", description: "Core" },
    moonColor: { type: "color", default: "#FFFFFF", description: "Moons" },
    flashColor: { type: "color", default: "#FFFFFF", description: "Flash" },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 78,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: orbitLockExampleCode,
};
