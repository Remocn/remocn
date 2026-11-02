import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientLagoonPreset } from ".";

export const shaderMeshGradientLagoonConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientLagoonPreset,
  {
    slug: "shader-mesh-gradient-lagoon",
    componentName: "ShaderMeshGradientLagoon",
  },
);
