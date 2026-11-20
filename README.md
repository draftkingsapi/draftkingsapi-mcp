# DraftKings MCP server: draftkingsapi-mcp

**Website: [draftkingsapi.com](https://draftkingsapi.com/?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp)** for docs, a free API key, pricing and live status.

A DraftKings MCP server for Claude, Cursor and any MCP client. Ask an AI agent for DraftKings sportsbook odds, Pick6 lines or DFS salaries; it answers from live data through draftkingsapi.com.

[Website](https://draftkingsapi.com/?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp) | [Docs](https://draftkingsapi.com/docs?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp) | [Free API key](https://draftkingsapi.com/auth/sign-up?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp) | [Pricing](https://draftkingsapi.com/pricing?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp) | [All SDKs](https://draftkingsapi.com/sdks?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp)

Also for draftkingsapi.com: [Python: `pip install draftkingsapi`](https://github.com/draftkingsapi/draftkingsapi-python) | [JavaScript: `npm install draftkingsapi`](https://github.com/draftkingsapi/draftkingsapi-js)

A stdio MCP server for [draftkingsapi.com](https://draftkingsapi.com/?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp). It gives AI agents DraftKings Pick6 lines and
line history, DFS slates and salaries, sportsbook odds and price history, cross-book comparisons and box scores.

The keyless tools work with no key and spend no credits. The keyless board tools (`get_public_board`,
`get_public_sportsbook`, `get_public_line_moves`) are a preview limited to 25 calls a day per network. The keyed tools read `DRAFTKINGS_API_KEY`. Without one,
they return a message that links to the free sign-up (100 credits a month, no card):
https://draftkingsapi.com/auth/sign-up?utm_source=npm&utm_medium=readme&utm_campaign=draftkingsapi-mcp

draftkingsapi.com is an independent API. It is not affiliated with or endorsed by DraftKings. "DraftKings" is a
trademark of its owner and is used here only to describe the data.

## Tools

| Tool | Key | What it returns |
| --- | --- | --- |
| `get_public_board` | no | Delayed, capped Pick6 board plus recent line moves |
| `get_public_sportsbook` | no | Sportsbook moneyline, spread and total per game |
| `get_public_line_moves` | no | Recent Pick6 and sportsbook line moves |
| `get_demo_sample` | no | Frozen sample rows showing a dataset's shape |
| `get_credit_costs` | no | Credits per endpoint |
| `get_status` | no | Measured collection status and dataset freshness |
| `get_history_coverage` | no | When stored history starts, by league |
| `get_coverage` | yes | Live coverage for your key |
| `get_sportsbook_events`, `get_odds`, `get_odds_history` | yes | Sportsbook events, current prices, price history |
| `get_pick6_projections`, `get_pick6_history`, `get_pick6_line_history` | yes | Pick6 lines, the change feed, one prop's line moves |
| `get_dfs_slates`, `get_dfs_contests`, `get_dfs_players` | yes | DFS slates, contests, players and salaries |
| `get_compare`, `get_compare_books`, `get_ev`, `get_arbitrage` | yes | Pick6 against the sportsbook, lines across books, expected value, arbitrage and middles |
| `get_stats_games`, `get_stats_player_games` | yes | Game results and player box scores |

Every tool is read-only. Every tool also takes an optional `task` argument: one plain sentence about what the user
wants, sent as `X-User-Request`. Never put anything personal in it.

## Claude Desktop

Edit `claude_desktop_config.json` (Settings, Developer, Edit Config):

```json
{
  "mcpServers": {
    "draftkingsapi": {
      "command": "npx",
      "args": ["-y", "draftkingsapi-mcp"],
      "env": { "DRAFTKINGS_API_KEY": "dk_your_key" }
    }
  }
}
```

Leave out `env` to use only the keyless tools.

## Claude Code

```bash
claude mcp add draftkingsapi -e DRAFTKINGS_API_KEY=dk_your_key -- npx -y draftkingsapi-mcp
# keyless only:
claude mcp add draftkingsapi -- npx -y draftkingsapi-mcp
```

## Cursor

`~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "draftkingsapi": {
      "command": "npx",
      "args": ["-y", "draftkingsapi-mcp"],
      "env": { "DRAFTKINGS_API_KEY": "dk_your_key" }
    }
  }
}
```

## Hosted alternative

You can skip the local install. A remote MCP server (Streamable HTTP) runs at `https://draftkingsapi.com/api/mcp`.
For the data tools, send the header `Authorization: Bearer dk_your_key`.

## Try it

Ask your agent: "Use draftkingsapi to show the current NBA Pick6 board and which lines moved." It calls
`get_public_board` with `league: "nba"`, which needs no key.

## Plans

Free 100 credits a month (no card), Developer $49 (10,000 credits), Pro $99 (30,000), Production $149 (50,000) and Scale $499 (250,000) a month. Full pricing: https://draftkingsapi.com/pricing.

## Development

```bash
npm install
npm test     # builds, spawns the server over stdio, lists tools, calls get_public_board live (no key, no credits)
DRAFTKINGS_OFFLINE=1 npm test   # skips the live call
```

`DRAFTKINGS_API_BASE` overrides the API origin for testing.

MIT License.
