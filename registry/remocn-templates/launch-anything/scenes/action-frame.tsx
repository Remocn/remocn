import { Img } from "remotion";
import type { SceneProps } from "../content";
import { actionFrame, smooth, tween } from "../motion";

export const actionBackground = "linear-gradient(#f3edde, #faf6ec 75%)";

export function ActionFrame({ scene, t }: SceneProps) {
  const shape = actionFrame(t);
  const aperture = tween(t, 6.7, 7.33, 0, 1, smooth);
  return (
    <div
      style={{
        position: "absolute",
        left: shape.x - shape.width / 2,
        top: shape.y - shape.height / 2,
        width: shape.width,
        height: shape.height,
        borderRadius: shape.radius,
        opacity: shape.enter,
        transform: `scale(${1 - 0.07 * shape.press})`,
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #fbf8ee 10%, #f5f1e5 36%, #d9dfc8 70%, #90a47f 100%)",
        boxShadow: "inset 1px 1px 2px #fff, 0 4px 18px #728b6415",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: shape.morph,
          background:
            "linear-gradient(140deg, #8ca48d, #d1d8c3 35%, #f8f4ea 60%, #9ca78a)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#070707",
          fontSize: Math.min(
            36,
            320 / Math.max(1, Array.from(scene.content.action).length),
          ),
          letterSpacing: "-0.045em",
          fontWeight: 500,
          whiteSpace: "nowrap",
          opacity: 1 - tween(t, 5.55, 5.83),
        }}
      >
        {scene.content.action}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 38 * (1 - aperture) * shape.morph,
          borderRadius: 13 + 33 * shape.morph,
          border: `${22 * (1 - aperture) * shape.morph}px solid #fff`,
          borderRightWidth: 34 * (1 - aperture) * shape.morph,
          borderBottomWidth: 30 * (1 - aperture) * shape.morph,
          boxSizing: "border-box",
          opacity: shape.morph,
          overflow: "hidden",
          background:
            "linear-gradient(140deg, #f8f4ea 25%, #efecdf 46%, #d5d8c2 72%, #849b7b)",
          boxShadow: "inset 0 0 12px #ffffff9a",
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
        {t >= 7.08 ? (
          <Img
            src={scene.media.desk}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: tween(t, 7.08, 7.32),
              transform: "scale(1.02)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
