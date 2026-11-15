import { z } from "zod";

export const SIGN_UP_URL = "https://draftkingsapi.com/sign-up";

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  path: string;
  keyed: boolean;
  shape: z.ZodRawShape;
  /** Arguments that go into the path or are renamed; everything else is a query parameter. */
  required?: string[];
}

const limit = (max: number) => z.number().int().min(1).max(max).optional().describe(`Rows to return, at most ${max}.`);
const cursor = z.string().optional().describe("pagination.next_cursor from the previous page, unchanged.");
const after = z.string().optional().describe("pagination.next / next_after from the previous page, or 'latest'.");
const pick6League = z
  .enum(["nfl", "nba", "nhl", "cfb", "cbb", "soccer", "mlb", "ufc", "cs", "lol"])
  .optional()
  .describe("League. Omit for every league.");
const sport = z.string().optional().describe("Sport code in upper case, for example NFL, NBA, NHL, MLB, NCAAF, NCAAB, SOCCER.");
const statsSport = z.enum(["NBA", "NFL", "NHL", "NCAAF", "NCAAB", "MLB", "WNBA"]);
const marketType = z.enum(["moneyline", "spread", "total", "player_prop"]).optional();

const KEYLESS = "No key needed, no credits.";
const KEYED = "Needs DRAFTKINGS_API_KEY (free key, no card, at https://draftkingsapi.com/sign-up).";

