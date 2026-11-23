import { notFound } from "next/navigation";
import { docsPageComponents } from "@/components/docs/mdx-page-components";
import { DocsRail, RailCards } from "@/components/docs/shell/docs-rail";
import { KeyboardNav } from "@/components/docs/shell/keyboard-nav";
import { MobilePageBar } from "@/components/docs/shell/mobile-page-bar";
import { getPageContext } from "@/components/docs/shell/page-context";
import { PageFooter } from "@/components/docs/shell/page-footer";
import { PageHeader } from "@/components/docs/shell/page-header";
import { getPageLinks } from "@/components/docs/shell/page-links";
import { JsonLd } from "@/components/json-ld";
import { docsSeoDescription, docsSeoTitle } from "@/lib/docs-seo";
import { docsPageJsonLd, faqFromMdx } from "@/lib/structured-data";
import { getMDXComponents } from "@/mdx-components";
import { source } from "@/source";

/**
 * One docs page inside `DocsShell`: the mobile page bar, the article (header,
 * MDX body, prev/next + edit row) and the right rail.
 */
export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const data = page.data;
  const { body: MDX } = await data.load();
  const { crumbs, previous, next } = getPageContext(page.url);
  const links = params.slug?.length ? getPageLinks(page.url) : undefined;
  const raw = await (
    data as typeof data & { getText: (type: "raw") => Promise<string> }
  ).getText("raw");
  // A component page says in plain text that it is a Remotion component of
  // its kind; the bare descriptions rarely do, and search reads the body too.
  const description = data.component
    ? docsSeoDescription(seoPageFor(params.slug ?? [], data))
    : data.description;
  const jsonLd = docsPageJsonLd({
    url: page.url,
    title: data.title,
    description: data.description,
    crumbs,
    image: params.slug?.length
      ? `/og/docs/${params.slug.join("/")}`
      : "/hero.png",
    component: data.component,
    faq: faqFromMdx(raw),
    dateModified: data.lastModified,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <MobilePageBar crumbs={crumbs} />
      <KeyboardNav previous={previous} next={next} />
      <div className="flex flex-1">
        <article className="flex min-w-0 flex-1 flex-col px-5 pt-7 pb-14 lg:px-10 lg:pt-9 lg:pb-16 xl:mx-auto xl:w-full xl:max-w-(--docs-article-max) xl:px-(--docs-article-pad)">
          <PageHeader
            title={data.title}
            description={description}
            links={links}
            previous={previous}
            next={next}
          />
          <div className="typeset typeset-docs mt-6 flex-1 lg:mt-8 [&_:is(h2,h3,h4)[id]]:scroll-mt-20 xl:[&_:is(h2,h3,h4)[id]]:scroll-mt-6">
            <MDX components={getMDXComponents(docsPageComponents)} />
          </div>
          <PageFooter
            previous={previous}
            next={next}
            sourcePath={`content/docs/${page.path}`}
          />
          <RailCards />
        </article>
        <DocsRail />
      </div>
    </>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

function seoPageFor(
  slug: string[],
  data: { title: string; description?: string; component?: string },
) {
  const parent =
    slug.length > 1 ? source.getPage(slug.slice(0, -1)) : undefined;
  return {
    slug,
    title: data.title,
    description: data.description,
    component: data.component,
    parentTitle: parent?.data.title,
  };
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const data = page.data;
  const slug = params.slug ?? [];
  if (slug.length === 0) {
    return {
      title: data.title,
      description: data.description,
      alternates: { canonical: page.url },
    };
  }
  const ogUrl = `/og/docs/${slug.join("/")}`;
  const seoPage = seoPageFor(slug, data);
  const title = docsSeoTitle(seoPage);
  const description = docsSeoDescription(seoPage);
  return {
    title,
    description,
    // Agents that browse with a Chrome user agent find the Markdown here.
    alternates: {
      canonical: page.url,
      types: { "text/markdown": `${page.url}.md` },
    },
    // A page-level openGraph replaces the root one, so the shared fields
    // (url, type, siteName, locale) are restated here.
    openGraph: {
      type: "article",
      url: page.url,
      siteName: "Remocn",
      locale: "en_US",
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}
