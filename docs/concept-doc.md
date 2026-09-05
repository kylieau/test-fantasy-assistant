# Live-Day Fantasy Draft Assistant — Concept Doc

## 1. Product Overview

A unified, cross-sport, cross-platform live draft assistant. Starts as a personal tool built for draft day, architected from day one to generalize to other sports (NFL, MLB, NBA, NHL), other users, and other fantasy platforms without a rebuild.

**Core Value Proposition:** Real-time, context-aware pick recommendations during a live draft — moving beyond static player rankings and ADP to provide real-time strategic intelligence based on the evolving draft, roster construction, player availability, and opponent behavior. It turns the live draft state into a clear, actionable decision at the exact moment the user needs it.

**Core Product Principle:**
The assistant should evolve from a rankings tool into a real-time draft strategist. It continuously answers four questions:

1. What is happening?
2. What does it mean for my roster?
3. What is likely to happen next?
4. What should I do right now?

**v1 Scope Boundary:** Draft-day tool only. Season-long features (waivers, trades) are deferred, but the underlying data model won't preclude them later.

## 2. Architecture Approach

One platform, not several. Sport and fantasy platform are two independent axes, and both should be handled by config/adapters rather than forking the codebase.

- **Sport Abstraction Layer:** A common interface (`Player`, `ScoringRule`, `RosterSlot`, `Position`, `CategoryStat`) that each sport implements differently.
  - Points-Based Sports (NFL/NHL): Evaluates baseline projection minus replacement level (VORP).
  - Category/Roto Sports (MLB/NBA): Evaluates standard deviations across categories (Z-Scores) and Standings Gain Points (SGP) to maintain roster category balance.
- **Platform Adapter Layer:** One adapter per fantasy platform (`SleeperAdapter`, `YahooAdapter`, `ESPNAdapter`), each implementing a common interface (`getLeagueSettings()`, `getDraftState()`, `getRosterSlots()`, `getAvailablePlayers()`, etc.). Adapters absorb each platform's quirks (auth, polling vs. websocket, data mapping).
  - Sleeper: Most open API, easiest reference implementation — build first.
  - ESPN: Unofficial/undocumented API, can break without warning.
  - Yahoo: Official API but requires OAuth, more setup friction.
  - `ManualAdapter`: A local-first fallback that implements the same interface as live adapters, driven by fast manual entry. Designed to prevent mid-draft catastrophes when live platform APIs lag, rate-limit, or drop connection during peak draft nights. Features high-contrast tap targets, quick category/tier grids, and an instant undo/edit-history bar for rapid recovery under time pressure.
- These two layers compose. The recommendation engine and UI never need to know which sport or platform they're running against.

**Scope Constraints for v1:**

- One active draft at a time — no concurrent multi-league tracking.
- Local-only storage for credentials/tokens and user data — no cloud/account system yet.
- Free/public data sources only.
- Mobile-first responsive design — clean execution on phone screens (with giant tap targets) and second-screen desktop setups alike.

### 2.1 Local-First State Management, Persistence & Proxy Strategy

To maintain a zero-cost, serverless v1 deployment while avoiding mid-draft data loss or API rate limits, the architecture uses a hardened local-first model paired with an optional lightweight local proxy.

**1. Browser Persistence Architecture (Zero Data-Loss Guarantee)**

- **Primary Storage (IndexedDB):** The engine persists full `DraftState` objects (player database, category Z-scores, pick histories, category matrices, opponent profiles) into IndexedDB. Async operations prevent main-thread UI lag during rapid 30-second draft clocks.
- **Lightweight Mirrors (localStorage):** Synchronous storage mirroring key draft settings (current pick, active adapter mode, slider weights, API auth tokens) to allow instant UI boot-up before hydration.
- **Auto-Save Loop:** Every pick event, slider change, or manual action triggers an immediate atomic write to IndexedDB.
- **Hot-Reload Recovery:** In the event of an accidental browser refresh, tab closure, or app crash, the state rehydrates in under 50ms, returning the manager directly to the active turn without requiring a full platform re-sync or lost data.

**2. CORS & API Rate-Limit Mitigation**

Client-side web applications making direct fetch calls to undocumented or official fantasy APIs (e.g., Yahoo, ESPN) face browser CORS restrictions and aggressive IP rate-limiting.

- Sleeper: Direct browser fetch allowed (CORS-enabled public REST API).
- ESPN & Yahoo: Handled via a zero-config, lightweight local proxy server script (e.g., Node.js/Express running on `localhost:3001`) or a CORS browser extension mode.
- **Graceful Failover:** If any adapter experiences 3 consecutive HTTP failures, rate-limit responses (HTTP 429), or socket timeouts, the app triggers an audio cue and seamlessly switches state input to the local `ManualAdapter` without disrupting current recommendation views.

