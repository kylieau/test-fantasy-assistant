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
- **BPA vs. Need Control:** Final recommendation uses a weighted blend of value and need, controlled by a user-adjustable live slider between "Best Player Available" and "Fill a Need".

**Differentiating Intelligence Modules**

- **Live Draft Intelligence:**
  - Draft Capital Efficiency: Measures how effectively each manager converts draft picks into value relative to ADP, projections, and expected draft position.
  - Player Survival Probability: Estimates the probability that a target player will still be available at the user's next pick — and subsequent picks.
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

- Simple Mode: Weighted combination of built-in factors (value, scarcity, tier breaks, ADP, custom composite rankings).
- Advanced Mode: Full custom rules/scripting (if-this-then-that logic, e.g., "if a QB run happens, boost remaining elite QBs by X").
- Import a Template: Users can import/paste published expert rankings or strategy sheets (ECR) as a starting point.

## 4. League Setup / Onboarding

- League Rules Input: Scoring format (points vs. categories/roto), roster slots, bench size, keeper rules, league-specific scoring multipliers (Superflex, TE Premium, PPR, Points Per Boot).
- Category Config (MLB/NBA): Category toggles (5x5, 6x6, points-based), and optional Punt Category selection.
- Draft Settings: Snake vs. auction, pick order, time per pick.
- Platform Selection: Adapter connection choice (Sleeper, Yahoo, ESPN, or Manual).
- Strategy & Risk Setup: Default weights, imported rankings template, custom rule overrides, and risk tolerance setting ("Maximize Expected Value" vs. "Minimize Regret").

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
- "Likely Still There" & Survival Radar: Projects player availability at future picks based on ADP, positional runs, and opponent Manager DNA.
- Snag / Steal Risk Radar: Evaluates teams drafting between your turns and highlights targets with a red "High Snag Risk" flag if an upcoming opponent has an obvious roster hole.
- Run & Tier Alerts: Priority alerts for positional runs, tier endings, and bait/false run warnings.

**Core Drafting Workspace**

- Roster Needs & Archetype Matrix: Live pill row showing filled/total roster slots, archetype coverage (e.g., high-floor WR, pass-catching RB), and category contribution meters.
- Pick Recommendation Panel:
  - Single top suggestion (slot, ADP, computed value, survival odds).
  - Side-by-side "Best Value" vs. "Fill a Need" options with live slider control.
  - Stacking flags, Bye-Week warnings, and Opponent Blocking opportunities.
  - Plain-language reasoning and "Trap Value" warnings.
- Full Player Table & Manual Board: Sortable/filterable table with visual Tier Break Lines, Watchlist toggles, and 1-tap Manual Quick-Board fallback.

**Auction-Specific Controls (If Auction Format)**

- Max Bid Calculator: Real-time formula display (`Remaining Budget - Open Slots + 1`) ensuring hard cap awareness.
- Inflation/Deflation Tracker: Displays whether top tiers are selling above or below baseline projections.

## 6. Data Model Sketch

```typescript
interface Player {
  id: string;
  name: string;
  position: string[]; // Supports multi-position eligibility (MLB/NBA)
  team: string;
  sport: 'NFL' | 'MLB' | 'NBA' | 'NHL';
  bye_week?: number;
  adp: number;
  rank: number;
  tiers: number[];
  archetypes: string[]; // e.g., ['high_floor_wr', 'pass_catching_rb']

  // Scoring Data
  projected_points?: number; // Used for Points formats (NFL/NHL)
  category_projections?: Record<string, number>; // e.g., { HR: 35, SB: 12, AVG: 0.275 }
  category_z_scores?: Record<string, number>; // Calculated standard deviations
}

interface ManagerProfile {
  manager_id: string;
  positional_bias: Record<string, number>; // Tendency to reach for specific positions
  risk_tolerance: 'safe' | 'balanced' | 'chasing_upside';
  stacking_behavior: boolean;
  reach_frequency: number;
}

interface RosterSlot {
  position: string;
  count: number;
  filled: number;
}

interface ScoringRule {
  type: 'points' | 'categories' | 'roto';
  point_weights?: Record<string, number>;
  active_categories?: string[];
}

interface FormulaConfig {
  mode: 'weights' | 'rules';
  bpa_vs_need_weight: number; // 0.0 (BPA) to 1.0 (Need) live slider
  risk_mode: 'maximize_ev' | 'minimize_regret';
  punt_categories?: string[];
  tier_scarcity_multiplier: number;
  rules?: RuleScript[];
}

interface DraftState {
  picks_made: Pick[];
  available_players: Player[];
  current_pick: number;
  remaining_seconds: number;
  user_roster: Player[];
  opponent_rosters: Record<string, Player[]>;
  opponent_profiles: Record<string, ManagerProfile>;
  is_connected: boolean; // Tracks adapter connection state for auto-fallback
}
```
