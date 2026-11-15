import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Facts about the HTTP request behind an MCP tool call. The SDK builds the
 * server per request and hands tool handlers only the tool arguments, so the
 * route stores what analytics needs here and the handlers read it back.
 */
export interface McpRequestContext {
  userAgent: string;
}

export const mcpRequestContext = new AsyncLocalStorage<McpRequestContext>();