### 2.2 Sync Latency & Browser Performance Protections

- **Adaptive Polling Intervals:**
  - Idle State (5+ picks away): Poll adapter every 5–10 seconds.
  - On Deck (2–4 picks away): Escalate polling to every 2 seconds.
  - On the Clock (Your turn): Escalate polling to 1-second interval or active socket connection.
- **Background Worker Persistence:** Uses Web Workers to prevent tab-throttling when minimized, ensuring live sync and audio alerts trigger reliably on the clock.
- **Fuzzy CSV Importer:** Integrated fuzzy header mapping (PapaParse + string distance matching) allowing instant copy-pasting of custom spreadsheet rankings without strict column formatting.
- **Pre-Bundled Data Hydration:** Player baseline rankings, static category projections, and ADP profiles are pre-packaged as compressed JSON files directly in the build bundle. Connected platform adapters merge live pick allocations onto the cached dataset.

## 3. Recommendation & Differentiating Intelligence Engine

**Underlying Engine Mechanics**

- **Points Formats (NFL/NHL):** Value = ADP − rank (positive = "steal", negative = "reach"). Dynamic replacement values update as players leave the board.
- **Category & Roto Formats (MLB/NBA):** Calculates category Z-scores (`Z = (x - μ) / σ`) normalized against replacement level. Tracks cumulative team totals to maintain roster category balance.
- **Punt Strategy Support:** Supports `punt_categories[]` in config to zero out specific weights (e.g., ignoring FT% in NBA or Saves in MLB).
- **BPA vs. Need Control:** Final recommendation uses a weighted blend of value and need. In Phase 1 this weight is not a live slider — it's derived from a named strategy chosen once at League Setup (see Customization Model below), so each recommendation's reasoning stays tied to a strategy the user explicitly picked rather than an in-the-moment drag.

**Differentiating Intelligence Modules**

- **Live Draft Intelligence:**
  - Draft Capital Efficiency: Measures how effectively each manager converts draft picks into value relative to ADP, projections, and expected draft position.
  - Player Survival Probability: Estimates the probability that a target player will still be available at the user's next pick — and subsequent picks. *(A first, lightweight version of this shipped in Phase 1 as "Anticipated Next Rounds" — see Core Drafting Workspace — using an ADP-based opponent simulation rather than full Manager DNA modeling.)*
  - Cost of Waiting: Quantifies the opportunity cost of passing on a player now versus waiting one or more rounds.
  - Tier Cliff Radar: Identifies upcoming drop-offs in player value and warns when the current pick may be the last opportunity to acquire a player from a particular tier.
  - Draft Momentum: Detects when the current draft deviates from historical ADP patterns, such as unusually aggressive RB, WR, QB, or TE drafting.
- **League & Opponent Intelligence:**
  - Manager DNA: Builds a live profile of each manager's drafting tendencies, including positional preferences, reach tendencies, stacking behavior, risk tolerance, and historical patterns within the draft.
  - Invisible Demand: Accounts for which teams actually need a position — not simply how many teams are picking before the user.
  - Opponent Blocking: Identifies opportunities where selecting a player both improves the user's roster and prevents a competitor from obtaining a particularly valuable target.
  - Bait / False Run Detection: Distinguishes between genuine positional scarcity and situations where managers may be overreacting to a temporary positional run.
  - Panic / Run Detection: Recognizes when a positional run is genuinely dangerous and communicates whether the user should react or stay disciplined.
- **Roster Construction Intelligence:**
  - Roster-Aware Recommendations: Evaluates the user's entire roster, league settings, positional requirements, remaining picks, and available player pool — not simply static player rankings.
  - Archetype Coverage: Tracks the types of players the roster contains and lacks (e.g., high-floor WR, explosive WR, pass-catching RB, upside bench player) rather than tracking positions alone.
  - Dead Roster Spot Detection: Identifies when another player at a position provides diminishing marginal value and recommends using the roster spot for a different type of upside.
  - Plan vs. Reality: Compares the user's current roster against their intended draft strategy and identifies when they are drifting from the plan. Distinguishes between unnecessary deviation and a deviation that is actually +EV given how the draft is unfolding.
- **Decision Support:**
  - Trap Value Detection: Identifies players who appear to be ADP/ranking bargains but may not actually represent good picks because of roster fit, positional depth, opportunity cost, or league demand.
  - Counterfactual Drafting: Models multiple plausible draft outcomes based on the user's potential pick and shows how each decision changes their subsequent options.
  - Opponent-Aware Pick Recommendations: Evaluates who is likely to be available later, who is likely to disappear, which player creates the best overall roster, and which player changes the options of competing managers.
  - Regret-Aware Recommendations: Allows recommendations to account for risk tolerance — including a "minimize regret" style of drafting for users who prefer safer outcomes.

**Customization Model**

Implemented in Phase 1 as a named strategy, chosen once during League Setup:

