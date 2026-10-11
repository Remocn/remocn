import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientPeachPreset } from ".";

export const shaderMeshGradientPeachConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientPeachPreset,
  {
    slug: "shader-mesh-gradient-peach",
    componentName: "ShaderMeshGradientPeach",
  },
);
