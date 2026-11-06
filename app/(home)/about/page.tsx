import type { Metadata } from "next";
import { SITE_PAGES, sitePageOgImage } from "@/config/site-pages";
import { ABOUT } from "@/config/trust-pages";
import { SitePageHeader } from "../components/site-page/page-header";
import { TrustArticle } from "../components/site-page/trust-article";

const DESCRIPTION = SITE_PAGES.about.description;

const TITLE = "About · Remocn";

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: "/about",
    siteName: "Remocn",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [sitePageOgImage("about")],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [sitePageOgImage("about").url],
  },
};

export default function AboutPage() {
  return (
    <>
      <SitePageHeader
        eyebrow="remocn.dev/about"
        title="About Remocn"
        continuation="Video components your agent can use."
      />
      <TrustArticle
        lead={ABOUT.lead}
        sections={ABOUT.sections}
        links={ABOUT.links}
      />
    </>
  );
}
