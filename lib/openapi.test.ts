import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OPENAPI_SPEC } from "./openapi";

const ROOT = join(import.meta.dir, "..");

type Operation = {
  operationId: string;
  summary: string;
  description: string;
  parameters?: {
    name: string;
    in: string;
    required: boolean;
    description: string;
    schema: { type: string };
  }[];
  requestBody?: { content: Record<string, { schema: unknown }> };
  responses: Record<
    string,
    { description: string; content?: Record<string, { schema: unknown }> }
  >;
};

const spec = JSON.parse(JSON.stringify(OPENAPI_SPEC));
const operations: [string, string, Operation][] = Object.entries(
  spec.paths as Record<string, Record<string, Operation>>,
).flatMap(([path, methods]) =>
  Object.entries(methods).map(
    ([method, op]) => [path, method, op] as [string, string, Operation],
  ),
);

/** `/api/render/{jobId}` -> `app/api/render/[jobId]/route.ts` */
function routeFile(path: string): string {
  return join(
    ROOT,
    "app",
    ...path
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.replace(/^\{(.+)\}$/, "[$1]")),
    "route.ts",
  );
}

describe("OpenAPI spec", () => {
  test("is OpenAPI 3.1 with info and a server", () => {
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toBeTruthy();
    expect(spec.info.version).toBeTruthy();
    expect(spec.servers[0].url).toBe("https://remocn.dev");
  });

  test("every path is a real route that exports the method", () => {
    for (const [path, method] of operations) {
      const source = readFileSync(routeFile(path), "utf8");
      const exported = new RegExp(
        `export (async function|function|const) ${method.toUpperCase()}\\b|export const \\{[^}]*\\b${method.toUpperCase()}\\b`,
      );
      expect(source).toMatch(exported);
    }
  });

  test("operation ids are unique and function-call friendly", () => {
    const ids = operations.map(([, , op]) => op.operationId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/);
  });

  test("every operation has a summary, description and typed responses", () => {
    for (const [, , op] of operations) {
      expect(op.summary.length).toBeGreaterThan(0);
      expect(op.description.length).toBeGreaterThan(20);
      const ok = Object.entries(op.responses).filter(([s]) =>
        s.startsWith("2"),
      );
      expect(ok.length).toBeGreaterThan(0);
      for (const [, response] of Object.entries(op.responses)) {
        expect(response.description.length).toBeGreaterThan(0);
        for (const media of Object.values(response.content ?? {})) {
          expect(media.schema).toBeDefined();
        }
      }
    }
  });

  test("every parameter is typed and described", () => {
    for (const [path, , op] of operations) {
      for (const param of op.parameters ?? []) {
        expect(param.schema.type).toBeTruthy();
        expect(param.description.length).toBeGreaterThan(0);
        if (param.in === "path") {
          expect(param.required).toBe(true);
          expect(path).toContain(`{${param.name}}`);
        }
      }
    }
  });

  test("error responses use the shared Error schema", () => {
    for (const [, , op] of operations) {
      for (const [status, response] of Object.entries(op.responses)) {
        if (Number(status) < 400) continue;
        expect(response.content?.["application/json"]?.schema).toEqual({
          $ref: "#/components/schemas/Error",
        });
      }
    }
  });

  test("every $ref resolves", () => {
    const refs = JSON.stringify(spec).match(/"\$ref":"([^"]+)"/g) ?? [];
    for (const raw of refs) {
      const ref = raw.slice('"$ref":"'.length, -1);
      const target = ref
        .replace(/^#\//, "")
        .split("/")
        .reduce((node: Record<string, unknown> | undefined, key) => {
          return node?.[key] as Record<string, unknown> | undefined;
        }, spec);
      expect(target).toBeDefined();
    }
  });
});
