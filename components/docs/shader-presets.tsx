import { presetsOf } from "@/lib/shader-presets";
import { ShaderPresetCard } from "./shader-preset-card";

/** Gallery of the standalone preset items built on a base shader. */
export function ShaderPresets({ base }: { base: string }) {
  return (
    <div className="not-prose my-8 grid gap-x-3 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {presetsOf(base).map((item) => (
        <ShaderPresetCard key={item.name} item={item} />
      ))}
    </div>
  );
}