- **Best Player Available:** Always take the highest-value player left on the board.
- **Fill a Need:** Always prioritize filling the emptiest roster slots.
- **Balanced:** Equal weight between Best Player Available and Fill a Need.
- **Best Player Available, then Fill a Need after 80% rostered:** Best player available until 80% of the roster is filled, then draft for need among the best players remaining.

"Also Consider" on the draft board shows what each of the other three strategies would suggest right now, as a built-in cross-check — a lower-effort alternative to a live slider.

Deferred: Advanced Mode (full custom rules/scripting, e.g., "if a QB run happens, boost remaining elite QBs by X") and Import a Template (pasting in published expert rankings/ECR) remain future extensions of this model.

## 4. League Setup / Onboarding

Phase 1 ships this as a single "League Rules & Personal Strategy" page:

- League Rules Input: Number of teams and roster slot counts (QB/RB/WR/TE/FLEX/K/DST/BENCH). Scoring is points-based only in Phase 1 — category/roto toggles, bench-size-as-a-separate-setting, keeper rules, and scoring multipliers (Superflex, TE Premium, PPR, etc.) remain future work.
- Category Config (MLB/NBA): Deferred until category/roto scoring and non-NFL sports are built.
- Draft Settings: **Type of draft — Snake or Linear** (Auction is deferred; see Scope Constraints). Draft order is captured directly as an ordered list of team names, plus which position in that order is the user's own — this doubles as "pick order" and "the user's order in the draft."
- Platform Selection: Manual entry only in Phase 1 (`ManualAdapter`) — the "option to input names of the other teams/managers" is what a live Sleeper/Yahoo/ESPN adapter would eventually populate automatically instead of by hand.
- Strategy Setup: Select one of the four named strategies from the Customization Model above as the league's default. Risk-tolerance framing ("Maximize Expected Value" vs. "Minimize Regret") and per-pick time limits remain future work.

## 5. Live Draft Real-Time Experience & UI

The draft screen is designed for high-stress, low-latency decision-making — critical data is visible without navigating away mid-turn.

**Top-Level Status & Real-Time Context**

- League Header & Pick Timeline: Scoring format summary, team count, live pick feed status, running pick totals, and exact pick turn/distance intervals.
- "The One Thing" Banner: A persistent, highly visible banner answering: *What is the single most important thing I should know right now?*
  - Examples: "Wait on QB." | "RB tier cliff approaching." | "Team 7 is likely to take your target." | "Don't chase this WR run." | "This is probably your last chance at this RB tier."
- Clock Intelligence Adaptation: Uses remaining draft time to determine how aggressively the assistant guides the user:
  - Plenty of time: Explain options and trade-offs in detail.
  - Moderate time: Narrow the field to top contenders.
  - Time pressure: Provide a single, decisive recommendation.
- Panic Mode Toggle: A persistent top-corner toggle that strips away dense tables and charts during fast 30-second clocks, transforming the display into a low-friction card with the Top 3 Recommendations, giant tap targets, and a pick countdown.

**Predictive & Strategic Overlay**

- Draft Story Narrative: Concise narrative explaining what is happening in the draft and why it matters (e.g., "The league started WR-heavy, so RB value is falling. Three teams are now approaching RB scarcity, making a run likely. You have an opportunity to take advantage before that happens.").
- "Likely Still There" & Survival Radar: Projects player availability at future picks based on ADP, positional runs, and opponent Manager DNA. *(Phase 1 ships the ADP-only slice of this as "Anticipated Next Rounds"; positional-run and Manager DNA awareness are future work.)*
- Snag / Steal Risk Radar: Evaluates teams drafting between your turns and highlights targets with a red "High Snag Risk" flag if an upcoming opponent has an obvious roster hole.
- Run & Tier Alerts: Priority alerts for positional runs, tier endings, and bait/false run warnings.

**Core Drafting Workspace** *(as implemented in Phase 1, redesigned in Phase 4)*

