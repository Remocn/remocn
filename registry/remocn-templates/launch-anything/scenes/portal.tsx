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
        background: "#f6f6fd",
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
            "linear-gradient(140deg, #b8b5f3, #d1d6ff 35%, #fff 60%, #a9a5e8)",
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
              "linear-gradient(140deg, #fff 25%, #fdfdff 46%, #e0e1fa 72%, #9992e7)",
            boxShadow: "inset 0 0 12px #ffffff9a",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, #83defc 6%, #6869ed 27%, #6800ec 51%, #a03dec 75%, #e5ddff)",
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
