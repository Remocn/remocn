import Image from "next/image";
import { SUPPORT_EMAIL } from "@/config/site";
import { SitePageHeader } from "../../components/site-page/page-header";
import { LAST_UPDATED } from "../content";

const META = [
  { label: "last updated", value: LAST_UPDATED },
  {
    label: "questions",
    value: (
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="-mx-1.5 rounded-tile px-1.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {SUPPORT_EMAIL}
      </a>
    ),
  },
];

/** "Privacy [satin chip] & Terms" over the muted line, meta on the right. */
export function LegalHero() {
  return (
    <SitePageHeader
      eyebrow="remocn.dev/legal"
      title={
        <span className="inline-flex flex-wrap items-center gap-2.5 md:gap-3.5">
          Privacy
          <Image
            src="/legal/satin-chip.webp"
            alt=""
            width={48}
            height={48}
            priority
            className="size-9 shrink-0 -rotate-6 rounded-[11px] shadow-[inset_0_1px_0_#ffffff59,0_2px_6px_#0e10121f] md:size-12 md:rounded-control"
          />
          &amp; Terms
        </span>
      }
      continuation="How Remocn handles your data."
      className="gap-6 pb-6 md:gap-5"
      asideClassName="xl:w-auto xl:pb-1.5"
    >
      <dl className="flex gap-8 xl:gap-10">
        {META.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 xl:gap-1.5">
            <dt className="text-caption text-subtle">{item.label}</dt>
            <dd className="text-ui text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </SitePageHeader>
  );
}
