import { SITE_PAGES } from "@/config/site-pages";
import { ogCard } from "@/lib/og-card";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SITE_PAGES).map((page) => ({ page }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> },
) {
  const { page } = await params;
  const entry = SITE_PAGES[page as keyof typeof SITE_PAGES];
  return ogCard({ title: entry.title, description: entry.description });
}
