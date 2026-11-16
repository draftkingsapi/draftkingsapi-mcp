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

const limit = (max: number) => z.number().int().min(1).max(max).optional().describe(`Rows to return, 1 to ${max}. Smaller pages cost fewer credits.`);
const cursor = z.string().optional().describe("Opaque pagination.next_cursor from the previous page, passed unchanged. Omit for the first page.");
const offset = z.number().int().min(0).optional().describe("Rows to skip for the next page (0 for the first page).");
const after = z.string().optional().describe("Resume point: pagination.next or next_after from the previous page, unchanged, or 'latest' to start at the newest change.");
const pick6League = z
  .enum(["nfl", "nba", "nhl", "cfb", "cbb", "soccer", "mlb", "ufc", "cs", "lol"])
  .optional()
  .describe("League slug in lower case. Omit for every league.");
const sport = z.string().optional().describe("Sport code in upper case, for example NFL, NBA, NHL, MLB, NCAAF, NCAAB, SOCCER. Omit for every sport.");
const league = z.string().optional().describe("League code, for example NBA, NFL, NHL, NCAAF, NCAAB, MLB, EPL. Omit for every league.");
const statsSport = z.enum(["NBA", "NFL", "NHL", "NCAAF", "NCAAB", "MLB", "WNBA"]).describe("Sport code.");
const season = z.number().int().describe("Season year: NFL and NCAAF use the starting year, NBA and NHL the ending year (2026 for 2025-26).");
const marketType = z.enum(["moneyline", "spread", "total", "player_prop"]).optional().describe("Market family. Omit for all four.");
const eventId = z.string().optional().describe("One event's event_id, from get_sportsbook_events or a previous row.");
const eventStatus = z.enum(["pre", "in", "post", "unknown"]).optional().describe("Game state: pre (not started), in (live), post (final). Omit for all.");
const freshOnly = z.boolean().optional().describe("true drops rows whose capture is older than the freshness window (each row carries age and stale flags).");
const player = z.string().optional().describe("Part of a player name, case-insensitive.");
const team = z.string().optional().describe("Part of a team name or abbreviation.");
const slateId = z.string().optional().describe("slate_id from get_dfs_slates. Omit for every current slate.");

const KEYLESS = "No key and no credits; delayed and capped, 60 requests a minute per address.";
const KEYED = "Needs DRAFTKINGS_API_KEY (free key, no card, at https://draftkingsapi.com/sign-up); billed per row, see get_credit_costs.";

