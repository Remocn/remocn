import type { Metadata } from "next";
import type { ComponentProps } from "react";
import { changelog } from "@/.source/server";
import { ChangelogPreview } from "@/components/changelog/changelog-preview";
import { getMDXComponents } from "@/mdx-components";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every release of remocn — new components, transitions, shaders, icons, and improvements, newest first.",
  openGraph: {
    title: "Changelog · remocn",
    description:
      "Every release of remocn — new components, transitions, shaders, icons, and improvements, newest first.",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const entryComponents = {
  ...getMDXComponents(),
  ChangelogPreview,
  h3: (props: ComponentProps<"h3">) => <h3 {...props} id={undefined} />,
  h4: (props: ComponentProps<"h4">) => <h4 {...props} id={undefined} />,
};

export default function ChangelogPage() {
  const entries = [...changelog].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  return (
    <>
      <section className="pt-24 pb-10 sm:pt-28">
        <div className="section">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Changelog
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            New components, transitions, shaders, and icons as they ship.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="section flex flex-col gap-16">
          {entries.map((entry) => {
            const slug = entry.info.path.replace(/\.mdx$/, "");
            const iso = entry.date.toISOString().slice(0, 10);
            const MDX = entry.body;

            return (
              <article
                key={slug}
                id={slug}
                className="scroll-mt-24 border-t border-border pt-8 md:grid md:grid-cols-[10rem_1fr] md:gap-8"
              >
                <div className="md:sticky md:top-24 md:self-start">
                  <time
                    dateTime={iso}
                    className="font-mono text-xs font-medium text-muted-foreground"
                  >
                    {dateFormatter.format(entry.date)}
                  </time>
                </div>

                <div className="mt-4 min-w-0 md:mt-0">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    <a href={`#${slug}`} className="hover:underline">
                      {entry.title}
                    </a>
                  </h2>
                  <div className="typeset typeset-docs mt-6">
                    <MDX components={entryComponents} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
