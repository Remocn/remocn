import { Interactive } from "remotion";
import type { SceneProps } from "../content";
import { move, ramp } from "../motion";
import { Center, XMark } from "../ui";

export function ClosingMark({ scene, t }: SceneProps) {
  const resolve = move(t, 44.5, 44.72);
  return (
    <Center style={{ background: scene.background }}>
      <Interactive.Div
        name="Workflow node mark"
        style={{
          position: "relative",
          width: 100,
          height: 100,
          scale: move(t, 43, 46.2, 1, 0.48),
          opacity: 1 - move(t, 45.55, 46.45),
        }}
      >
        {[0, 1, 2].map((layer) => (
          <div
            key={layer}
            style={{
              position: "absolute",
              inset: 0,
              opacity: (1 - resolve) * (layer === 0 ? 0.45 : 0.22),
              translate: `${(1 - ramp(t, 43.2, 44.6)) * layer * 5}px 0px`,
            }}
          >
            <XMark
              size={100}
              color={scene.accent}
              outline
              progress={ramp(t, 43.05 + layer * 0.1, 44.25)}
              src={scene.logoSrc}
            />
          </div>
        ))}
        <div style={{ opacity: resolve }}>
          <XMark size={100} color={scene.accent} src={scene.logoSrc} />
        </div>
      </Interactive.Div>
    </Center>
  );
}
