import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ogCard } from "@/lib/og-card";
import { source } from "@/source";

// The label is the docs section the page sits in, named the way its sidebar
// group is (`content/docs/<section>/meta.json`).
function sectionTitle(section: string): string | undefined {
  const metaPath = join(process.cwd(), `content/docs/${section}/meta.json`);
  if (!existsSync(metaPath)) return undefined;
  const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
    title?: string;
  };
  return meta.title;
}

export const dynamic = "force-static";

// No paths at build time: each card is drawn on its first request (a crawler
// or a link preview) and cached until the next deploy. Drawing all 875 PNGs
// was the heaviest part of the build.
export function generateStaticParams() {
  return [];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);

  return ogCard({
    title: page?.data.title ?? "Remocn",
    description: page?.data.description,
    label: slug.length > 1 ? sectionTitle(slug[0]) : undefined,
  });
}
