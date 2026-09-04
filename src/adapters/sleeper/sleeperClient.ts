import type { SleeperDraft, SleeperLeagueRoster, SleeperLeagueUser, SleeperPick, SleeperPlayer, SleeperUser } from './sleeperTypes';

const BASE_URL = 'https://api.sleeper.app/v1';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Sleeper API request failed (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
}

export function getUser(username: string): Promise<SleeperUser> {
  return getJson<SleeperUser>(`/user/${encodeURIComponent(username)}`);
}

export function getDraft(draftId: string): Promise<SleeperDraft> {
  return getJson<SleeperDraft>(`/draft/${encodeURIComponent(draftId)}`);
}

export function getDraftPicks(draftId: string): Promise<SleeperPick[]> {
  return getJson<SleeperPick[]>(`/draft/${encodeURIComponent(draftId)}/picks`);
}

export function getLeagueUsers(leagueId: string): Promise<SleeperLeagueUser[]> {
  return getJson<SleeperLeagueUser[]>(`/league/${encodeURIComponent(leagueId)}/users`);
}

export function getLeagueRosters(leagueId: string): Promise<SleeperLeagueRoster[]> {
  return getJson<SleeperLeagueRoster[]>(`/league/${encodeURIComponent(leagueId)}/rosters`);
}

// The full player list is ~14MB and changes rarely — fetch it once per session and cache
// in memory rather than re-fetching on every poll.
let playersCache: Promise<Record<string, SleeperPlayer>> | null = null;

export function getPlayers(): Promise<Record<string, SleeperPlayer>> {
  if (!playersCache) {
    playersCache = getJson<Record<string, SleeperPlayer>>('/players/nfl');
  }
  return playersCache;
}
