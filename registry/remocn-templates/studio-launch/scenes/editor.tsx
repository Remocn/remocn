import { Img } from "remotion";
import type { SceneProps } from "../content";
import { Dashboard } from "../interfaces";
import { ramp, smooth, tween } from "../motion";
import { Cursor, Glow, Layer } from "../ui";
export function Editor(props: SceneProps) {
  const { t } = props;
  const detail = tween(t, 23.6, 24.3, 0, 1, smooth);
  const sidebar = tween(t, 24.65, 25.25, 0, 1, smooth);
  const scale = 0.59 + detail * 0.72 + sidebar * 0.47;
  const x = 11 - detail * 522 + sidebar * 185;
  const y = 8 - detail * 75 + sidebar * 17;
  const dragging = t >= 22.6 && t < 23.1;
  return (
    <>
      <Layer w={480} h={270} style={{ background: "white" }} />
      <Layer
        x={x}
        y={y}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          filter: `blur(${Math.sin(detail * Math.PI) * 0.5}px)`,
        }}
      >
        <Dashboard {...props} page="editor" light />
      </Layer>
      {dragging && (
        <Layer
          x={tween(t, 22.6, 23.05, 402, 338)}
          y={tween(t, 22.6, 23.05, 245, 127)}
          w={65}
          h={50}
          style={{
            border: "1px solid #888",
            borderRadius: 5,
            overflow: "hidden",
            boxShadow: "0 4px 12px #0004",
          }}
        >
          <Img
            src={props.media.courses[0]}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Layer>
      )}
      {t < 23.4 && (
        <Cursor
          x={tween(t, 22.4, 23.1, 440, 369)}
          y={tween(t, 22.4, 23.1, 263, 152)}
          dark
        />
      )}
      <Glow
        t={t}
        accent={props.accent}
        light
        strength={0.6 + ramp(t, 25.2, 25.56) * 0.4}
      />
    </>
  );
}
