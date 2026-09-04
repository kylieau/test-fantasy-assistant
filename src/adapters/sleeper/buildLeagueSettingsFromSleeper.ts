import type { DraftType, LeagueSettings, RosterSlot } from '../../domain/roster';
import type { SleeperDraft, SleeperLeagueRoster, SleeperLeagueUser } from './sleeperTypes';

export class UnsupportedDraftTypeError extends Error {
  constructor(type: string) {
    super(`Sleeper draft type "${type}" isn't supported yet — only snake and linear drafts are.`);
    this.name = 'UnsupportedDraftTypeError';
  }
}

export class ViewerNotInDraftError extends Error {
  constructor() {
    super("That Sleeper username doesn't own a roster in this league.");
    this.name = 'ViewerNotInDraftError';
  }
}

const SLOT_POSITION_MAP: { settingsKey: string; position: RosterSlot['position'] }[] = [
  { settingsKey: 'slots_qb', position: 'QB' },
  { settingsKey: 'slots_rb', position: 'RB' },
  { settingsKey: 'slots_wr', position: 'WR' },
  { settingsKey: 'slots_te', position: 'TE' },
  { settingsKey: 'slots_flex', position: 'FLEX' },
  { settingsKey: 'slots_k', position: 'K' },
  { settingsKey: 'slots_def', position: 'DST' },
  { settingsKey: 'slots_bn', position: 'BENCH' },
];

/** Slot types Sleeper supports that we don't track yet — dropped with a warning, not a crash. */
const KNOWN_UNSUPPORTED_SLOT_KEYS = ['slots_super_flex', 'slots_idp_flex', 'slots_dl', 'slots_lb', 'slots_db'];

function teamIdForRosterId(rosterId: number | string): string {
  return `sleeper-roster-${rosterId}`;
}

export interface SleeperLeagueSetupResult {
  leagueSettings: LeagueSettings;
  userTeamId: string;
}

/**
 * Pure mapping from raw Sleeper draft/league payloads to our LeagueSettings + which internal
 * team id belongs to the viewer. Throws typed errors for the two ways this can't proceed:
 * an unsupported draft type (auction), or a viewer user_id that isn't in this draft at all.
 */
export function buildLeagueSettingsFromSleeper(
  draft: SleeperDraft,
  leagueUsers: SleeperLeagueUser[],
  leagueRosters: SleeperLeagueRoster[],
  viewerUserId: string,
): SleeperLeagueSetupResult {
  if (draft.type !== 'snake' && draft.type !== 'linear') {
    throw new UnsupportedDraftTypeError(draft.type);
  }
  const draftType: DraftType = draft.type;

  const settings = draft.settings;
  const rosterSlots: RosterSlot[] = SLOT_POSITION_MAP.map(({ settingsKey, position }) => ({
    position,
    count: settings[settingsKey] ?? 0,
    filled: 0,
  })).filter((slot) => slot.count > 0);

  for (const key of KNOWN_UNSUPPORTED_SLOT_KEYS) {
    if ((settings[key] ?? 0) > 0) {
      console.warn(`Sleeper draft uses "${key}" slots, which this app doesn't track yet — they'll be ignored.`);
    }
  }

  const slotToRosterId = draft.slot_to_roster_id ?? {};
  const teamCount = settings.teams;

  const draftOrder = Array.from({ length: teamCount }, (_, i) => {
    const slot = i + 1;
    const rosterId = slotToRosterId[String(slot)];
    return rosterId !== undefined ? teamIdForRosterId(rosterId) : `sleeper-slot-${slot}`;
  });

  // Resolved via league rosters' owner_id rather than draft.draft_order (user_id -> slot):
  // draft_order is null until the commissioner actually starts the draft, but roster
  // ownership exists from the moment the league is created — this works both before and
  // during the draft.
  const viewerRoster = leagueRosters.find((r) => r.owner_id === viewerUserId);
  if (!viewerRoster) {
    throw new ViewerNotInDraftError();
  }
  const userTeamId = teamIdForRosterId(viewerRoster.roster_id);

  const displayNameByUserId = new Map(leagueUsers.map((u) => [u.user_id, u.display_name]));
  const teamNames: Record<string, string> = {};
  for (const roster of leagueRosters) {
    const teamId = teamIdForRosterId(roster.roster_id);
    const ownerName = roster.owner_id ? displayNameByUserId.get(roster.owner_id) : undefined;
    teamNames[teamId] = teamId === userTeamId ? 'Me' : (ownerName ?? `Team ${roster.roster_id}`);
  }
  // Any drafted slot without a matching league roster (rare) still gets a readable fallback.
  for (const teamId of draftOrder) {
    if (!(teamId in teamNames)) {
      teamNames[teamId] = teamId === userTeamId ? 'Me' : teamId;
    }
  }

  const leagueSettings: LeagueSettings = {
    teamCount,
    rosterSlots,
    scoring: { type: 'points' },
    draftType,
    draftOrder,
    teamNames,
    // Set by connectToSleeperDraft once it knows whether the ESPN projections merge worked.
    hasProjections: false,
    platform: 'sleeper',
  };

  return { leagueSettings, userTeamId };
}
