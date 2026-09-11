import { Interactive } from "remotion";
import type { SceneProps } from "../content";
import { type CountryKey, countryOutlines } from "../countries";
import { move, ramp, smooth } from "../motion";

const topologyPaths = {
  single: "M15 38h24v24H15ZM61 38h24v24H61ZM39 50h22",
  parallel:
    "M9 38h20v24H9ZM71 12h20v20H71ZM71 68h20v20H71ZM29 50h21V22h21M50 50v28h21",
  cluster:
    "M10 10h22v22H10ZM68 10h22v22H68ZM10 68h22v22H10ZM68 68h22v22H68ZM39 39h22v22H39ZM32 21h18v18M79 32v18H61M21 32v18h18M50 61v18h18M32 79h18",
  canary:
    "M8 37h24v26H8ZM66 12h24v24H66ZM66 64h24v24H66ZM32 50h17V24h17M49 50v26h17M71 20h14M71 28h8",
};

export function Geography({ scene, t }: SceneProps) {
  const local = t - 12.55;
  const selected = scene.useCountries
    ? scene.countries
    : scene.environments.map((item) => item.label);
  // Slide labels through a fixed aperture; the active vector rotates with the slot.
  const travel =
    2 +
    move(t, 13.85, 14.3, 0, -1, smooth) +
    move(t, 14.85, 15.3, 0, 2, smooth) +
    move(t, 15.75, 16.2, 0, -3, smooth);
  const active = Math.floor(travel + 0.5);
  const rotation =
    Math.sin(local * 3.3) * 17 +
    Math.sin(move(t, 13.85, 14.3, 0, Math.PI, smooth)) * 75 +
    Math.sin(move(t, 14.85, 15.3, 0, Math.PI, smooth)) * 75 +
    Math.sin(move(t, 15.75, 16.2, 0, Math.PI, smooth)) * 75;
  const intro = move(local, 0, 0.45);
  const outro = move(t, 16.45, 16.8);
  return (
    <Interactive.Div
      name="Environment carousel"
      style={{
        position: "absolute",
        inset: 0,
        opacity: 1 - outro,
        translate: `0px ${outro * -40}px`,
        perspective: 650,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 25,
          right: 25,
          top: 117,
          height: 34,
          overflow: "hidden",
          maskImage:
            "linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)",
        }}
      >
        {Array.from({ length: 18 }, (_, item) => {
          const i = item - 4;
          const country =
            selected[
              ((i % selected.length) + selected.length) % selected.length
            ];
          const delta = i - travel;
          return (
            <span
              key={i}
              style={{
                position: "absolute",
                width: 70,
                left: 180 + delta * 66 + Math.sign(delta) * 30,
                textAlign: "center",
                fontSize: 14,
                lineHeight: "30px",
                color: "#9ab0c4",
                opacity:
                  selected.length === 1 || Math.abs(delta) < 0.5 ? 0 : 0.65,
              }}
            >
              {country}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: move(local, 0, 0.45, 80, 175),
          top: move(local, 0, 0.45, 110, 67),
          width: move(local, 0, 0.45, 320, 130),
          height: move(local, 0, 0.45, 48, 130),
          border: "0.8px solid #3b536c",
          borderRadius: move(local, 0, 0.45, 0, 14),
          boxShadow: "0 0 0 2px #ffffff03",
          background: scene.background,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: scene.useCountries ? 9 : "8px 16px 28px",
            opacity: intro,
            transform: `rotateY(${rotation}deg) rotateX(${-10 + Math.sin(local) * 5}deg) rotateZ(-8deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {[0, 1, 2].map((layer) => (
            <svg
              key={layer}
              viewBox="0 0 100 100"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                translate: `${layer * 0.8}px ${layer * 0.8}px`,
              }}
              aria-label={selected[active % selected.length]}
              role="img"
            >
              <path
                d={
                  scene.useCountries
                    ? countryOutlines[
                        selected[active % selected.length] as CountryKey
                      ]
                    : topologyPaths[
                        scene.environments[active % scene.environments.length]
                          .topology
                      ]
                }
                fill="none"
                stroke={layer ? "#3b536c" : scene.accent}
                strokeWidth={
                  scene.useCountries ? (layer ? 0.16 : 0.32) : layer ? 0.7 : 1.4
                }
                opacity={layer ? 0.7 : 0.65}
              />
            </svg>
          ))}
        </div>
        {!scene.useCountries ? (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              width: "100%",
              textAlign: "center",
              color: scene.accent,
              fontSize: 10,
              opacity: intro,
            }}
          >
            {selected[active % selected.length]}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          top: 213,
          width: "100%",
          textAlign: "center",
          color: "#e5e5e5",
          fontSize: 18,
          letterSpacing: "-0.035em",
          opacity: ramp(local, 0.15, 0.5),
        }}
      >
        {scene.content.geography}
      </div>
    </Interactive.Div>
  );
}
