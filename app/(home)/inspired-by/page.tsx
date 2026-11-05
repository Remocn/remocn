import type { Metadata } from "next";
import { INSPIRED_BY } from "@/config/inspired-by";
import { SITE_PAGES, sitePageOgImage } from "@/config/site-pages";
import { Credits } from "./credits";
import saved from "./credits.json";
import type { CreditsConfig } from "./credits-config";

const DESCRIPTION = SITE_PAGES["inspired-by"].description;

const TITLE = "Inspired by · Remocn";

export const metadata: Metadata = {
  title: "Inspired by",
  description: DESCRIPTION,
  alternates: { canonical: "/inspired-by" },
  openGraph: {
    type: "website",
    url: "/inspired-by",
    siteName: "Remocn",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [sitePageOgImage("inspired-by")],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [sitePageOgImage("inspired-by").url],
  },
};

/**
 * The saved look from /lab/inspired-by, minus gate weave: on the live page
 * the crawl itself is the motion, and a jittering frame on top reads as shake.
 */
const CONFIG: CreditsConfig = { ...(saved as CreditsConfig), weave: 0 };

export default function InspiredByPage() {
  return (
    <section>
      <h1 className="sr-only">Inspired by</h1>
      <Credits config={CONFIG} handles={INSPIRED_BY} />
    </section>
  );
}
