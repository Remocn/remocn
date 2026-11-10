import { describe, expect, test } from "bun:test";
import { DELETE, GET, PATCH, POST, PUT } from "../route";

describe("unknown /api paths", () => {
  for (const [method, handler] of Object.entries({
    GET,
    POST,
    PUT,
    PATCH,
    DELETE,
  })) {
    test(`${method} answers a JSON 404 with a hint`, async () => {
      const res = handler(
        new Request("https://remocn.dev/api/nope", { method }),
      );
      expect(res.status).toBe(404);
      expect(res.headers.get("content-type")).toContain("application/json");
      expect(await res.json()).toEqual({
        error: "No API endpoint at /api/nope.",
        code: "not_found",
        hint: "See https://remocn.dev/openapi.json for the available endpoints.",
        docs: "https://remocn.dev/openapi.json",
      });
    });
  }
});
