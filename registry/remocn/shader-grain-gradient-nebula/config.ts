import { presetConfig } from "@/lib/shader-presets";
import { shaderGrainGradientConfig } from "../shader-grain-gradient/config";
import { shaderGrainGradientNebulaPreset } from ".";

export const shaderGrainGradientNebulaConfig = presetConfig(
  shaderGrainGradientConfig,
  shaderGrainGradientNebulaPreset,
  {
    slug: "shader-grain-gradient-nebula",
    componentName: "ShaderGrainGradientNebula",
  },
);
