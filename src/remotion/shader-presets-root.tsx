import { type ComponentType, useEffect, useState } from "react";
import {
  AbsoluteFill,
  Composition,
  continueRender,
  delayRender,
  registerRoot,
} from "remotion";
import { presetsOf } from "@/lib/shader-presets";
import registry from "@/registry/__index__";

// Contact sheets for the shader preset registry items: one composition per
// base shader, every preset (registry items with `meta.presetOf`) rendered
// side by side in a 3-column grid with its name.

export const CELL_WIDTH = 640;
export const CELL_HEIGHT = 360;
const COLUMNS = 3;

export const BASES = [
  "shader-mesh-gradient",
  "shader-grain-gradient",
  "shader-warp",
  "shader-swirl",
];

function PresetCell({ name }: { name: string }) {
  const [Shader, setShader] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [handle] = useState(() => delayRender(`load ${name}`));
  useEffect(() => {
    registry[name].load().then((m) => {
      setShader(() => m.default);
      continueRender(handle);
    });
  }, [name, handle]);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {Shader && <Shader width={CELL_WIDTH} height={CELL_HEIGHT} />}
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 12,
          padding: "4px 10px",
          borderRadius: 6,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          font: "600 22px/1.2 system-ui, sans-serif",
        }}
      >
        {name}
      </div>
    </div>
  );
}

function PresetSheet({ base }: { base: string }) {
  return (
    <AbsoluteFill
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLUMNS}, ${CELL_WIDTH}px)`,
        gridAutoRows: CELL_HEIGHT,
        backgroundColor: "#000",
      }}
    >
      {presetsOf(base).map((item) => (
        <PresetCell key={item.name} name={item.name} />
      ))}
    </AbsoluteFill>
  );
}

function ShaderPresetsRoot() {
  return (
    <>
      {BASES.map((base) => (
        <Composition
          key={base}
          id={`presets-${base}`}
          component={PresetSheet}
          defaultProps={{ base }}
          durationInFrames={300}
          fps={30}
          width={CELL_WIDTH * COLUMNS}
          height={CELL_HEIGHT * Math.ceil(presetsOf(base).length / COLUMNS)}
        />
      ))}
    </>
  );
}

registerRoot(ShaderPresetsRoot);
