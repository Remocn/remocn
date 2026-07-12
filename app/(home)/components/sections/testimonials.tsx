import { type Testimonial, testimonials } from "@/config/testimonials";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";

function TestimonialCard({
  authorAvatar,
  authorName,
  url,
  quote,
}: Testimonial) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="surface-card flex w-80 shrink-0 flex-col gap-4 rounded-2xl p-5 transition-colors hover:border-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="flex items-center gap-3">
        {/** biome-ignore lint/performance/noImgElement: remote unavatar.io avatars of arbitrary origin */}
        <img
          src={authorAvatar}
          alt={authorName}
          loading="lazy"
          className="size-10 rounded-full border border-border object-cover"
        />
        <span className="text-sm font-medium text-foreground">
          {authorName}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
        {quote}
      </p>
    </a>
  );
}

function MarqueeRow({
  items,
  reverse = false,
}: {
  items: Testimonial[];
  reverse?: boolean;
}) {
  return (
    <div className="group flex overflow-hidden">
      <div
        className="flex shrink-0 gap-4 pr-4 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:[animation:none]"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {items.map((t, i) => (
          <TestimonialCard key={`${t.authorName}-${i}`} {...t} />
        ))}
        {items.map((t, i) => (
          <TestimonialCard key={`${t.authorName}-${i}-dup`} {...t} />
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const topRow = testimonials;
  const bottomRow = [...testimonials].reverse();

  return (
    <section id="testimonials" className="relative py-14 sm:py-20">
      <div className="section">
        <SectionHeading
          align="center"
          eyebrow="Wall of love"
          title="Builders are shipping with remocn"
          lead="Developers turning their products into demo videos — one registry component at a time."
        />
      </div>

      <FadeUp delay={0.1}>
        <div className="marquee-edge-fade mt-12 flex flex-col gap-4">
          <MarqueeRow items={topRow} />
          <MarqueeRow items={bottomRow} reverse />
        </div>
      </FadeUp>
    </section>
  );
}
