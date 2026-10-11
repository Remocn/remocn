import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpMarblePreset } from ".";

export const shaderWarpMarbleConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpMarblePreset,
  {
    slug: "shader-warp-marble",
    componentName: "ShaderWarpMarble",
  },
);
