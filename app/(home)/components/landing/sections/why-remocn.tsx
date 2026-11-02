import { SectionTitle } from "../ui/section-title";
import { CompareCard, type CompareCardProps } from "./why-remocn/compare-card";
import { Reasons } from "./why-remocn/reasons";

const COMPARISON: CompareCardProps[] = [
  {
    label: "A motion designer",
    value: ["$600, 2 weeks"],
    caption: "And three rounds of “can we make it pop more”.",
    tone: "muted",
  },
  {
    label: "remocn + your agent",
    value: ["1 prompt,", "1 afternoon"],
    caption:
      "The animation is already built and timed. You react to the result.",
    tone: "shader",
  },
];

export function WhyRemocn() {
  return (
    <section
      data-section="why-remocn"
      className="landing-container flex flex-col gap-7 pt-[72px] lg:gap-14 xl:pt-5 xl:pb-[140px]"
    >
      <SectionTitle
        title="Why remocn"
        continuation="Every other way costs you something."
        className="text-[34px]/[36px] text-wrap md:items-center md:text-center"
      />
      <div
        data-reveal="stagger"
        data-seq
        className="flex flex-col gap-2.5 lg:flex-row lg:gap-3"
      >
        {COMPARISON.map((card) => (
          <CompareCard key={card.label} {...card} />
        ))}
      </div>
      <Reasons />
    </section>
  );
}
