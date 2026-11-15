// Spawns the built server over stdio with the MCP client SDK. The keyless call goes to the live API (no key, no
// credits); set DRAFTKINGS_OFFLINE=1 to skip it.
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const offline = process.env.DRAFTKINGS_OFFLINE === "1";

async function connect(env = {}) {
  const { DRAFTKINGS_API_KEY, ...rest } = process.env;
  const transport = new StdioClientTransport({ command: process.execPath, args: [cli], env: { ...rest, ...env } });
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(transport);
  return client;
}

test("lists keyless and keyed tools", async () => {
  const client = await connect();
  try {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const n of ["get_public_board", "get_public_sportsbook", "get_public_line_moves", "get_demo_sample", "get_credit_costs", "get_status", "get_odds", "get_pick6_line_history", "get_dfs_players", "get_ev"])
      assert.ok(names.includes(n), `missing ${n}`);
    assert.ok(tools.every((t) => t.annotations?.readOnlyHint === true));
  } finally {
    await client.close();
  }
});

test("keyed tool without a key points to sign-up", async () => {
  const client = await connect();
  try {
    const out = await client.callTool({ name: "get_odds", arguments: { sport: "NFL" } });
    assert.equal(out.isError, true);
    assert.match(out.content[0].text, /draftkingsapi\.com\/sign-up/);
  } finally {
    await client.close();
  }
});

test("keyless tool returns live data", { skip: offline }, async () => {
  const client = await connect();
  try {
    const out = await client.callTool({ name: "get_public_board", arguments: { league: "nba", limit: 2, task: "Run the MCP server test" } });
    assert.notEqual(out.isError, true, out.content[0].text);
    const body = JSON.parse(out.content[0].text);
    assert.equal(body.feed, "pick6-board");
    assert.ok(Array.isArray(body.props));
  } finally {
    await client.close();
  }
});

test("bad argument is rejected by the schema", async () => {
  const client = await connect();
  try {
    const out = await client.callTool({ name: "get_public_board", arguments: { league: "xfl" } });
    assert.equal(out.isError, true);
  } finally {
    await client.close();
  }
});