export const TOOLS: ToolDef[] = [
  // Keyless
  {
    name: "get_public_board",
    title: "Pick6 board (keyless)",
    description: `Delayed, capped DraftKings Pick6 board: player, stat, line, multipliers, start time, plus recent line moves. ${KEYLESS}`,
    path: "/api/v1/public/board",
    keyed: false,
    shape: { league: pick6League, limit: limit(200) },
  },
  {
    name: "get_public_sportsbook",
    title: "Sportsbook mainlines (keyless)",
    description: `DraftKings Sportsbook moneyline, spread and total prices per game. ${KEYLESS}`,
    path: "/api/v1/public/sportsbook",
    keyed: false,
    shape: {
      league: z.enum(["nfl", "nba", "nhl", "cfb", "cbb", "mlb", "epl", "mls"]).optional().describe("League. Omit for every league."),
      limit: limit(200),
    },
  },
  {
    name: "get_public_line_moves",
    title: "Recent line moves (keyless)",
    description: `Recent Pick6 and sportsbook line moves with previous and current line. ${KEYLESS}`,
    path: "/api/v1/public/line-moves",
    keyed: false,
    shape: {
      league: z.string().optional().describe("League in lower case, for example nfl or nba."),
      market: z.enum(["all", "pick6", "sportsbook"]).optional(),
      limit: limit(200),
    },
  },
  {
    name: "get_demo_sample",
    title: "Sample rows (keyless)",
    description: `Frozen sample rows that show a dataset's response shape. Never present them as data. ${KEYLESS}`,
    path: "/api/v1/demo/{dataset}",
    keyed: false,
    required: ["dataset"],
    shape: {
      dataset: z.enum([
        "pick6",
        "dfs",
        "events",
        "odds",
        "history",
        "pick6-history",
        "coverage",
        "stats-games",
        "stats-player-games",
        "stats-team-games",
      ]),
      limit: limit(100),
      sport,
    },
  },
  {
    name: "get_credit_costs",
    title: "Credit costs (keyless)",
    description: `Credits each endpoint costs, optionally for a path and row count. ${KEYLESS}`,
    path: "/api/v1/credit-costs",
    keyed: false,
    shape: {
      path: z.string().optional().describe("An API path such as /api/v1/odds."),
      rows: z.number().int().min(1).optional(),
    },
  },
  {
    name: "get_status",
    title: "Collection status (keyless)",
    description: `Measured collection status: jobs, workers and the freshness of each dataset. ${KEYLESS}`,
    path: "/status.json",
    keyed: false,
    shape: {},
  },
  {
    name: "get_history_coverage",
    title: "History coverage (keyless)",
    description: `When stored history starts for each league, with capture counts. ${KEYLESS}`,
    path: "/history-coverage.json",
    keyed: false,
    shape: {},
  },
  // Keyed
  {
    name: "get_coverage",
    title: "Live coverage",
    description: `Live coverage of every dataset for your key. ${KEYED}`,
    path: "/api/v1/coverage",
    keyed: true,
    shape: {},
  },
  {
    name: "get_sportsbook_events",
    title: "Sportsbook events",
    description: `DraftKings Sportsbook events and start times. ${KEYED}`,
    path: "/api/v1/events",
    keyed: true,
    shape: { sport, event_id: z.string().optional(), status: z.enum(["pre", "in", "post", "unknown"]).optional(), search: z.string().optional(), limit: limit(100), cursor },
  },
  {
    name: "get_odds",
    title: "Sportsbook odds",
    description: `Current DraftKings Sportsbook prices by event and market, with age and stale flags. ${KEYED}`,
    path: "/api/v1/odds",
    keyed: true,
    shape: {
      sport,
      event_id: z.string().optional(),
      market: z.string().optional().describe("moneyline, spread, total or a prop market."),
      status: z.enum(["pre", "in", "post", "unknown"]).optional(),
      fresh_only: z.boolean().optional(),
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_odds_history",
    title: "Sportsbook price history",
    description: `Stored DraftKings Sportsbook price history for an event or offer. ${KEYED}`,
    path: "/api/v1/history",
    keyed: true,
    shape: { sport, event_id: z.string().optional(), offer_id: z.string().optional(), market: z.string().optional(), limit: limit(100), cursor },
  },
  {
    name: "get_pick6_projections",
    title: "Pick6 lines",
    description: `Current DraftKings Pick6 lines with multipliers, full board, every league. ${KEYED}`,
    path: "/api/v1/pick6/projections",
    keyed: true,
    shape: {
      sport,
      stat: z.string().optional(),
      team: z.string().optional(),
      search: z.string().optional().describe("Player name."),
      status: z.enum(["open", "paused", "live", "pregame"]).optional(),
      pickable_id: z.string().optional(),
      fresh_only: z.boolean().optional(),
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_pick6_history",
    title: "Pick6 change history",
    description: `Every recorded Pick6 line, multiplier and availability change, oldest first. ${KEYED}`,
    path: "/api/v1/pick6/history",
    keyed: true,
    shape: { sport, stat: z.string().optional(), pickable_id: z.string().optional(), after, limit: limit(100), cursor },
  },
  {
    name: "get_pick6_line_history",
    title: "Line history of one Pick6 prop",
    description: `Recorded moves for one Pick6 prop (pickable_id from get_pick6_projections or get_public_board id). ${KEYED}`,
    path: "/api/v1/pick6/line-history",
    keyed: true,
    shape: {
      pickable_id: z.string().describe("The prop's pickable_id."),
      change_type: z.enum(["line_move", "multiplier_only", "availability", "alternate_lines"]).optional(),
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_dfs_slates",
    title: "DFS slates",
    description: `DraftKings DFS slates by sport. ${KEYED}`,
    path: "/api/v1/dfs/slates",
    keyed: true,
    shape: { sport, slate_id: z.string().optional(), limit: limit(100), cursor },
  },
  {
    name: "get_dfs_contests",
    title: "DFS contests",
    description: `DraftKings DFS contests with entry fee, prize pool and entries. ${KEYED}`,
    path: "/api/v1/dfs/contests",
    keyed: true,
    shape: { sport, slate_id: z.string().optional(), limit: limit(100), cursor },
  },
  {
    name: "get_dfs_players",
    title: "DFS players and salaries",
    description: `DraftKings DFS players with salaries and positions for a slate. ${KEYED}`,
    path: "/api/v1/dfs/players",
    keyed: true,
    shape: { sport, slate_id: z.string().optional(), team: z.string().optional(), search: z.string().optional(), limit: limit(100), cursor },
  },
  {
    name: "get_compare",
    title: "Pick6 against sportsbook",
    description: `Pick6 lines next to DraftKings Sportsbook lines for the same player, stat and game, with the gap. ${KEYED}`,
    path: "/api/v1/compare",
    keyed: true,
    shape: {
      sport,
      stat: z.string().optional(),
      player: z.string().optional(),
      min_gap: z.number().optional(),
      sort: z.enum(["gap", "start"]).optional(),
      limit: limit(200),
    },
  },
  {
    name: "get_compare_books",
    title: "Lines across books",
    description: `Lines across books with an optional fair price. ${KEYED}`,
    path: "/api/v1/compare/books",
    keyed: true,
    shape: {
      league: z.string().optional(),
      market_type: marketType,
      player: z.string().optional(),
      team: z.string().optional(),
      stat: z.string().optional(),
      with_fair: z.boolean().optional(),
      limit: limit(200),
    },
  },
  {
    name: "get_ev",
    title: "Expected value prices",
    description: `Prices with positive expected value against a fair line. Analysis, not advice. ${KEYED}`,
    path: "/api/v1/ev",
    keyed: true,
    shape: {
      league: z.string().optional(),
      market_type: marketType,
      book: z.string().optional(),
      player: z.string().optional(),
      min_edge: z.number().optional(),
      sort: z.enum(["ev", "edge_cents", "kelly"]).optional(),
      limit: limit(200),
    },
  },
  {
    name: "get_arbitrage",
    title: "Arbitrage and middles",
    description: `Arbitrage and middle opportunities across books. ${KEYED}`,
    path: "/api/v1/arbitrage",
    keyed: true,
    shape: {
      type: z.enum(["arbitrage", "middles"]).optional(),
      league: z.string().optional(),
      market_type: marketType,
      min_profit: z.number().optional(),
      limit: limit(200),
    },
  },
  {
    name: "get_stats_player_games",
    title: "Player box scores",
    description: `Player game logs for a sport and season. ${KEYED}`,
    path: "/api/v1/stats/player-games",
    keyed: true,
    shape: {
      sport: statsSport,
      season: z.number().int().describe("Season year, for example 2026."),
      athlete_id: z.string().optional(),
      team_id: z.string().optional(),
      event_id: z.string().optional(),
      limit: limit(200),
      after,
    },
  },
  {
    name: "get_stats_games",
    title: "Game results",
    description: `Game results for a sport and season. ${KEYED}`,
    path: "/api/v1/stats/games",
    keyed: true,
    shape: { sport: statsSport, season: z.number().int(), event_id: z.string().optional(), completed: z.boolean().optional(), limit: limit(200), after },
  },
];
