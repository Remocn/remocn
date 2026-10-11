import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientSunrisePreset } from ".";

export const shaderGrainGradientSunriseConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientSunrisePreset,
  {
    slug: "shader-grain-gradient-sunrise",
    componentName: "ShaderGrainGradientSunrise",
  },
);
