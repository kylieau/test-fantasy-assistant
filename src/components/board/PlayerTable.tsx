import { useMemo, useState } from 'react';
import type { Recommendation } from '../../engine/types';
import type { Position } from '../../domain/player';
import { labelAdpDelta } from '../../engine/value';
import { availabilityMargin, availabilityProbability } from '../../engine/projection';
import { POSITION_COLORS } from '../positionColors';
import { PlayerActions, type TeamOption } from '../PlayerActions';

type SortKey = 'rank' | 'adp' | 'projected_points' | 'value' | 'positionRank' | 'tier' | 'availability';

const ALL_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

export function PlayerTable({
  recommendations,
  positionRanks,
  tiers,
  favoritedPlayerIds,
  nextUserPickNumber,
  teams,
  onDraftToMyTeam,
  onMarkDraftedByTeam,
  onToggleFavorite,
  showValueColumns,
  showActions,
}: {
  recommendations: Recommendation[];
  positionRanks: Record<string, number>;
  tiers: Record<string, number>;
  favoritedPlayerIds: string[];
  nextUserPickNumber: number | null;
  teams: TeamOption[];
  onDraftToMyTeam: (playerId: string) => void;
  onMarkDraftedByTeam: (playerId: string, teamId: string) => void;
  onToggleFavorite: (playerId: string) => void;
  /** No usable projections/ADP (e.g. a live Sleeper draft with no ESPN match) — just name/pos/team/bye. */
  showValueColumns: boolean;
  /** Whether this app is authoritative for drafting (Manual) vs. just advising (Sleeper stays
   * the system of record — the user executes the pick over there, not here). */
  showActions: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedPositions, setSelectedPositions] = useState<Set<Position>>(() => new Set());
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [targetsOnly, setTargetsOnly] = useState(false);

  const favoritedSet = useMemo(() => new Set(favoritedPlayerIds), [favoritedPlayerIds]);

  const rows = useMemo(() => {
    let filtered = recommendations;
    if (selectedPositions.size > 0) {
      filtered = filtered.filter((r) => r.player.position.some((pos) => selectedPositions.has(pos)));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => r.player.name.toLowerCase().includes(q));
    }
    if (availableOnly) {
      filtered = filtered.filter((r) => !r.draftedBy);
    }
    if (targetsOnly) {
      filtered = filtered.filter((r) => favoritedSet.has(r.player.id));
    }

    function sortValue(r: Recommendation): number {
      switch (sortKey) {
        case 'value':
          return r.value;
        case 'positionRank':
          return positionRanks[r.player.id] ?? Number.MAX_SAFE_INTEGER;
        case 'tier':
          return tiers[r.player.id] ?? Number.MAX_SAFE_INTEGER;
        case 'availability':
          return nextUserPickNumber !== null ? availabilityMargin(r.player, nextUserPickNumber) : 0;
        default:
          return r.player[sortKey];
      }
    }

    return [...filtered].sort((a, b) => (sortAsc ? sortValue(a) - sortValue(b) : sortValue(b) - sortValue(a)));
  }, [
    recommendations,
    selectedPositions,
    search,
    availableOnly,
    targetsOnly,
    favoritedSet,
    sortKey,
    sortAsc,
    positionRanks,
    tiers,
    nextUserPickNumber,
  ]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((asc) => !asc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function togglePosition(pos: Position) {
    setSelectedPositions((prev) => {
      const next = new Set(prev);
      if (next.has(pos)) {
        next.delete(pos);
      } else {
        next.add(pos);
      }
      return next;
    });
  }

  return (
    <section className="player-table">
      <h2>Available Players</h2>
      <div className="player-table__controls">
        <div className="player-table__filters-row">
          <input
            type="search"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="player-table__checkbox">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            Available only
          </label>
          <label className="player-table__checkbox">
            <input type="checkbox" checked={targetsOnly} onChange={(e) => setTargetsOnly(e.target.checked)} />
            ★ Targets
          </label>
        </div>

        <div className="player-table__position-filter">
          <button
            type="button"
            className={`position-toggle ${selectedPositions.size === 0 ? 'position-toggle--active' : ''}`}
            onClick={() => setSelectedPositions(new Set())}
          >
            All
          </button>
          {ALL_POSITIONS.map((pos) => {
            const isActive = selectedPositions.has(pos);
            return (
              <button
                key={pos}
                type="button"
                className={`position-toggle ${isActive ? 'position-toggle--active' : ''}`}
                style={isActive ? { backgroundColor: POSITION_COLORS[pos], borderColor: POSITION_COLORS[pos] } : undefined}
                onClick={() => togglePosition(pos)}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      <div className="player-table__scroll">
        <table>
          <thead>
            <tr>
              <th>★</th>
              <th>Name</th>
              <th>Pos</th>
              <th>Team</th>
              <th>Bye</th>
              {showValueColumns && (
                <>
                  <th onClick={() => toggleSort('rank')}>Overall</th>
                  <th onClick={() => toggleSort('positionRank')}>Pos Rank</th>
                  <th onClick={() => toggleSort('tier')}>Tier</th>
                  <th onClick={() => toggleSort('adp')}>ADP</th>
                  <th onClick={() => toggleSort('projected_points')}>Proj Pts</th>
                  <th onClick={() => toggleSort('value')}>Value</th>
                  <th onClick={() => toggleSort('availability')}>Availability</th>
                </>
              )}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rec) => {
              const { player } = rec;
              const label = labelAdpDelta(rec.adpDelta);
              const probability =
                nextUserPickNumber !== null ? availabilityProbability(player, nextUserPickNumber) : null;
              const isFavorited = favoritedSet.has(player.id);

              return (
                <tr key={player.id} className={rec.draftedBy ? 'player-table__row--drafted' : undefined}>
                  <td>
                    <button
                      type="button"
                      className={`favorite-star ${isFavorited ? 'favorite-star--active' : ''}`}
                      onClick={() => onToggleFavorite(player.id)}
                      aria-label={isFavorited ? 'Remove favorite' : 'Favorite this player'}
                      title={isFavorited ? 'Remove favorite' : 'Favorite this player'}
                    >
                      {isFavorited ? '★' : '☆'}
                    </button>
                  </td>
                  <td>{player.name}</td>
                  <td>
                    <span
                      className="position-badge"
                      style={{ backgroundColor: POSITION_COLORS[player.position[0]] }}
                    >
                      {player.position[0]}
                      {positionRanks[player.id] ?? ''}
                    </span>
                  </td>
                  <td>{player.team}</td>
                  <td>{player.bye_week ?? '—'}</td>
                  {showValueColumns && (
                    <>
                      <td>{player.rank}</td>
                      <td>{positionRanks[player.id] ?? '—'}</td>
                      <td>{tiers[player.id] ?? '—'}</td>
                      <td className={label !== 'neutral' ? `adp-label--${label}` : undefined}>{player.adp}</td>
                      <td>{player.projected_points.toFixed(1)}</td>
                      <td>{rec.value.toFixed(1)}</td>
                      <td
                        className={
                          rec.draftedBy || probability === null
                            ? undefined
                            : probability >= 0.5
                              ? 'availability--likely'
                              : 'availability--risky'
                        }
                      >
                        {rec.draftedBy || probability === null ? '—' : `${Math.round(probability * 100)}%`}
                      </td>
                    </>
                  )}
                  <td className="player-table__actions">
                    {rec.draftedBy ? (
                      <span className="drafted-label" title={`Drafted by ${rec.draftedBy}`}>
                        DRAFTED
                      </span>
                    ) : showActions ? (
                      <PlayerActions
                        teams={teams}
                        onDraftToMyTeam={() => onDraftToMyTeam(player.id)}
                        onMarkDraftedByTeam={(teamId) => onMarkDraftedByTeam(player.id, teamId)}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
