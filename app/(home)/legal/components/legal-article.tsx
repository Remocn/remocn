import {
  LEGAL_INDEX,
  LEGAL_INTRO,
  LEGAL_PARTS,
  type LegalItem,
  type LegalSection,
} from "../content";

const BODY = "text-ui leading-6 text-body";
const NUMBERS = new Map(LEGAL_INDEX.map((item) => [item.id, item.number]));

/** The legal text: intro, then both parts with numbered sections. */
export function LegalArticle() {
  return (
    <article className="min-w-0 xl:w-[680px] xl:shrink-0">
      <div className="flex flex-col gap-4 pb-12 xl:gap-5 xl:pb-16">
        <p className="text-[20px] leading-7 tracking-[-0.01em] text-foreground xl:text-[22px] xl:leading-8">
          {LEGAL_INTRO.lead}
        </p>
        <p className={BODY}>{LEGAL_INTRO.body}</p>
      </div>

      {LEGAL_PARTS.map((part, index) => (
        <section key={part.id} aria-labelledby={part.id}>
          <div className="flex items-baseline justify-between gap-4 pb-8 xl:pb-10">
            <h2
              id={part.id}
              className="scroll-mt-28 text-[34px] leading-9 tracking-heading text-foreground xl:scroll-mt-8 xl:text-[40px] xl:leading-11 xl:tracking-[-0.04em]"
            >
              {part.title}
            </h2>
            <span className="shrink-0 text-caption text-subtle">
              part {index + 1} of {LEGAL_PARTS.length}
            </span>
          </div>
          {part.sections.map((section) => (
            <LegalBlock key={section.id} section={section} />
          ))}
        </section>
      ))}
    </article>
  );
}

function LegalBlock({ section }: { section: LegalSection }) {
  return (
    <div className="flex flex-col gap-3.5 pb-12 xl:gap-4 xl:pb-14">
      <div className="flex flex-col gap-1.5 xl:gap-2">
        <span className="text-caption text-subtle tabular-nums">
          {NUMBERS.get(section.id)}
        </span>
        <h3
          id={section.id}
          className="scroll-mt-28 text-[22px] leading-7 font-medium tracking-title text-foreground xl:scroll-mt-8 xl:text-[24px] xl:leading-[30px]"
        >
          {section.title}
        </h3>
      </div>
      {section.body && <p className={BODY}>{section.body}</p>}
      {section.items && <FactList items={section.items} />}
      {section.rows && <ServiceRows rows={section.rows} />}
    </div>
  );
}

/** Facts: muted cards on desktop, one hairline card with rows below `xl`. */
function FactList({ items }: { items: LegalItem[] }) {
  return (
    <ul className="flex flex-col rounded-card bg-surface px-[18px] py-1 shadow-[0_0_0_1px_var(--hairline)] xl:gap-2 xl:bg-transparent xl:px-0 xl:pt-2 xl:pb-0 xl:shadow-none">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex flex-col gap-1.5 border-b border-hairline py-4 last:border-b-0 xl:rounded-card xl:border-b-0 xl:bg-surface-muted xl:px-[22px] xl:py-5"
        >
          <span className="text-ui leading-6 font-medium text-foreground">
            {item.title}
          </span>
          <span className={BODY}>{item.body}</span>
        </li>
      ))}
    </ul>
  );
}

function ServiceRows({ rows }: { rows: LegalItem[] }) {
  return (
    <dl className="flex flex-col rounded-card bg-surface px-[18px] py-1 shadow-[0_0_0_1px_var(--hairline)] xl:px-[22px]">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex flex-col gap-1 border-b border-hairline py-4 last:border-b-0 xl:flex-row xl:gap-5 xl:py-[18px]"
        >
          <dt className="text-ui leading-6 font-medium text-foreground xl:w-[120px] xl:shrink-0">
            {row.title}
          </dt>
          <dd className={BODY}>{row.body}</dd>
        </div>
      ))}
    </dl>
  );
}
