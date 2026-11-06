import Link from "next/link";
import type {
  ContactChannel,
  TrustLink,
  TrustSection,
} from "@/config/trust-pages";
import { cn } from "@/lib/utils";
import { landingButtonVariants } from "../landing/ui/landing-button";

/**
 * Body of /about and /contact, in the type and card styles of /legal: a large
 * lead, then sections of h2 + paragraphs, with optional channel cards and a
 * row of follow-up links.
 */

const BODY = "text-ui leading-6 text-body";

/** Renders `code` spans written in backticks. */
function Prose({ text }: { text: string }) {
  return text
    .split(/(`[^`]+`)/g)
    .map((part, index) =>
      part.startsWith("`") && part.endsWith("`") ? (
        <code key={index}>{part.slice(1, -1)}</code>
      ) : (
        part
      ),
    );
}

export function TrustArticle({
  lead,
  sections,
  channels,
  links,
}: {
  lead: string;
  sections: TrustSection[];
  channels?: ContactChannel[];
  links?: TrustLink[];
}) {
  return (
    <div className="landing-container pb-[72px] xl:pb-section">
      <article className="min-w-0 xl:border-t xl:border-divider xl:pt-14">
        <div className="flex flex-col gap-12 xl:w-[680px] xl:gap-14">
          <p className="text-[20px] leading-7 tracking-[-0.01em] text-foreground xl:text-[22px] xl:leading-8">
            {lead}
          </p>

          {channels && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {channels.map((channel) => (
                <li key={channel.title}>
                  <a
                    href={channel.href}
                    {...(channel.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="flex h-full flex-col gap-1.5 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--hairline)] outline-none transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-caption text-subtle">
                      {channel.title}
                    </span>
                    <span className="text-ui leading-6 font-medium text-foreground">
                      {channel.value}
                    </span>
                    <span className={BODY}>{channel.body}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="flex flex-col gap-3.5 xl:gap-4"
            >
              <h2
                id={section.id}
                className="scroll-mt-28 text-[22px] leading-7 font-medium tracking-title text-foreground xl:scroll-mt-8 xl:text-[24px] xl:leading-[30px]"
              >
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className={BODY}>
                  <Prose text={paragraph} />
                </p>
              ))}
            </section>
          ))}

          {links && (
            <nav aria-label="Next" className="flex flex-wrap gap-2.5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  {...(link.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  className={cn(
                    landingButtonVariants({ variant: "secondary" }),
                    "h-11 rounded-control-sm px-4 text-[15px] leading-5 xl:h-10 xl:text-small",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </article>
    </div>
  );
}
