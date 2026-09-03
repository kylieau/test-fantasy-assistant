import type { DraftState, Pick } from '../domain/draft';
import type { LeagueSettings } from '../domain/roster';
import type { Player } from '../domain/player';
import { DEFAULT_BPA_VS_NEED_WEIGHT } from '../engine/recommend';

export type DraftAction =
  | { type: 'INIT_LEAGUE'; leagueSettings: LeagueSettings; availablePlayers: Player[]; userTeamId: string }
  | { type: 'DRAFT_PLAYER'; playerId: string; teamId: string }
  | { type: 'UNDO' }
  | { type: 'SET_WEIGHT'; weight: number };

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'INIT_LEAGUE': {
      return {
        leagueSettings: action.leagueSettings,
        picksMade: [],
        availablePlayers: action.availablePlayers,
        currentPick: 1,
        userTeamId: action.userTeamId,
        userRoster: [],
        opponentRosters: {},
        bpaVsNeedWeight: state.bpaVsNeedWeight ?? DEFAULT_BPA_VS_NEED_WEIGHT,
      };
    }

    case 'DRAFT_PLAYER': {
      const player = state.availablePlayers.find((p) => p.id === action.playerId);
      if (!player) return state;

      const pick: Pick = { pickNumber: state.currentPick, player, teamId: action.teamId };
      const availablePlayers = state.availablePlayers.filter((p) => p.id !== action.playerId);

      const isUser = action.teamId === state.userTeamId;
      return {
        ...state,
        picksMade: [...state.picksMade, pick],
        availablePlayers,
        currentPick: state.currentPick + 1,
        userRoster: isUser ? [...state.userRoster, player] : state.userRoster,
        opponentRosters: isUser
          ? state.opponentRosters
          : {
              ...state.opponentRosters,
              [action.teamId]: [...(state.opponentRosters[action.teamId] ?? []), player],
            },
      };
    }

    case 'UNDO': {
      const lastPick = state.picksMade[state.picksMade.length - 1];
      if (!lastPick) return state;

      const isUser = lastPick.teamId === state.userTeamId;
      const opponentRosters = { ...state.opponentRosters };
      if (!isUser) {
        const remaining = (opponentRosters[lastPick.teamId] ?? []).filter(
          (p) => p.id !== lastPick.player.id,
        );
        if (remaining.length > 0) {
          opponentRosters[lastPick.teamId] = remaining;
        } else {
          delete opponentRosters[lastPick.teamId];
        }
      }

      return {
        ...state,
        picksMade: state.picksMade.slice(0, -1),
        availablePlayers: [...state.availablePlayers, lastPick.player],
        currentPick: state.currentPick - 1,
        userRoster: isUser
          ? state.userRoster.filter((p) => p.id !== lastPick.player.id)
          : state.userRoster,
        opponentRosters,
      };
    }

    case 'SET_WEIGHT': {
      return { ...state, bpaVsNeedWeight: action.weight };
    }

    default:
      return state;
  }
}
