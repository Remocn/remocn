import type { SceneProps } from "../content";
import { Dashboard } from "../interfaces";
import { ramp, smooth, tween } from "../motion";
import { Cursor, Glow, Layer } from "../ui";

export function PaintedBackdrop({ t }: { t: number }) {
  return (
    <svg
      width="480"
      height="270"
      viewBox="0 0 480 270"
      style={{ position: "absolute", inset: 0, background: "#263664" }}
      aria-hidden
    >
      {Array.from({ length: 70 }, (_, i) => {
        const y = i * 5 - 40;
        return (
          <path
            key={i}
            d={`M-40 ${y} C70 ${y + 130} 180 ${y - 95} 300 ${y + 8} S450 ${y + 70} 530 ${y - 30}`}
            fill="none"
            stroke={
              ["#647fc4", "#90abd1", "#b8c6c4", "#263d85", "#d3ca8c"][i % 5]
            }
            strokeWidth={1 + (i % 3)}
            opacity={0.55}
            transform={`translate(${Math.sin(t * 0.2) * 4} 0)`}
          />
        );
      })}
      <circle
        cx="69"
        cy="31"
        r="24"
        fill="none"
        stroke="#c4bc58"
        strokeWidth="8"
        opacity="0.65"
      />
    </svg>
  );
}
export function Workspace(props: SceneProps) {
  const { t } = props;
  const community = t < 10.55;
  const focus = tween(t, 9.3, 10.12, 0, 1, smooth);
  const courseFocus = tween(t, 12.55, 13.6, 0, 1, smooth);
  const scale = community ? 0.53 + focus * 1.05 : 0.52 + courseFocus * 0.84;
  const x = community ? 39 - focus * 42 : 32 - courseFocus * 230;
  const y = community ? 22 - focus * 470 : 9 - courseFocus * 240;
  return (
    <>
      <PaintedBackdrop t={t} />
      <Layer
        x={x}
        y={y}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          filter: `blur(${community ? Math.sin(focus * Math.PI) * 0.45 : Math.sin(courseFocus * Math.PI) * 0.65}px)`,
        }}
      >
        <Dashboard {...props} page={community ? "community" : "courses"} />
      </Layer>
      {community && (
        <Cursor
          x={tween(t, 9, 10.2, 213, 171)}
          y={tween(t, 9, 10.2, 215, 150)}
          click={ramp(t, 10.3, 10.4) * (1 - ramp(t, 10.4, 10.5))}
        />
      )}
      {t > 13.25 && (
        <Glow t={t} accent={props.accent} strength={ramp(t, 13.25, 13.75)} />
      )}
    </>
  );
}
