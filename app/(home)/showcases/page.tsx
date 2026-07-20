import type { Metadata } from "next";
import { getShowcases } from "@/lib/showcases";
import { ShowcaseGrid } from "./components/showcase-grid";
import {
  SHOWCASES_DESCRIPTION as DESCRIPTION,
  ShowcasesHero,
} from "./components/showcases-hero";

export async function generateMetadata(): Promise<Metadata> {
  const showcases = await getShowcases();
  const shareImage = showcases[0]?.posterUrl ?? "/hero.png";

  return {
    title: "Showcases",
    description: DESCRIPTION,
    openGraph: {
      type: "website",
      url: "/showcases",
      siteName: "Remocn",
      title: "Showcases · remocn",
      description: DESCRIPTION,
      locale: "en_US",
      images: [{ url: shareImage, alt: "Showcases · remocn" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Showcases · remocn",
      description: DESCRIPTION,
      images: [shareImage],
    },
  };
}

export default async function ShowcasesPage() {
  const showcases = await getShowcases();

  return (
    <>
      <ShowcasesHero />

      <section className="pb-24">
        <div className="section">
          {showcases.length > 0 ? (
            <ShowcaseGrid showcases={showcases} />
          ) : (
            <div className="surface-card rounded-2xl px-6 py-20 text-center">
              <p className="text-sm text-muted-foreground">
                No showcases yet — the first videos are on their way.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
