#!/usr/bin/env node
// One-off script (not part of the app runtime/build) that generates fully placeholder
// NFL player data for Phase 1 development and demoing. Names, teams-as-scoring-context,
// projections, ADP, and byes here are NOT real 2026 data — see the README note in this
// directory. Run with: node src/data/seed/generate-seed.mjs > src/data/seed/nfl-players-2026-placeholder.json

// Deterministic PRNG (mulberry32) so the generated file is reproducible.
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(20260902);
const randRange = (min, max) => min + random() * (max - min);
const pick = (arr) => arr[Math.floor(random() * arr.length)];

const TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
  'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC', 'LAR', 'LV', 'MIA',
  'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB',
  'TEN', 'WAS',
];
// One bye week per team, spread across the season, for placeholder consistency.
const TEAM_BYE_WEEKS = Object.fromEntries(
  TEAMS.map((team, i) => [team, 5 + (i % 10)]),
);

const FIRST_NAMES = [
  'Marcus', 'Jalen', 'DeShawn', 'Tyler', 'Cameron', 'Xavier', 'Trevon', 'Bryce',
  'Isaiah', 'Malik', 'Devon', 'Jordan', 'Elijah', 'Cooper', 'Nathaniel', 'Rashad',
  'Grant', 'Terrence', 'Micah', 'Blake', 'Andre', 'Kendall', 'Reggie', 'Austin',
  'Dominic', 'Julian', 'Karim', 'Logan', 'Preston', 'Vincent',
];
const LAST_NAMES = [
  'Carter', 'Whitfield', 'Osei', 'Brennan', 'Delgado', 'Higgins', 'Okafor', 'Mercer',
  'Falcone', 'Winslow', 'Barrera', 'Kowalski', 'Thibodeaux', 'Reyes', 'Sanborn', 'Odom',
  'Vance', 'Castellano', 'Nakamura', 'Ellsworth', 'Pruitt', 'Adeyemi', 'Halloran', 'Marsh',
  'Quintana', 'Broussard', 'Iverson', 'Callahan', 'Duarte', 'Whitmore',
];

function uniqueName(used) {
  let name;
  do {
    name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  } while (used.has(name));
  used.add(name);
  return name;
}

// Position config: how many players, the top-of-position points ceiling, and how quickly
// value decays down the depth chart. Tuned only to produce a plausible-looking, smoothly
// tiered curve with visible cliffs — not real projections.
const POSITION_CONFIG = [
  { position: 'QB', count: 36, topPoints: 340, decay: 0.028, noise: 6 },
  { position: 'RB', count: 78, topPoints: 310, decay: 0.032, noise: 8 },
  { position: 'WR', count: 88, topPoints: 300, decay: 0.026, noise: 8 },
  { position: 'TE', count: 34, topPoints: 220, decay: 0.045, noise: 6 },
  { position: 'K', count: 20, topPoints: 150, decay: 0.02, noise: 4 },
  { position: 'DST', count: 20, topPoints: 140, decay: 0.02, noise: 4 },
];

// Real-world re-draft boards weight positions unevenly relative to raw points (e.g. an
// elite RB is drafted far earlier than a QB scoring more raw points). This multiplier
// approximates that when building one overall board ordering.
const POSITION_RANK_WEIGHT = { RB: 1.15, WR: 1.1, TE: 0.9, QB: 0.85, K: 0.4, DST: 0.4 };

const usedNames = new Set();
const players = [];

for (const { position, count, topPoints, decay, noise } of POSITION_CONFIG) {
  for (let i = 0; i < count; i++) {
    const curve = topPoints * Math.exp(-decay * i);
    const projected_points = Math.round((curve + randRange(-noise, noise)) * 10) / 10;
    const team = pick(TEAMS);
    players.push({
      name: uniqueName(usedNames),
      position: [position],
      team,
      sport: 'NFL',
      bye_week: TEAM_BYE_WEEKS[team],
      projected_points,
      _rankWeight: projected_points * POSITION_RANK_WEIGHT[position],
    });
  }
}

players.sort((a, b) => b._rankWeight - a._rankWeight);

const total = players.length;
players.forEach((player, i) => {
  const rank = i + 1;
  // ADP mostly tracks rank but jitters, so steal/reach math has something to find.
  const adp = Math.min(total, Math.max(1, Math.round(rank + randRange(-15, 15))));
  player.id = `p${String(rank).padStart(3, '0')}`;
  player.rank = rank;
  player.adp = adp;
  delete player._rankWeight;
});

// Re-key each object so field order is stable/readable in the committed JSON.
const ordered = players.map(({ id, name, position, team, sport, bye_week, adp, rank, projected_points }) => ({
  id, name, position, team, sport, bye_week, adp, rank, projected_points,
}));

process.stdout.write(JSON.stringify(ordered, null, 2) + '\n');
