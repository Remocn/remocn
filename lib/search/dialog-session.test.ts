import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";
import { SearchDialogSession, type SearchRow } from "./dialog-session";

const clock: SearchRow[] = [
  {
    id: "component:clock-sweep",
    url: "/docs/numbers/clock-sweep",
    type: "page",
  },
  {
    id: "component:clock-sweep:description",
    url: "/docs/numbers/clock-sweep",
    type: "text",
  },
  { id: "p1", url: "/docs/guides/timing", type: "page" },
  { id: "p1-text", url: "/docs/guides/timing#minutes", type: "text" },
];

function session() {
  const events: [string, Record<string, unknown>][] = [];
  const instance = new SearchDialogSession(
    (event, properties) => events.push([event, properties]),
    "human",
    1000,
  );
  return { instance, events, names: () => events.map(([name]) => name) };
}

describe("SearchDialogSession", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts a query once the visitor stopped on it, not every keystroke", () => {
    const { instance, events, names } = session();

    instance.results("se", clock);
    jest.advanceTimersByTime(300);
    instance.results("setup takes five minutes", clock);
    jest.advanceTimersByTime(1000);

    expect(names()).toEqual(["search_performed"]);
    expect(events[0][1]).toMatchObject({
      actor: "human",
      surface: "docs_dialog",
      query: "setup takes five minutes",
      query_words: 4,
      query_script: "latin",
      result_count: 2,
      component_count: 1,
      top_components: "clock-sweep",
      has_results: true,
    });
  });

  it("reports the search and the pick when a result is opened right away", () => {
    const { instance, events, names } = session();

    instance.results("timing", clock);
    instance.select(clock[3]);
    instance.close();

    expect(names()).toEqual(["search_performed", "search_result_selected"]);
    expect(events[1][1]).toMatchObject({
      query: "timing",
      url: "/docs/guides/timing",
      kind: "docs",
      row_type: "text",
      position: 2,
    });
  });

  it("names the component when a semantic result is picked", () => {
    const { instance, events } = session();

    instance.results("five minutes", clock);
    instance.select(clock[1]);

    expect(events[1][1]).toMatchObject({
      kind: "component",
      component: "clock-sweep",
      position: 1,
    });
  });

  it("reports an abandoned search when the dialog closes with no pick", () => {
    const { instance, events, names } = session();

    instance.results("revenue", []);
    jest.advanceTimersByTime(1000);
    instance.results("revenue growth", []);
    instance.close();

    expect(names()).toEqual([
      "search_performed",
      "search_performed",
      "search_abandoned",
    ]);
    expect(events[2][1]).toMatchObject({
      query: "revenue growth",
      has_results: false,
      searches: 2,
    });
  });

  it("does not count the same query twice in one opening", () => {
    const { instance, names } = session();

    instance.results("clock", clock);
    jest.advanceTimersByTime(1000);
    instance.results("clo", clock);
    instance.results("Clock ", clock);
    jest.advanceTimersByTime(1000);

    expect(names()).toEqual(["search_performed"]);
  });

  it("stays silent when the dialog closes on an empty field", () => {
    const { instance, names } = session();

    instance.results("", []);
    instance.close();

    expect(names()).toEqual([]);
  });
});
