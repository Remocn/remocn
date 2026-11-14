import {
  describeQuery,
  loggedQuery,
  type SearchActor,
} from "@/lib/search/analytics-shape";

/**
 * Turns what happens in one opening of the docs search dialog into analytics
 * events. No React and no analytics client in here, so the rules are testable:
 * the dialog feeds it results, selections and the close, and it calls `emit`.
 *
 * The dialog searches on every keystroke, so most result sets are for half a
 * word. A query counts as a search once the visitor stopped on it: it stayed
 * on screen for `settleMs`, or they picked a result, or they closed the
 * dialog on it.
 */

export interface SearchRow {
  id: string;
  url: string;
  type: string;
}

export type SearchDialogEvent =
  | "search_performed"
  | "search_result_selected"
  | "search_abandoned";

export type Emit = (
  event: SearchDialogEvent,
  properties: Record<string, string | number | boolean>,
) => void;

interface Shown {
  query: string;
  rows: SearchRow[];
}

const COMPONENT_ID = "component:";

function pageOf(url: string): string {
  return url.split("#")[0];
}

/** Rows the semantic component search put in, as opposed to full-text hits. */
function componentNames(rows: SearchRow[]): string[] {
  return rows
    .filter((row) => row.type === "page" && row.id.startsWith(COMPONENT_ID))
    .map((row) => row.id.slice(COMPONENT_ID.length));
}

function pages(rows: SearchRow[]): string[] {
  return [...new Set(rows.map((row) => pageOf(row.url)))];
}

export class SearchDialogSession {
  private shown: Shown | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private reported = new Set<string>();
  private selected = false;

  constructor(
    private readonly emit: Emit,
    private readonly actor: SearchActor,
    private readonly settleMs = 1000,
  ) {}

  /** The dialog now shows `rows` for `query`. */
  results(query: string, rows: SearchRow[]): void {
    clearTimeout(this.timer);
    if (!query.trim()) {
      this.shown = undefined;
      return;
    }
    const shown = { query, rows };
    this.shown = shown;
    this.timer = setTimeout(() => this.report(shown), this.settleMs);
  }

  /** The visitor picked a row, by click or Enter. */
  select(row: SearchRow): void {
    clearTimeout(this.timer);
    this.selected = true;
    const shown = this.shown;
    if (!shown) return;
    this.report(shown);

    const component = row.id.startsWith(COMPONENT_ID)
      ? row.id.slice(COMPONENT_ID.length).split(":")[0]
      : undefined;
    this.emit("search_result_selected", {
      ...this.base(shown.query),
      url: pageOf(row.url),
      kind: component ? "component" : "docs",
      ...(component ? { component } : {}),
      row_type: row.type,
      position: pages(shown.rows).indexOf(pageOf(row.url)) + 1,
    });
  }

  /** The dialog closed. Without a selection, the last query went unanswered. */
  close(): void {
    clearTimeout(this.timer);
    const shown = this.shown;
    if (shown && !this.selected) {
      this.report(shown);
      this.emit("search_abandoned", {
        ...this.base(shown.query),
        ...this.counts(shown.rows),
        searches: this.reported.size,
      });
    }
    this.shown = undefined;
    this.selected = false;
    this.reported.clear();
  }

  private report(shown: Shown): void {
    const key = shown.query.trim().toLowerCase().replace(/\s+/g, " ");
    if (this.reported.has(key)) return;
    this.reported.add(key);
    this.emit("search_performed", {
      ...this.base(shown.query),
      ...describeQuery(shown.query),
      ...this.counts(shown.rows),
      top_components: componentNames(shown.rows).join(","),
    });
  }

  private base(query: string) {
    return {
      actor: this.actor,
      surface: "docs_dialog" as const,
      query: loggedQuery(query),
    };
  }

  private counts(rows: SearchRow[]) {
    return {
      result_count: pages(rows).length,
      component_count: componentNames(rows).length,
      has_results: rows.length > 0,
    };
  }
}
