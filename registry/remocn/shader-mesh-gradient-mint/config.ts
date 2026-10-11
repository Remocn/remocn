import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientMintPreset } from ".";

export const shaderMeshGradientMintConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientMintPreset,
  {
    slug: "shader-mesh-gradient-mint",
    componentName: "ShaderMeshGradientMint",
  },
);
