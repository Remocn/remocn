import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientArcadePreset } from ".";

export const shaderGrainGradientArcadeConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientArcadePreset,
  {
    slug: "shader-grain-gradient-arcade",
    componentName: "ShaderGrainGradientArcade",
  },
);
