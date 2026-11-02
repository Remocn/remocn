import type { Metadata } from "next";
import { LegalArticle } from "./components/legal-article";
import { LegalContact } from "./components/legal-contact";
import { LegalContentsBar } from "./components/legal-contents-bar";
import { LegalHero } from "./components/legal-hero";
import { LegalIndex } from "./components/legal-index";

const DESCRIPTION =
  "How remocn handles your data, and the terms that apply to the site, the free components, and paid products.";

export const metadata: Metadata = {
  title: "Privacy & Terms",
  description: DESCRIPTION,
  alternates: { canonical: "/legal" },
  openGraph: {
    type: "website",
    url: "/legal",
    siteName: "Remocn",
    title: "Privacy & Terms · remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 675,
        alt: "Privacy & Terms · remocn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy & Terms · remocn",
    description: DESCRIPTION,
    images: ["/hero.png"],
  },
};

export default function LegalPage() {
  return (
    <>
      <LegalHero />

      <div className="pb-[72px] xl:pb-section">
        <LegalContentsBar className="xl:hidden" />
        <div className="landing-container pt-8 xl:pt-0">
          <div className="xl:flex xl:gap-[120px] xl:border-t xl:border-divider xl:pt-14">
            <aside className="hidden w-[300px] shrink-0 flex-col gap-7 self-start xl:sticky xl:top-8 xl:flex">
              <LegalIndex />
              <LegalContact />
            </aside>
            <LegalArticle />
          </div>
          <LegalContact className="xl:hidden" />
        </div>
      </div>
    </>
  );
}
