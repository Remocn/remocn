import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientEmberPreset } from ".";

export const shaderMeshGradientEmberConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientEmberPreset,
  {
    slug: "shader-mesh-gradient-ember",
    componentName: "ShaderMeshGradientEmber",
  },
);