export const TOOLS: ToolDef[] = [
  // Keyless
  {
    name: "get_public_board",
    title: "Pick6 board (keyless)",
    description: `Delayed, capped DraftKings Pick6 board for a quick look without a key: player, stat, line, More/Less multipliers, start time and recent line moves. Use it to answer "what are the Pick6 lines for X" when no key is set; with a key, get_pick6_projections returns the full live board. ${KEYLESS}`,
    path: "/api/v1/public/board",
    keyed: false,
    shape: { league: pick6League, limit: limit(200) },
  },
  {
    name: "get_public_sportsbook",
    title: "Sportsbook mainlines (keyless)",
    description: `Delayed DraftKings Sportsbook moneyline, spread and total prices per game (American and decimal odds), without a key. Use it for a quick price check; with a key, get_odds returns every current market with capture age, and get_odds_history the earlier prices. ${KEYLESS}`,
    path: "/api/v1/public/sportsbook",
    keyed: false,
    shape: {
      league: z.enum(["nfl", "nba", "nhl", "cfb", "cbb", "mlb", "epl", "mls"]).optional().describe("League slug in lower case. Omit for every league."),
      limit: limit(200),
    },
  },
  {
    name: "get_public_line_moves",
    title: "Recent line moves (keyless)",
    description: `Recent Pick6 line changes and DraftKings Sportsbook line and price changes, newest first, each with the previous and current value and the time it was seen. Use it for "what moved recently" without a key; for the full ordered change feed use get_pick6_history, and for one prop's moves get_pick6_line_history. ${KEYLESS}`,
    path: "/api/v1/public/line-moves",
    keyed: false,
    shape: {
      league: z
        .enum(["nfl", "nba", "nhl", "cfb", "cbb", "soccer", "mlb", "epl", "mls", "ufc", "cs", "lol"])
        .optional()
        .describe("League slug in lower case. Omit for every league."),
      market: z.enum(["all", "pick6", "sportsbook"]).optional().describe("pick6, sportsbook or all (default)."),
      limit: limit(200),
    },
  },
  {
    name: "get_demo_sample",
    title: "Sample rows (keyless)",
    description: `Frozen sample rows that show one dataset's response shape and field names, so you can plan a keyed call or write parsing code. The rows are frozen or invented fixtures: never present them as current lines or prices. ${KEYLESS}`,
    path: "/api/v1/demo/{dataset}",
    keyed: false,
    required: ["dataset"],
    shape: {
      dataset: z
        .enum(["pick6", "dfs", "events", "odds", "history", "pick6-history", "coverage", "stats-games", "stats-player-games", "stats-team-games"])
        .describe("Dataset whose sample to return; each matches a keyed tool (pick6 = get_pick6_projections, odds = get_odds, and so on)."),
      limit: limit(100),
      sport,
    },
  },
  {
    name: "get_credit_costs",
    title: "Credit costs (keyless)",
    description: `How many credits each API path costs per 100 rows, or the cost of one path at a given row count. Call it before a large keyed read to estimate spend. ${KEYLESS}`,
    path: "/api/v1/credit-costs",
    keyed: false,
    shape: {
      path: z.string().optional().describe("An API path such as /api/v1/odds. Omit for the whole table."),
      rows: z.number().int().min(1).optional().describe("Row count to price for that path."),
    },
  },
  {
    name: "get_status",
    title: "Collection status (keyless)",
    description: `Measured collection health right now: each collector job, its last run and the age of each dataset. Use it when data looks stale or a user asks whether the feed is up; for which leagues and datasets have rows, use get_coverage. ${KEYLESS}`,
    path: "/status.json",
    keyed: false,
    shape: {},
  },
  {
    name: "get_history_coverage",
    title: "History coverage (keyless)",
    description: `When stored history starts for each league and dataset, with capture counts. Use it before asking get_odds_history or get_pick6_history for an old date, to know whether rows exist. ${KEYLESS}`,
    path: "/history-coverage.json",
    keyed: false,
    shape: {},
  },
  // Keyed
  {
    name: "get_coverage",
    title: "Live coverage",
    description: `Which datasets, sports and leagues have rows right now for your key, with row counts and capture times. Call it first in a session to avoid empty queries; for collector health use get_status. ${KEYED}`,
    path: "/api/v1/coverage",
    keyed: true,
    shape: {},
  },
  {
    name: "get_sportsbook_events",
    title: "Sportsbook events",
    description: `DraftKings Sportsbook events (games) with teams, start time, state and event_id. Use it to find an event_id to pass to get_odds or get_odds_history; it returns no prices. Paginate with cursor. ${KEYED}`,
    path: "/api/v1/events",
    keyed: true,
    shape: {
      sport,
      event_id: eventId,
      status: eventStatus,
      search: z.string().optional().describe("Part of a team or event name."),
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_odds",
    title: "Sportsbook odds",
    description: `Latest captured DraftKings Sportsbook prices (American and decimal odds) by event and market, each row with capture time, age and a stale flag. Use it for the current price; use get_odds_history for earlier prices, get_compare_books to see other books on the same line. Paginate with cursor. ${KEYED}`,
    path: "/api/v1/odds",
    keyed: true,
    shape: {
      sport,
      event_id: eventId,
      market: z.string().optional().describe("moneyline, spread, total or a player prop market name."),
      status: eventStatus,
      fresh_only: freshOnly,
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_odds_history",
    title: "Sportsbook price history",
    description: `Earlier captured DraftKings Sportsbook mainline quotes for an event or offer, each with its capture time, to chart how a price moved. Captures are periodic, not a complete open-to-close tape; check get_history_coverage for start dates. For the current price use get_odds. Paginate with cursor. ${KEYED}`,
    path: "/api/v1/history",
    keyed: true,
    shape: {
      sport,
      event_id: eventId,
      offer_id: z.string().optional().describe("One offer's offer_id from a get_odds row, to follow a single market."),
      market: z.string().optional().describe("moneyline, spread or total."),
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_pick6_projections",
    title: "Pick6 lines",
    description: `Latest captured DraftKings Pick6 lines: player, stat, line, More/Less standings multipliers, status and pickable_id, including paused, live and alternate lines. A standings multiplier is not decimal odds. Use it for the current board; get_pick6_history for changes, get_compare for Pick6 against the sportsbook. Paginate with cursor. ${KEYED}`,
    path: "/api/v1/pick6/projections",
    keyed: true,
    shape: {
      sport,
      stat: z.string().optional().describe("Stat as Pick6 writes it, for example Points or Rushing Yards."),
      team,
      search: z.string().optional().describe("Part of a player name."),
      status: z.enum(["open", "paused", "live", "pregame"]).optional().describe("Line state. Omit for all."),
      pickable_id: z.string().optional().describe("One prop's pickable_id, to fetch just that prop."),
      fresh_only: freshOnly,
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_pick6_history",
    title: "Pick6 change history",
    description: `The ordered feed of every recorded Pick6 line, multiplier and availability change across the board, oldest first from a resume point. Use it for alerts or your own archive: after=latest returns no rows and the newest resume point, so later calls get only new changes. For one prop's labelled moves use get_pick6_line_history. ${KEYED}`,
    path: "/api/v1/pick6/history",
    keyed: true,
    shape: {
      sport,
      stat: z.string().optional().describe("Stat as Pick6 writes it, for example Points."),
      pickable_id: z.string().optional().describe("Limit to one prop's pickable_id."),
      after,
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_pick6_line_history",
    title: "Line history of one Pick6 prop",
    description: `Recorded changes for one Pick6 prop, each labelled line_move, multiplier_only, availability or alternate_lines with before and after values and times. Use it to answer "how has this line moved"; get the pickable_id from get_pick6_projections or the id on a get_public_board row. ${KEYED}`,
    path: "/api/v1/pick6/line-history",
    keyed: true,
    shape: {
      pickable_id: z.string().describe("The prop's pickable_id (required)."),
      change_type: z.enum(["line_move", "multiplier_only", "availability", "alternate_lines"]).optional().describe("Only this kind of change. Omit for all."),
      limit: limit(100),
      cursor,
    },
  },
  {
    name: "get_dfs_slates",
    title: "DFS slates",
    description: `Current DraftKings DFS slates by sport, with slate_id and start time. Step one for DFS: pass the slate_id to get_dfs_players for salaries or get_dfs_contests for contests. ${KEYED}`,
    path: "/api/v1/dfs/slates",
    keyed: true,
    shape: { sport, slate_id: slateId, limit: limit(100), cursor },
  },
  {
    name: "get_dfs_contests",
    title: "DFS contests",
    description: `DraftKings DFS contests for a sport or slate: entry fee, prize pool and entries. Use it to compare contests; for player salaries use get_dfs_players. ${KEYED}`,
    path: "/api/v1/dfs/contests",
    keyed: true,
    shape: { sport, slate_id: slateId, limit: limit(100), cursor },
  },
  {
    name: "get_dfs_players",
    title: "DFS players and salaries",
    description: `DraftKings DFS players for current slates: salary, roster position, team and game. One athlete can have several rows, one per lineup slot. A salary is a lineup budget value, not a price or a betting line. ${KEYED}`,
    path: "/api/v1/dfs/players",
    keyed: true,
    shape: { sport, slate_id: slateId, team, search: z.string().optional().describe("Part of a player name."), limit: limit(100), cursor },
  },
  {
    name: "get_compare",
    title: "Pick6 against sportsbook",
    description: `DraftKings Pick6 line next to the DraftKings Sportsbook over/under for the same player, stat and game: both lines, Pick6 multipliers, sportsbook American odds with no-vig probabilities, and line_gap (Pick6 minus sportsbook). Use it to find Pick6 lines that differ from the book; to compare sportsbooks with each other use get_compare_books. ${KEYED}`,
    path: "/api/v1/compare",
    keyed: true,
    shape: {
      sport: z.string().optional().describe("NFL, NBA, NHL or CFB. Omit for all."),
      stat: z.string().optional().describe("Stat as Pick6 writes it, for example Rushing Yards."),
      player,
      min_gap: z.number().optional().describe("Only rows where the two lines differ by at least this many stat units."),
      sort: z.enum(["gap", "start"]).optional().describe("gap (largest first, default) or start (soonest game first)."),
      limit: limit(200),
      offset,
    },
  },
  {
    name: "get_compare_books",
    title: "Lines across books",
    description: `Every upcoming DraftKings market that another venue also lists: DraftKings price per side, the Novig exchange fair probability on the same line, DraftKings EV percent against it, FanDuel and other sportsbook prices, the PrizePicks line with line_gap, and the best price per side. Recomputed about once a minute, pregame only. Use it to shop one line across books; get_ev ranks only +EV prices, get_arbitrage only guaranteed-profit pairs. ${KEYED}`,
    path: "/api/v1/compare/books",
    keyed: true,
    shape: {
      league,
      market_type: marketType,
      player,
      team,
      stat: z.string().optional().describe("Canonical stat slug, for example points, rebounds, passing_yards, shots_on_goal."),
      with_fair: z.boolean().optional().describe("true: only rows with a Novig fair price; false: only rows without one."),
      min_ev: z.number().optional().describe("Only rows where a DraftKings side has at least this EV, in percent."),
      sort: z.enum(["start", "ev"]).optional().describe("start (soonest game first, default) or ev (best DraftKings EV first)."),
      limit: limit(200),
      offset,
    },
  },
  {
    name: "get_ev",
    title: "Expected value prices",
    description: `Sportsbook prices (DraftKings, FanDuel, BetRivers) that pay more than the Novig exchange fair probability on the same side and line, best first. Each row has ev_pct = (fair probability x decimal price - 1) x 100, edge in cents, full and quarter Kelly, and a confidence flag. Default view: fair probability at least 15 percent, main lines, high confidence. Free keys see the top 10 rows of a pass at least 10 minutes old. Analysis, not betting advice. ${KEYED}`,
    path: "/api/v1/ev",
    keyed: true,
    shape: {
      league,
      market_type: marketType,
      book: z.string().optional().describe("Comma list of books: dk, fd, br. Omit for all."),
      player,
      min_edge: z.number().optional().describe("Minimum EV, in percent."),
      min_prob: z.number().optional().describe("Minimum fair probability, in percent (default 15)."),
      alt_lines: z.boolean().optional().describe("true adds alternate lines (default main lines only)."),
      confidence: z.enum(["high", "any"]).optional().describe("high (default) drops stale prices and thin exchange books; any keeps them."),
      sort: z.enum(["ev", "edge_cents", "kelly"]).optional().describe("ev (default), edge_cents or kelly."),
      limit: limit(200),
      offset,
    },
  },
  {
    name: "get_arbitrage",
    title: "Arbitrage and middles",
    description: `Cross-book opportunities across DraftKings, FanDuel and the Novig exchange. type=arbitrage: two legs at different venues that cover both outcomes for less than they pay, with profit percent and the stake split that returns the same either way (Novig legs at the ask, fees included). type=middles: an over at one book and an under at a higher line elsewhere, with the window where both legs win. Use get_ev for one-sided value instead. Developer plan and up; a Free key gets three sample rows and an upgrade link, at no cost. ${KEYED}`,
    path: "/api/v1/arbitrage",
    keyed: true,
    shape: {
      type: z.enum(["arbitrage", "middles"]).optional().describe("arbitrage (default) or middles."),
      league,
      market_type: marketType,
      book: z.string().optional().describe("Only rows with a leg at one of these books, comma list: dk, fd, br."),
      min_profit: z.number().optional().describe("Minimum guaranteed profit, in percent of total stake (arbitrage only)."),
      limit: limit(200),
      offset,
    },
  },
  {
    name: "get_stats_player_games",
    title: "Player box scores",
    description: `Player game logs (box score lines) for a sport and season from independent ESPN statistics, to check how a player did against a line. Retained samples, not a full-season feed or bet settlement; an empty page says available=false. For team scores use get_stats_games. Paginate with after. ${KEYED}`,
    path: "/api/v1/stats/player-games",
    keyed: true,
    shape: {
      sport: statsSport,
      season,
      athlete_id: z.string().optional().describe("One athlete's id from a previous row."),
      team_id: z.string().optional().describe("One team's id from a previous row."),
      event_id: z.string().optional().describe("One game's event_id."),
      limit: limit(200),
      after,
    },
  },
  {
    name: "get_stats_games",
    title: "Game results",
    description: `Game results (teams, final or current score, state) for a sport and season from independent ESPN statistics. Retained samples, not a full-season feed or bet settlement; an empty page says available=false. For per-player lines use get_stats_player_games. Paginate with after. ${KEYED}`,
    path: "/api/v1/stats/games",
    keyed: true,
    shape: {
      sport: statsSport,
      season,
      event_id: z.string().optional().describe("One game's event_id."),
      completed: z.boolean().optional().describe("true for finished games only, false for unfinished."),
      limit: limit(200),
      after,
    },
  },
];
