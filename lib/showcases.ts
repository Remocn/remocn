import { z } from "zod";

const showcaseComponentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
});

const showcaseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  videoUrl: z.url(),
  posterUrl: z.url(),
  author: z.object({
    name: z.string().min(1),
    avatarUrl: z.url(),
    url: z.url().nullable(),
  }),
  components: z.array(showcaseComponentSchema),
  githubUrl: z.url().nullish(),
  createdAt: z.iso.datetime({ offset: true }),
});

const showcaseListSchema = z.object({ items: z.array(showcaseSchema) });

export type Showcase = z.infer<typeof showcaseSchema>;
export type ShowcaseComponent = z.infer<typeof showcaseComponentSchema>;

const REVALIDATE_SECONDS = 300;

function apiBase(): string {
  const base = process.env.SHOWCASES_API_URL;
  if (!base) {
    throw new Error(
      "SHOWCASES_API_URL is not set. The showcases pages read from the manager both at build time and at runtime — set it in .env locally, and in Coolify as a build variable *and* a runtime variable.",
    );
  }
  return base.replace(/\/+$/, "");
}

export async function getShowcases(): Promise<Showcase[]> {
  const res = await fetch(`${apiBase()}/api/public/showcases`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`showcases: HTTP ${res.status} ${res.statusText}`);
  }
  return showcaseListSchema.parse(await res.json()).items;
}

export async function getShowcase(slug: string): Promise<Showcase | null> {
  const res = await fetch(
    `${apiBase()}/api/public/showcases/${encodeURIComponent(slug)}`,
    { next: { revalidate: REVALIDATE_SECONDS } },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`showcase ${slug}: HTTP ${res.status} ${res.statusText}`);
  }
  return showcaseSchema.parse(await res.json());
}
