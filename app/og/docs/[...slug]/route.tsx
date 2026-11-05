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

  return ogCard({
    title: page?.data.title ?? "Remocn",
    description: page?.data.description,
    label: slug.length > 1 ? sectionTitle(slug[0]) : undefined,
  });
}
