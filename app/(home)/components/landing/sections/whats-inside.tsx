import { COMPONENT_COUNT } from "@/config/site";
import { SectionTitle } from "../ui/section-title";
import { BackgroundsTile } from "./whats-inside/backgrounds-tile";
import {
  CaptionsVisual,
  FamilyTile,
  FiltersVisual,
  TransitionsVisual,
} from "./whats-inside/family-tile";
import { InstallStrip } from "./whats-inside/install-strip";
import { TypographyTile } from "./whats-inside/typography-tile";

const FAMILY_HREF = {
  typography: "/docs/typography",
  transitions: "/docs/transitions",
  captions: "/docs/captions/getting-started/introduction",
  filters: "/docs/filters/getting-started/introduction",
  backgrounds: "/docs/shaders/getting-started/introduction",
} as const;

const FAMILIES = [
  {
    href: FAMILY_HREF.transitions,
    title: "Transitions",
    description: "Cuts that don’t look like a slideshow.",
    tone: "light",
    visual: <TransitionsVisual />,
  },
  {
    href: FAMILY_HREF.captions,
    title: "Captions",
    description: "Word-by-word subtitles timed to the voiceover.",
    tone: "light",
    visual: <CaptionsVisual />,
  },
  {
    href: FAMILY_HREF.filters,
    title: "Filters",
    description: "Halftone, CRT and VHS looks over any scene.",
    tone: "dark",
    visual: <FiltersVisual />,
  },
] as const;

/** "400+" style count: the registry size rounded down to the hundred. */
const BLOCK_COUNT_LABEL = `${Math.floor(COMPONENT_COUNT / 100) * 100}+`;

export function WhatsInside() {
  return (
    <section
      data-section="whats-inside"
      className="pt-[72px] xl:pt-10 xl:pb-[140px]"
    >
      <div className="landing-container flex flex-col gap-7 xl:gap-12">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-0">
          <SectionTitle
            title="There’s a block for that"
            continuation="Five kinds of building blocks. Your agent puts them on the timeline."
            className="text-[34px]/[36px] text-wrap md:text-h2"
            continuationClassName="xl:w-[720px]"
          />
          <p
            data-reveal
            className="text-ui leading-6 text-paragraph [--reveal-i:2] md:max-w-[560px] md:text-[18px] md:leading-[27px] xl:w-[340px] xl:shrink-0"
          >
            Every remocn component belongs to one of these families. It composes
            them one scene at a time.
          </p>
        </header>
        <div className="flex flex-col gap-2.5 xl:gap-3">
          <div
            data-reveal="stagger"
            data-seq
            className="grid grid-cols-1 gap-2.5 md:grid-cols-3 xl:h-[660px] xl:grid-cols-[repeat(3,minmax(0,1fr))_372px] xl:grid-rows-[354px_294px] xl:gap-3"
          >
            <TypographyTile
              href={FAMILY_HREF.typography}
              className="md:col-span-3"
            />
            {FAMILIES.map((family) => (
              <FamilyTile key={family.title} {...family} />
            ))}
            <BackgroundsTile
              href={FAMILY_HREF.backgrounds}
              className="md:col-span-3 xl:col-span-1 xl:col-start-4 xl:row-span-2 xl:row-start-1"
            />
          </div>
          <InstallStrip
            component="soft-blur-in"
            browseHref="/docs/components"
            browseLabel={`Browse ${BLOCK_COUNT_LABEL} blocks`}
          />
        </div>
      </div>
    </section>
  );
}
