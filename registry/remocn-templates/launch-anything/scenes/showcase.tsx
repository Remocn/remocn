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
        background: "#e8dcc2",
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
        {/* Code-native, unbranded laptop. The screen keeps the camera's existing focus geometry. */}
        <svg
          width="480"
          height="270"
          viewBox="0 0 480 270"
          aria-label="Product display"
          role="img"
          style={{ position: "absolute", inset: 0 }}
        >
          <ellipse
            cx="250"
            cy="208"
            rx="94"
            ry="7"
            fill="#2d241a"
            opacity="0.2"
          />
          <rect
            x="180.8"
            y="99.3"
            width="138.4"
            height="96"
            rx="5"
            fill="#202820"
            stroke="#778272"
            strokeWidth="0.7"
          />
          <circle cx="250" cy="102.5" r="0.6" fill="#6a7764" />
          <path
            d="M180.8 194.5H319.2L337 206H163Z"
            fill="#a6ab98"
            stroke="#666f5d"
            strokeWidth="0.5"
          />
          <path d="M190 197H310L318 202H182Z" fill="#4b5645" />
          <path d="M163 206H337L332 209H168Z" fill="#7e8875" />
          <path d="M234 203H265L268 205H231Z" fill="#d0d3bc" />
        </svg>
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
          border: `${tween(t, 7.333, 7.55, 12, 0)}px solid #f7f2e6`,
          borderRadius: tween(t, 7.333, 7.55, 36, 0),
          opacity: 1 - tween(t, 7.4, 7.6),
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
