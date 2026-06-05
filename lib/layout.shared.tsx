import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

// The custom `SiteHeader` (mounted in `app/docs/layout.tsx`) owns the only top
// bar, and `DocsLayout` is passed `nav={{ enabled: false }}`. So this no longer
// supplies a Fumadocs `nav.title` / `links` / `githubUrl` — doing so would only
// feed a second, suppressed header. Theme + i18n remain Fumadocs' job via
// `RootProvider`, untouched here.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false,
    },
  };
}
