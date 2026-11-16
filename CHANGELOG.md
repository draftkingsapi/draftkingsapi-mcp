# Changelog

All notable changes to this package. Dates are UTC.

## Unreleased

- Every tool description now says when to use it instead of its siblings, what the rows contain, and what it costs;
  every argument has a description. Added the arguments the API already accepts: `offset`, `book`, `min_prob`,
  `alt_lines` and `confidence` on `get_ev`, `book` on `get_arbitrage`, `min_ev` and `sort` on `get_compare_books`.
- Tool annotations add `destructiveHint: false` and `idempotentHint: true`; the server sends instructions on connect.
- Dockerfile for container builds (Glama and other registries).

## 0.1.0 - 2026-11-15

- First release: stdio MCP server for the DraftKings API at https://draftkingsapi.com. Keyless tools work with no key; set
  `DRAFTKINGS_API_KEY` for the rest. Published to npm as `draftkingsapi-mcp`.
