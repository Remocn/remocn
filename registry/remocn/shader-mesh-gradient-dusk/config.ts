import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientDuskPreset } from ".";

export const shaderMeshGradientDuskConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientDuskPreset,
  {
    slug: "shader-mesh-gradient-dusk",
    componentName: "ShaderMeshGradientDusk",
  },
);
