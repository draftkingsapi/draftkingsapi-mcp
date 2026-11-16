/**
 * Stdio MCP server for draftkingsapi.com, an independent DraftKings data API (not affiliated with DraftKings).
 * Keyless tools work with no key. Keyed tools read DRAFTKINGS_API_KEY from the environment.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SIGN_UP_URL, TOOLS, type ToolDef } from "./tools.js";

export const VERSION = "0.1.0";
const BASE_URL = (process.env.DRAFTKINGS_API_BASE ?? "https://draftkingsapi.com").replace(/\/+$/, "");
const MAX_TEXT = 60000;

type Args = Record<string, unknown>;
type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const text = (value: string, isError = false): ToolResult => ({ content: [{ type: "text", text: value }], ...(isError ? { isError } : {}) });

function render(body: unknown) {
  const out = typeof body === "string" ? body : JSON.stringify(body);
  return out.length > MAX_TEXT
    ? `${out.slice(0, MAX_TEXT)}\n[truncated at ${MAX_TEXT} characters; pass a smaller limit, or follow pagination.next_cursor]`
    : out;
}

export async function callTool(tool: ToolDef, args: Args, apiKey = process.env.DRAFTKINGS_API_KEY, fetchImpl: typeof fetch = fetch) {
  if (tool.keyed && !apiKey)
    return text(
      `${tool.name} needs a draftkingsapi.com API key. Get a free key (100 credits a month, no card) at ${SIGN_UP_URL}, ` +
        `then set DRAFTKINGS_API_KEY in this MCP server's env and restart it. Keyless tools that work now: ` +
        TOOLS.filter((t) => !t.keyed)
          .map((t) => t.name)
          .join(", ") +
        ".",
      true,
    );
  const { task, ...rest } = args;
  let path = tool.path;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined || v === null || v === "") continue;
    if (path.includes(`{${k}}`)) path = path.replace(`{${k}}`, encodeURIComponent(String(v)));
    else query.set(k, String(v));
  }
  const qs = query.toString();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": `draftkingsapi-mcp/${VERSION}`,
    "X-DK-Client": "mcp",
  };
  if (tool.keyed && apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (typeof task === "string" && task.trim()) headers["X-User-Request"] = encodeURIComponent(task.trim().slice(0, 500));
  let res: Response;
  try {
    res = await fetchImpl(`${BASE_URL}${path}${qs ? `?${qs}` : ""}`, { headers, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    return text(`Could not reach ${BASE_URL}: ${e instanceof Error ? e.message : String(e)}`, true);
  }
  const raw = await res.text();
  let body: unknown = raw;
  try {
    body = JSON.parse(raw);
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    const err = (body as { error?: Record<string, unknown> })?.error ?? {};
    const lines = [`HTTP ${res.status}${err.type ? ` ${err.type}` : ""}: ${String(err.message ?? raw.slice(0, 500))}`];
    if (res.status === 401) lines.push(`Check DRAFTKINGS_API_KEY. Free key: ${SIGN_UP_URL}`);
    const retry = res.headers.get("retry-after");
    if (res.status === 429 && retry) lines.push(`Retry after ${retry} seconds.`);
    if (err.agent_next_step) lines.push(`Next step: ${String(err.agent_next_step)}`);
    if (err.upgrade_url) lines.push(`Upgrade: ${String(err.upgrade_url)}`);
    return text(lines.join("\n"), true);
  }
  return text(render(body));
}

export function createServer(apiKey = process.env.DRAFTKINGS_API_KEY) {
  const server = new McpServer(
    { name: "draftkingsapi", version: VERSION },
    {
      instructions:
        "Independent DraftKings data (not affiliated with DraftKings): Pick6 lines and line moves, DFS slates and salaries, " +
        "sportsbook odds and price history, cross-book EV and arbitrage, and box scores. Every tool is read-only. " +
        "Tools whose title says keyless need no key; the rest need DRAFTKINGS_API_KEY (free at " + SIGN_UP_URL + "). " +
        "Start with get_coverage (keyed) or get_public_board (keyless). Every row carries a capture time; check it before calling a line current.",
    },
  );
  const task = z
    .string()
    .max(500)
    .optional()
    .describe("Optional, never a filter: the user's task in one plain sentence, with no personal data or secrets. Logged for 35 days to guide what the API builds next.");
  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: { ...tool.shape, task },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      },
      async (args: Args) => callTool(tool, args, apiKey),
    );
  }
  return server;
}
