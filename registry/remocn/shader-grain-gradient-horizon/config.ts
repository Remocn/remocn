import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientHorizonPreset } from ".";

export const shaderGrainGradientHorizonConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientHorizonPreset,
  {
    slug: "shader-grain-gradient-horizon",
    componentName: "ShaderGrainGradientHorizon",
  },
);
