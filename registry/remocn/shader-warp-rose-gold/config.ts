import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpRoseGoldPreset } from ".";

export const shaderWarpRoseGoldConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpRoseGoldPreset,
  {
    slug: "shader-warp-rose-gold",
    componentName: "ShaderWarpRoseGold",
  },
);
