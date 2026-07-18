import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "takumi-js/response";
import { source } from "@/source";

const asset = (p: string) => join(process.cwd(), p);

const bgDataUri = `data:image/png;base64,${readFileSync(
  asset("public/og/neuro-dark.png"),
).toString("base64")}`;

const markDataUri = `data:image/svg+xml;base64,${Buffer.from(
  readFileSync(asset("public/logo-mark.svg"), "utf8").replace(
    /currentColor/g,
    "#ffffff",
  ),
).toString("base64")}`;

const manrope700 = readFileSync(asset("app/og/fonts/manrope-700.woff2"));

export const dynamic = "force-static";

export function generateStaticParams() {
  return source
    .getPages()
    .map((page) => ({ slug: page.slugs }))
    .filter((p) => p.slug.length > 0);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  const title = page?.data.title ?? "Remocn";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 72,
        fontFamily: "Manrope",
        position: "relative",
      }}
    >
      <img
        src={bgDataUri}
        width={1200}
        height={630}
        alt=""
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={markDataUri} width={30} height={32} alt="" />
        <span
          style={{
            color: "#ffffff",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          emocn
        </span>
      </div>
      <div
        style={{
          display: "flex",
          color: "#ffffff",
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: -2,
          lineHeight: 1.05,
          maxWidth: 960,
        }}
      >
        {title}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Manrope", data: manrope700, weight: 700, style: "normal" },
      ],
    },
  );
}
