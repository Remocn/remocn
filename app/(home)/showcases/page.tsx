import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { collectionPageJsonLd } from "@/lib/structured-data";
import { ShowcaseReel } from "./components/reel/showcase-reel";
import {
  SHOWCASES_DESCRIPTION as DESCRIPTION,
  ShowcasesHeader,
} from "./components/showcases-header";
import { getReel } from "./lib/reel";

export async function generateMetadata(): Promise<Metadata> {
  const { clips } = await getReel();
  const shareImage = clips[0]?.poster ?? "/hero.png";

  return {
    title: "Showcases",
    description: DESCRIPTION,
    alternates: { canonical: "/showcases" },
    openGraph: {
      type: "website",
      url: "/showcases",
      siteName: "Remocn",
      title: "Showcases · Remocn",
      description: DESCRIPTION,
      locale: "en_US",
      images: [{ url: shareImage, alt: "Showcases · Remocn" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Showcases · Remocn",
      description: DESCRIPTION,
      images: [shareImage],
    },
  };
}

export default async function ShowcasesPage() {
  const reel = await getReel();

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          url: "/showcases",
          title: "Showcases",
          description: DESCRIPTION,
          crumbs: [{ label: "Showcases" }],
          items: reel.clips.map((clip) => ({
            url: `/showcases/${clip.slug}`,
            name: clip.title,
          })),
        })}
      />
      <ShowcasesHeader clips={reel.clips.length} total={reel.total} />
      {reel.clips.length > 0 ? (
        <ShowcaseReel reel={reel} />
      ) : (
        <div className="landing-container pb-section">
          <p className="rounded-card bg-surface-muted px-6 py-20 text-center text-small text-muted-foreground">
            No showcases yet. The first videos are on their way.
          </p>
        </div>
      )}
    </>
  );
}
