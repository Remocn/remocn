import { Img } from "remotion";
import type { SceneProps } from "../content";
import { deskCamera, getShowcase, tween } from "../motion";
import { ShowcaseScreen } from "../screens";

export function Showcase({ scene, t }: SceneProps) {
  const camera = deskCamera(t);
  const custom = scene.screenImages[getShowcase(t).id];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#f4d9ba",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "52% 55%",
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        }}
      >
        <Img
          src={scene.media.desk}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
          }}
        />
        {/* Display measured on the generated 1672x941 desk plate: (647,368)–(1094,659). */}
        <div
          style={{
            position: "absolute",
            left: (480 * 647) / 1672,
            top: (270 * 368) / 941,
            width: (480 * 447) / 1672,
            height: (270 * 291) / 941,
            clipPath: "polygon(0.8% 0, 99.2% 0, 100% 100%, 0 100%)",
            overflow: "hidden",
            background: "#fcfaf7",
          }}
        >
          {custom ? (
            <Img
              src={custom}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                width: 640,
                height: 420,
                transformOrigin: "0 0",
                transform: `scale(${(480 * 447) / 1672 / 640}, ${(270 * 291) / 941 / 420})`,
              }}
            >
              <ShowcaseScreen scene={scene} t={t} />
            </div>
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(135deg,#ffc79906,transparent 55%,#99683206)",
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `${tween(t, 7.333, 7.55, 12, 0)}px solid #f8f7fc`,
          borderRadius: tween(t, 7.333, 7.55, 36, 0),
          opacity: 1 - tween(t, 7.4, 7.6),
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
