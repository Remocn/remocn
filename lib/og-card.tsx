import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "takumi-js/response";

/**
 * The share card every page without its own poster uses (Paper "Remocn ·
 * Component Ideas" → OG images → C): the magenta shader as the surface, a
 * scrim under the copy, wordmark top-left, a label top-right, and the title
 * with its description at the bottom.
 */

const asset = (p: string) => join(process.cwd(), p);

const shaderDataUri = `data:image/png;base64,${readFileSync(
  asset("public/landing/shader-magenta.png"),
).toString("base64")}`;

const markDataUri = `data:image/svg+xml;base64,${Buffer.from(
  readFileSync(asset("public/logo-mark.svg"), "utf8").replace(
    /currentColor/g,
    "#ffffff",
  ),
).toString("base64")}`;

const geist400 = readFileSync(asset("app/og/fonts/geist-400.woff2"));
const geist500 = readFileSync(asset("app/og/fonts/geist-500.woff2"));
const manrope600 = readFileSync(asset("app/og/fonts/manrope-600.woff2"));

export const OG_SIZE = { width: 1200, height: 630 } as const;

// Long titles step the type down and leave the description fewer lines, so
// the copy block never climbs into the wordmark row.
const titleSize = (title: string) =>
  title.length <= 16 ? 96 : title.length <= 32 ? 80 : 60;

function clampDescription(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const words = cut.slice(0, cut.lastIndexOf(" "));
  return `${words.replace(/[\s,;:.—–-]+$/, "")}…`;
}

export function ogCard({
  title,
  description,
  label,
}: {
  title: string;
  description?: string;
  label?: string;
}) {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 64,
        position: "relative",
        backgroundColor: "#0e1012",
        color: "#ffffff",
      }}
    >
      {/** biome-ignore lint/performance/noImgElement: ImageResponse renders plain img only */}
      <img
        src={shaderDataUri}
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          backgroundImage:
            "linear-gradient(20deg, rgba(14,16,18,0.88) 0%, rgba(14,16,18,0.55) 40%, rgba(14,16,18,0) 75%)",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/** biome-ignore lint/performance/noImgElement: ImageResponse renders plain img only */}
          <img src={markDataUri} width={22} height={24} alt="" />
          <span
            style={{
              fontFamily: "Manrope",
              fontWeight: 600,
              fontSize: 26,
              lineHeight: "28px",
              letterSpacing: "-0.02em",
            }}
          >
            emocn
          </span>
        </div>
        {label ? (
          <span
            style={{
              fontFamily: "Geist",
              fontWeight: 400,
              fontSize: 20,
              lineHeight: "24px",
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {label}
          </span>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 880,
          fontFamily: "Geist",
        }}
      >
        <span
          style={{
            fontWeight: 500,
            fontSize: titleSize(title),
            lineHeight: 0.98,
            letterSpacing: "-0.05em",
          }}
        >
          {title}
        </span>
        {description ? (
          <span
            style={{
              fontWeight: 400,
              fontSize: 34,
              lineHeight: "42px",
              letterSpacing: "-0.025em",
              color: "rgba(255,255,255,0.72)",
            }}
          >
            {clampDescription(description, title.length > 32 ? 100 : 150)}
          </span>
        ) : null}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: geist400, weight: 400, style: "normal" },
        { name: "Geist", data: geist500, weight: 500, style: "normal" },
        { name: "Manrope", data: manrope600, weight: 600, style: "normal" },
      ],
    },
  );
}
