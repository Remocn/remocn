import { useId } from "react";
import type { SceneProps } from "../content";
import { smooth, tween } from "../motion";
import { Center, RevealCopy } from "../ui";

export function Action({ scene, t }: SceneProps) {
  const id = useId();
  const travel = tween(t, 4.87, 5.17, 0, 1, smooth);
  const press = tween(t, 5.35, 5.47) - tween(t, 5.48, 5.7);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(#f3edde, #faf6ec 75%)",
        color: "#050608",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${-235 * travel}px)`,
        }}
      >
        <Center>
          <RevealCopy
            text={scene.content.next}
            size={47}
            t={t}
            start={3.8}
            dark
          />
        </Center>
      </div>
      <div
        style={{
          position: "absolute",
          left: 495 - 276 * travel,
          top: 108,
          width: 216,
          height: 61,
          opacity: travel,
          perspective: 600,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 13,
            background:
              "linear-gradient(135deg, #fbf8ee 10%, #f5f1e5 36%, #d9dfc8 70%, #90a47f 100%)",
            boxShadow: "inset 1px 1px 2px #fff, 0 4px 18px #728b6415",
            transform: `scale(${1 - 0.07 * press}) rotateY(${-9 + 9 * travel}deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#070707",
            fontSize: 39,
            letterSpacing: "-0.06em",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {scene.content.action}
        </div>
        <svg
          role="img"
          aria-label="Click pointer"
          viewBox="0 0 60 72"
          width="46"
          height="55"
          style={{
            position: "absolute",
            left: 110,
            top: tween(t, 5.02, 5.35, 92, 34) + press * 5,
            opacity: tween(t, 5.02, 5.18),
            filter: "drop-shadow(0 6px 4px #365a342a)",
            transform: `scale(${1 - press * 0.12}) rotate(-12deg)`,
          }}
        >
          <defs>
            <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#93af8f" />
              <stop offset="0.5" stopColor={scene.accent} />
              <stop offset="1" stopColor="#d3dfc2" />
            </linearGradient>
          </defs>
          <path
            d="M27 4Q30 0 33 4L57 57Q58 64 51 62L32 54 13 63Q5 66 9 56Z"
            fill={`url(#${id})`}
            stroke="#b3c6a4"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}
