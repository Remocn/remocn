import type { Metadata } from "next";
import { INSPIRED_BY } from "@/config/inspired-by";
import { Credits } from "./credits";
import saved from "./credits.json";
import type { CreditsConfig } from "./credits-config";

const DESCRIPTION =
  "The people on X whose work shaped Remocn: motion, design and code we learned from.";

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
    images: [{ url: "/hero.png", width: 1200, height: 675, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/hero.png"],
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
