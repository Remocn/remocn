import type { Metadata } from "next";
import { INSPIRED_BY } from "@/config/inspired-by";
import { Credits } from "./credits";
import saved from "./credits.json";
import type { CreditsConfig } from "./credits-config";

const DESCRIPTION =
  "The people on X whose work shaped remocn: motion, design and code we learned from.";

export const metadata: Metadata = {
  title: "Inspired by",
  description: DESCRIPTION,
  openGraph: { title: "Inspired by · remocn", description: DESCRIPTION },
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
