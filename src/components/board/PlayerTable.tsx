import { useMemo, useState } from 'react';
import type { Recommendation } from '../../engine/types';
import type { Position } from '../../domain/player';
import { labelAdpDelta } from '../../engine/value';

type SortKey = 'rank' | 'adp' | 'projected_points' | 'value';

const ALL_POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

export function PlayerTable({
  recommendations,
  onDraft,
}: {
  recommendations: Recommendation[];
  onDraft: (playerId: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    let filtered = recommendations;
    if (positionFilter !== 'ALL') {
      filtered = filtered.filter((r) => r.player.position.includes(positionFilter));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) => r.player.name.toLowerCase().includes(q));
    }
    const sorted = [...filtered].sort((a, b) => {
      const aVal = sortKey === 'value' ? a.value : a.player[sortKey];
      const bVal = sortKey === 'value' ? b.value : b.player[sortKey];
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [recommendations, positionFilter, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((asc) => !asc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <section className="player-table">
      <div className="player-table__controls">
        <input
          type="search"
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value as Position | 'ALL')}>
          <option value="ALL">All positions</option>
          {ALL_POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Pos</th>
            <th>Team</th>
            <th>Bye</th>
            <th onClick={() => toggleSort('adp')}>ADP</th>
            <th onClick={() => toggleSort('rank')}>Rank</th>
            <th onClick={() => toggleSort('projected_points')}>Proj Pts</th>
            <th onClick={() => toggleSort('value')}>Value</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((rec) => {
            const label = labelAdpDelta(rec.adpDelta);
            return (
              <tr key={rec.player.id}>
                <td>{rec.player.name}</td>
                <td>{rec.player.position.join('/')}</td>
                <td>{rec.player.team}</td>
                <td>{rec.player.bye_week ?? '—'}</td>
                <td className={label !== 'neutral' ? `adp-label--${label}` : undefined}>{rec.player.adp}</td>
                <td>{rec.player.rank}</td>
                <td>{rec.player.projected_points.toFixed(1)}</td>
                <td>{rec.value.toFixed(1)}</td>
                <td>
                  <button type="button" onClick={() => onDraft(rec.player.id)}>
                    Draft
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
