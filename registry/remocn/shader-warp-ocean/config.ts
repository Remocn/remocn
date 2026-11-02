import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpOceanPreset } from ".";

export const shaderWarpOceanConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpOceanPreset,
  {
    slug: "shader-warp-ocean",
    componentName: "ShaderWarpOcean",
  },
);
