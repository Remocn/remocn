import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpDeepSeaPreset } from ".";

export const shaderWarpDeepSeaConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpDeepSeaPreset,
  {
    slug: "shader-warp-deep-sea",
    componentName: "ShaderWarpDeepSea",
  },
);
