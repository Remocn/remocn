import { Img } from "remotion";
import type { SceneProps } from "../content";
import { smooth, tween } from "../motion";

export function Portal({ scene, t }: SceneProps) {
  const reveal = tween(t, 7.08, 7.32);
  const zoom = tween(t, 5.9, 6.14, 0.6, 1.04, smooth);
  const aperture = tween(t, 6.7, 7.33, 0, 1, smooth);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#f3eee2",
        perspective: 600,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 15,
          borderRadius: 56,
          background:
            "linear-gradient(140deg, #8ca48d, #d1d8c3 35%, #f8f4ea 60%, #9ca78a)",
          boxShadow: "inset 0 1px 2px #fff",
          transform: `scale(${zoom}) rotateY(${tween(t, 5.9, 6.55, -12, 0)}deg) rotateZ(${tween(t, 5.9, 6.55, -3, 0)}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 38 * (1 - aperture),
            borderRadius: 46,
            border: `${22 * (1 - aperture)}px solid #ffffff`,
            borderRightWidth: 34 * (1 - aperture),
            borderBottomWidth: 30 * (1 - aperture),
            background:
              "linear-gradient(140deg, #f8f4ea 25%, #efecdf 46%, #d5d8c2 72%, #849b7b)",
            boxShadow: "inset 0 0 12px #ffffff9a",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, #cbdac2 6%, #8ca887 27%, #245744 51%, #6b8b65 75%, #e2e4cf)",
              opacity: tween(t, 6.85, 7.07),
            }}
          />
          <Img
            src={scene.media.desk}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: reveal,
              transform: "scale(1.02)",
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          width: 125,
          height: 48,
          background: "#fff",
          filter: "blur(5px)",
          left: tween(t, 5.9, 6.5, 60, 210),
          top: tween(t, 5.9, 6.5, 165, 235),
          opacity: 1 - aperture,
        }}
      />
    </div>
  );
}