- **My Team:** Live pill row showing filled/total roster slots. Each pill expands on tap (not hover, since this is a mobile-first app) to list the players currently occupying that slot. Archetype coverage and category contribution meters remain future work, tracked under Roster Construction Intelligence above.
- **Your Draft:** A full round-by-round view of every pick the user has made or will make (not just the next few), the round they're currently on the clock for, an auto-generated per-round plan tag (e.g. "Upside RB / WR") derived from projected roster need at that point in the simulated draft, and a "likely still there at your pick #N" shortlist — several plausible survivors at one specific future pick, superseding the single best-guess-per-round "Anticipated Next Rounds" forecast from Phase 1. Still the same underlying simplifying assumption as before (opponents draft by best-ADP-available; see the Survival Radar note above) — just applied more broadly.
- **Pick Next:** The pure best-player-available pick, independent of the active strategy, plus a short "then" preview of the next few names by ranking — a quick "if I ignore roster need entirely" cross-check.
- **Strategy:** Names the active strategy, shows its single top suggestion (roster/round-aware) with plain-language reasoning.
- **Also Consider:** Shows what each of the other three named strategies would suggest right now, as a quick cross-check — replaces the originally-envisioned live BPA/Need slider.
- **Available Players:** Sortable/filterable table. Each player shows a colored position badge with a static position rank (e.g. "WR2"), a computed tier, overall rank, ADP, projected points, VBD value, and an Availability column (ADP relative to the user's next pick). Sorting is available by any of these. A favorite/target star is cosmetic only and does not influence recommendations, and an "★ Targets" filter narrows the table to favorited players. Drafted players stay visible in the table (greyed out, tagged with who drafted them) instead of disappearing, so the table doubles as a draft-history view; an "Available only" filter hides them when that's not wanted. Each still-available row has two actions — draft to the user's own team, or mark drafted by a specific opponent team by name — this manual attribution is exactly what a live platform adapter (Sleeper, etc.) would take over once built. Visual Tier Break Lines remain a future refinement.
- **All Rosters view:** A separate tab showing every team's roster in the same expandable-pill format as My Team, using the draft order and team names captured at League Setup.

Not yet built: multi-source rank blending (combining several published ranking sets into one score, rather than ESPN alone — deferred out of the Phase 4 redesign; see the note in the README roadmap), "The One Thing" banner, Clock Intelligence Adaptation, Panic Mode Toggle, Draft Story Narrative, Snag/Steal Risk Radar, and Run & Tier Alerts — these remain part of the fuller vision described earlier in this section.

**Auction-Specific Controls (If Auction Format)**

Deferred — Auction is not yet a selectable draft type in Phase 1 (see League Setup / Onboarding).

- Max Bid Calculator: Real-time formula display (`Remaining Budget - Open Slots + 1`) ensuring hard cap awareness.
- Inflation/Deflation Tracker: Displays whether top tiers are selling above or below baseline projections.

## 6. Data Model Sketch

### Implemented (Phase 1)

```typescript
type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST'; // NFL only so far

interface Player {
  id: string;
  name: string;
  position: Position[]; // shape supports multi-position eligibility; NFL players use one today
  team: string;
  sport: 'NFL'; // widens to 'MLB' | 'NBA' | 'NHL' once other sports are added
  bye_week?: number;
  adp: number;
  rank: number; // static overall rank
  projected_points: number;
}
// Position rank (the "2" in "WR2") and tier are NOT stored on Player — they're computed
// once from the full player pool (computePositionRanks / computeTiers) and looked up by id,
// the same way adp/rank are treated as static, preseason-style values.

type DraftType = 'snake' | 'linear'; // auction deferred

interface RosterSlot {
  position: Position | 'FLEX' | 'BENCH';
  count: number;
  filled: number;
}

interface LeagueSettings {
  teamCount: number;
  rosterSlots: RosterSlot[];
  scoring: { type: 'points' }; // categories/roto deferred
  draftType: DraftType;
  draftOrder: string[]; // team ids in round-1 pick order
  teamNames: Record<string, string>;
}

// Supersedes the FormulaConfig.bpa_vs_need_weight slider sketched below — chosen once at
// League Setup rather than dragged live during the draft.
type DraftStrategy = 'bpa' | 'need' | 'balanced' | 'bpa_then_need_80';

interface Pick {
  pickNumber: number;
  player: Player;
  teamId: string;
}

interface DraftState {
  leagueSettings: LeagueSettings;
  picksMade: Pick[];
  availablePlayers: Player[];
  currentPick: number;
  userTeamId: string;
  userRoster: Player[];
  opponentRosters: Record<string, Player[]>;
  strategy: DraftStrategy;
  favoritedPlayerIds: string[]; // cosmetic "target" flag — not fed into recommendations
}
```

### Future (not yet implemented)

```typescript
interface ManagerProfile {
  manager_id: string;
  positional_bias: Record<string, number>; // Tendency to reach for specific positions
  risk_tolerance: 'safe' | 'balanced' | 'chasing_upside';
  stacking_behavior: boolean;
  reach_frequency: number;
}

interface ScoringRule {
  type: 'points' | 'categories' | 'roto';
  point_weights?: Record<string, number>;
  active_categories?: string[];
}

interface FormulaConfig {
  mode: 'weights' | 'rules';
  risk_mode: 'maximize_ev' | 'minimize_regret';
  punt_categories?: string[];
  tier_scarcity_multiplier: number;
  rules?: RuleScript[];
}

// Fields DraftState will grow into without breaking its current shape:
//   remaining_seconds, opponent_profiles: Record<string, ManagerProfile>, is_connected,
//   category_z_scores, archetypes on Player
```
