# Fantasy Draft Assistant

A live-day fantasy football draft assistant. It runs alongside whatever platform you're
actually drafting on (manual entry today, live-synced with Sleeper) and continuously answers
four questions: what's happening, what it means for your roster, what's likely to happen next,
and what you should do right now.

See [`docs/concept-doc.md`](docs/concept-doc.md) for the full product concept and architecture.

## Goals

- Turn static player rankings and ADP into real-time, context-aware pick recommendations
  during a live draft — not just a ranked list, but a decision at the exact moment it's needed.
- Work as a side-by-side companion to the platform you're actually drafting on: decide the
  pick here, execute it there. The app should never need to be the system of record for a
  live platform draft.
- Start narrow (a single sport, a single real platform) but keep the sport/platform boundary
  clean enough that neither the recommendation engine nor the UI needs to know which one is
  active.

## Core Features

- **League Rules & Personal Strategy setup** — team count, roster slots, snake/linear draft
  order, and a choice of four named draft strategies (Best Player Available, Fill a Need,
  Balanced, or BPA-until-80%-rostered).
- **VBD/VORP recommendation engine** — replacement-level value, roster-need scoring, and a
  strategy-driven blend of the two, with plain-language reasoning for every suggestion.
- **Manual draft mode** — fast tap-to-draft entry with placeholder NFL player data, for
  testing or drafting without a connected platform.
- **Live Sleeper sync** — connects to a real Sleeper draft (by username + draft ID), pulls
  real players and league settings, and polls for live picks every few seconds.
- **Real recommendations for live drafts** — Sleeper has no projections of its own, so real
  ADP/rank/projected-points are merged in from ESPN's public API, matched to Sleeper's real
  players by name. The Draft Board looks and works identically whether you're in Manual or
  Sleeper mode.
- **Draft Board** — My Team (roster fill status), Your Next Pick (top suggestion + reasoning +
  a few rounds of projected future picks), Also Consider (what other strategies would suggest),
  and a sortable/filterable Available Players table with position/tier badges and an
  ADP-based availability estimate.
- **My Roster & All Rosters views** — a full roster breakdown per team, plus a Team Analysis
  panel (value over replacement by position, bye-week conflicts, a plain-language strength
  summary) for your own team.
- **Local-first persistence** — draft state is saved to IndexedDB as you go, so a page refresh
  mid-draft doesn't lose anything.
- **Mobile-first, responsive** — designed to be usable one-handed on a phone during a draft.

## Build Roadmap

Checked items are built and verified (unit-tested, and where relevant, checked against a real
Sleeper draft). Unchecked items are the planned next slices, roughly in order.

### Phase 1 — Manual draft board + recommendation engine
- [x] Domain model: `Player`, `RosterSlot`, `LeagueSettings`, `DraftState`
- [x] VBD/VORP engine: replacement level, value, need score, blended ranking
- [x] Placeholder NFL seed data + `ManualAdapter` for tap-to-draft entry
- [x] League Rules & Personal Strategy setup page
- [x] Named draft strategies (BPA / Fill a Need / Balanced / BPA-then-Need-80%)
- [x] Draft Board: My Team, Your Next Pick, Also Consider, Available Players
- [x] Position-rank and tier badges on Available Players
- [x] ADP-based "availability" estimate (probability a player lasts to your next pick)
- [x] "Anticipated Next Rounds" — simulated future picks assuming opponents draft by ADP
- [x] My Roster page: Team Analysis (value over replacement, bye-week conflicts, plain-language summary)
- [x] All Rosters view
- [x] IndexedDB persistence (draft survives a page refresh)

### Phase 2 — Live Sleeper draft tracker
- [x] `SleeperAdapter` implementing the shared `DraftAdapter` interface
- [x] Connect-to-Sleeper flow (username + draft ID → real league settings + real players)
- [x] Live pick polling, replayed through the existing reducer
- [x] Graceful sync-failure handling (3 failed polls → manual "switch to manual entry" recovery)
- [x] Verified against a real Sleeper league end-to-end

### Phase 3 — Real recommendations for live drafts
- [x] ESPN public-API integration for real ADP/rank/projected points
- [x] Name+position matching between Sleeper's and ESPN's player pools
- [x] `hasProjections` gating so recommendations degrade gracefully instead of showing fabricated rankings
- [x] Draft Board parity between Manual and Sleeper modes
- [x] Verified against a real, completed Sleeper draft

### Phase 4 — Hardening & polish (next up)
- [ ] Test live sync against an in-progress (not yet completed) real Sleeper draft
- [ ] Adaptive polling cadence (slow when idle, fast when on the clock) instead of a fixed interval
- [ ] Bye-week data for Sleeper-sourced players (currently Manual-mode only)
- [ ] Auto-deploy pipeline so the public demo updates on push, instead of a manual rebuild

### Later phases — not yet started
- [ ] Category/roto scoring engine (Z-scores, SGP) for MLB/NBA leagues
- [ ] Additional live adapters (Yahoo, ESPN fantasy platform itself)
- [ ] Auction draft support (max-bid calculator, inflation/deflation tracking)
- [ ] "The One Thing" banner, Panic Mode, and clock-aware recommendation detail
- [ ] Opponent intelligence (Manager DNA, Draft Capital Efficiency, Opponent Blocking)
- [ ] Decision-support modules (Trap Value Detection, Counterfactual Drafting, Regret-Aware Recommendations)
- [ ] Advanced Mode custom rule scripting / importing published expert rankings
- [ ] Season-long features (waivers, trades) beyond draft day
