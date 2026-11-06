/**
 * OpenAPI 3.1 description of remocn.dev's public HTTP API, served at
 * `/openapi.json`. Every path here maps to a route under `app/`;
 * lib/openapi.test.ts fails the build if one drifts from the file tree.
 *
 * The MCP server at `/mcp` speaks JSON-RPC (Model Context Protocol), not REST,
 * so it is described in `info.description` rather than as operations.
 */

const SITE_URL = "https://remocn.dev";

const ERROR_RESPONSE = (description: string) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});

const JOB_ID = {
  name: "jobId",
  in: "path",
  required: true,
  description: "Render job id returned by `createRender`.",
  schema: { type: "string", format: "uuid" },
} as const;

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Remocn API",
    version: "1.0.0",
    summary:
      "Registry items, docs search and GitHub stars video renders for Remocn, the shadcn registry of Remotion components.",
    description: [
      "Public, unauthenticated HTTP API behind remocn.dev.",
      "",
      "- **Install components** with the shadcn CLI (`npx shadcn@latest add @remocn/<name>`); it fetches `getRegistryItem` for you.",
      "- **Find components** with `getComponentIndex` (one Markdown table of every component) or `searchDocs`.",
      "- **Render a GitHub stars video**: `getStargazers` → `createRender` → poll `getRenderStatus` → `downloadRender`.",
      "",
      `Agents can also use the remote MCP server at ${SITE_URL}/mcp (Streamable HTTP, JSON-RPC, no auth) with the tools \`search_components\`, \`get_component\`, \`plan_video\` and \`preview_component\`.`,
      "",
      "Every error is JSON: `{ error, code }`, where `code` is a stable machine-readable string and `error` a human-readable message.",
    ].join("\n"),
    contact: {
      name: "Remocn",
      url: `${SITE_URL}/contact`,
      email: "kapish@remocn.dev",
    },
    license: { name: "MIT", identifier: "MIT" },
  },
  externalDocs: {
    description: "Docs index for LLMs",
    url: `${SITE_URL}/llms.txt`,
  },
  servers: [{ url: SITE_URL }],
  tags: [
    { name: "Registry", description: "shadcn registry items." },
    { name: "Docs", description: "Documentation for people and agents." },
    {
      name: "Stars video",
      description:
        "Turn a GitHub repository's stargazers into an MP4 (the /stars page).",
    },
  ],
  paths: {
    "/r/{file}": {
      get: {
        operationId: "getRegistryItem",
        tags: ["Registry"],
        summary: "Get a registry item",
        description:
          "Returns one shadcn registry item (the component's source files and dependencies) as JSON, the format the shadcn CLI installs from. Use `registry.json` for the whole registry index.",
        parameters: [
          {
            name: "file",
            in: "path",
            required: true,
            description:
              "Component name plus `.json`, e.g. `soft-blur-in.json`, or `registry.json` for the index.",
            schema: {
              type: "string",
              pattern: "^[a-z0-9][a-z0-9-]*\\.json$",
            },
          },
        ],
        responses: {
          "200": {
            description:
              "The registry item, as defined by https://ui.shadcn.com/schema/registry-item.json.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegistryItem" },
              },
            },
          },
          "404": ERROR_RESPONSE("No registry item with that name."),
        },
      },
    },
    "/api/search": {
      get: {
        operationId: "searchDocs",
        tags: ["Docs"],
        summary: "Search the docs",
        description:
          "Full-text search over every docs page, heading and paragraph. Returns an empty array when `query` is missing.",
        parameters: [
          {
            name: "query",
            in: "query",
            required: true,
            description: "Search text, e.g. `blur transition`.",
            schema: { type: "string", minLength: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum number of results.",
            schema: { type: "integer", minimum: 1 },
          },
          {
            name: "tag",
            in: "query",
            required: false,
            description: "Comma-separated tags to filter by.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Matches, best first.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SearchResult" },
                },
              },
            },
          },
        },
      },
    },
    "/llms.txt": {
      get: {
        operationId: "getLlmsIndex",
        tags: ["Docs"],
        summary: "Get the docs index for LLMs",
        description:
          "llms.txt (https://llmstxt.org): when to use Remocn, how to call it, and a link to the Markdown of every docs page.",
        responses: {
          "200": {
            description: "The index, in llms.txt Markdown.",
            content: { "text/plain": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/llms-components.txt": {
      get: {
        operationId: "getComponentIndex",
        tags: ["Docs"],
        summary: "Get the component index",
        description:
          "Every installable component in one Markdown table: when to use and avoid it, natural length, vibe, dependencies and a link to its page.",
        responses: {
          "200": {
            description: "The component index, in Markdown.",
            content: { "text/plain": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/api/stargazers": {
      get: {
        operationId: "getStargazers",
        tags: ["Stars video"],
        summary: "Get a repository's stargazers",
        description:
          "Fetches a GitHub repository's stargazers server-side and returns a downsampled list ready to pass to `createRender`.",
        parameters: [
          {
            name: "repo",
            in: "query",
            required: true,
            description:
              "`owner/name` or a github.com URL, e.g. `Remocn/remocn`.",
            schema: { type: "string", minLength: 1 },
          },
        ],
        responses: {
          "200": {
            description: "The repository's stargazers.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StargazersResult" },
              },
            },
          },
          "400": ERROR_RESPONSE(
            "Missing or malformed `repo` (code `invalid_repo`). Pass `owner/name` or a github.com URL.",
          ),
          "404": ERROR_RESPONSE(
            "Repository not found or its stargazers are private (code `not_found`).",
          ),
          "429": ERROR_RESPONSE(
            "GitHub rate limit reached (code `rate_limited`). Retry later.",
          ),
          "502": ERROR_RESPONSE(
            "GitHub request failed (code `fetch_failed`). Retry later.",
          ),
        },
      },
    },
    "/api/render": {
      post: {
        operationId: "createRender",
        tags: ["Stars video"],
        summary: "Start a stars video render",
        description:
          "Validates the props and queues a background render. Returns a job id immediately; poll `getRenderStatus`. Rate-limited per IP (5 requests per minute by default).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RenderInput" },
            },
          },
        },
        responses: {
          "202": {
            description: "Render queued.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["jobId"],
                  properties: {
                    jobId: {
                      type: "string",
                      format: "uuid",
                      description: "Pass to `getRenderStatus`.",
                    },
                  },
                },
              },
            },
          },
          "400": ERROR_RESPONSE(
            "Body is not JSON (code `invalid_json`) or breaks a field rule (code `invalid_input`; the message names the field).",
          ),
          "429": ERROR_RESPONSE(
            "Too many renders from this IP (code `rate_limited`). Wait a minute and retry.",
          ),
          "503": ERROR_RESPONSE(
            "Render queue is full (code `queue_full`). Retry shortly.",
          ),
        },
      },
    },
    "/api/render/{jobId}": {
      get: {
        operationId: "getRenderStatus",
        tags: ["Stars video"],
        summary: "Get a render's progress",
        description:
          "Poll until `status` is `done` (then follow `downloadUrl`) or `error`.",
        parameters: [JOB_ID],
        responses: {
          "200": {
            description: "The job's state.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RenderStatus" },
              },
            },
          },
          "404": ERROR_RESPONSE(
            "Unknown job (code `not_found`). Jobs live in memory and expire.",
          ),
        },
      },
    },
    "/api/render/{jobId}/download": {
      get: {
        operationId: "downloadRender",
        tags: ["Stars video"],
        summary: "Download a finished render",
        description:
          "Streams the MP4 once, then deletes it from the server. Download it as soon as `getRenderStatus` reports `done`.",
        parameters: [JOB_ID],
        responses: {
          "200": {
            description: "The rendered video.",
            content: {
              "video/mp4": {
                schema: { type: "string", contentMediaType: "video/mp4" },
              },
            },
          },
          "404": ERROR_RESPONSE("Unknown job (code `not_found`)."),
          "410": ERROR_RESPONSE(
            "Not finished yet (code `not_ready`) or already downloaded and swept (code `expired`). Start a new render.",
          ),
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        required: ["error", "code"],
        properties: {
          error: {
            type: "string",
            description: "Human-readable message.",
          },
          code: {
            type: "string",
            description:
              "Stable machine-readable code, e.g. `not_found`, `invalid_input`, `rate_limited`.",
          },
          hint: {
            type: "string",
            description: "What to do next, when the API knows.",
          },
          docs: {
            type: "string",
            format: "uri",
            description: "Where the API is described.",
          },
        },
      },
      RegistryItem: {
        type: "object",
        description:
          "A shadcn registry item. Full schema: https://ui.shadcn.com/schema/registry-item.json",
        required: ["name", "type"],
        properties: {
          $schema: { type: "string", format: "uri" },
          name: { type: "string" },
          type: { type: "string", examples: ["registry:component"] },
          title: { type: "string" },
          description: { type: "string" },
          dependencies: { type: "array", items: { type: "string" } },
          registryDependencies: { type: "array", items: { type: "string" } },
          files: {
            type: "array",
            items: {
              type: "object",
              required: ["path", "type"],
              properties: {
                path: { type: "string" },
                type: { type: "string" },
                target: { type: "string" },
                content: { type: "string" },
              },
            },
          },
        },
        additionalProperties: true,
      },
      SearchResult: {
        type: "object",
        required: ["id", "url", "type", "content"],
        properties: {
          id: { type: "string" },
          url: {
            type: "string",
            description: "Site-relative URL of the match.",
          },
          type: { type: "string", enum: ["page", "heading", "text"] },
          content: {
            type: "string",
            description: "Matched text, with hits wrapped in `<mark>`.",
          },
          breadcrumbs: { type: "array", items: { type: "string" } },
        },
      },
      Stargazer: {
        type: "object",
        required: ["login", "avatarUrl", "starredAt"],
        properties: {
          login: { type: "string" },
          avatarUrl: {
            type: "string",
            format: "uri",
            description: "Must be on avatars.githubusercontent.com.",
          },
          starredAt: {
            type: "string",
            description: "ISO 8601 date or timestamp.",
          },
        },
      },
      StargazersResult: {
        type: "object",
        required: ["owner", "repo", "totalStars", "truncated", "stargazers"],
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          totalStars: { type: "integer", minimum: 0 },
          truncated: {
            type: "boolean",
            description:
              "True when the repo is past GitHub's ~40k-star listing ceiling.",
          },
          stargazers: {
            type: "array",
            items: { $ref: "#/components/schemas/Stargazer" },
          },
        },
      },
      RenderInput: {
        type: "object",
        required: ["repo", "totalStars", "stargazers", "orientation"],
        properties: {
          repo: {
            type: "string",
            minLength: 1,
            maxLength: 200,
            description: "Shown in the video, e.g. `Remocn/remocn`.",
          },
          totalStars: {
            type: "integer",
            minimum: 0,
            maximum: 100000000,
          },
          stargazers: {
            type: "array",
            maxItems: 60,
            items: { $ref: "#/components/schemas/Stargazer" },
          },
          orientation: {
            type: "string",
            enum: ["horizontal", "vertical"],
          },
          accentColor: {
            type: "string",
            pattern: "^#[0-9a-fA-F]{3,8}$",
            default: "#ffbb00",
          },
          speed: {
            type: "number",
            minimum: 1,
            maximum: 4,
            default: 1,
          },
          theme: {
            type: "string",
            enum: ["light", "dark"],
            default: "light",
          },
        },
      },
      RenderStatus: {
        type: "object",
        required: ["status", "progress"],
        properties: {
          status: {
            type: "string",
            enum: ["queued", "rendering", "done", "error"],
          },
          progress: { type: "number", minimum: 0, maximum: 1 },
          downloadUrl: {
            type: "string",
            description: "Present when `status` is `done`.",
          },
          error: {
            type: "string",
            description: "Present when `status` is `error`.",
          },
        },
      },
    },
  },
} as const;
