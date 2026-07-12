import { DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { DocsAdRail } from "@/components/docs/docs-ad-rail";
import { getMDXComponents } from "@/mdx-components";
import { source } from "@/source";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const data = page.data;
  const MDX = data.body;
  const isIcons = params.slug?.[0] === "icons";

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      tableOfContent={{ enabled: true, component: <DocsAdRail /> }}
      tableOfContentPopover={{ enabled: false }}
      footer={{ enabled: !isIcons }}
      className={isIcons ? "max-w-none" : undefined}
    >
      <DocsTitle
        style={{ fontFamily: "var(--font-display)" }}
        className="text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl"
      >
        {data.title}
      </DocsTitle>
      <DocsDescription className="mt-3 mb-0 max-w-3xl text-balance text-lg text-muted-foreground md:text-xl">
        {data.description}
      </DocsDescription>
      <div className="typeset typeset-docs mt-8 flex-1">
        <MDX components={getMDXComponents()} />
      </div>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const data = page.data;
  return {
    title: data.title,
    description: data.description,
  };
}
