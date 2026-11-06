import type { Metadata } from "next";
import { SITE_PAGES, sitePageOgImage } from "@/config/site-pages";
import { CONTACT } from "@/config/trust-pages";
import { SitePageHeader } from "../components/site-page/page-header";
import { TrustArticle } from "../components/site-page/trust-article";

const DESCRIPTION = SITE_PAGES.contact.description;

const TITLE = "Contact · Remocn";

export const metadata: Metadata = {
  title: "Contact",
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    siteName: "Remocn",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [sitePageOgImage("contact")],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [sitePageOgImage("contact").url],
  },
};

export default function ContactPage() {
  return (
    <>
      <SitePageHeader
        eyebrow="remocn.dev/contact"
        title="Contact"
        continuation="Questions, bugs, sponsorship."
      />
      <TrustArticle
        lead={CONTACT.lead}
        channels={CONTACT.channels}
        sections={CONTACT.sections}
      />
    </>
  );
}
