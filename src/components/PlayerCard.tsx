import type { ReactNode } from 'react';
import type { Player } from '../domain/player';
import { POSITION_COLORS } from './positionColors';

export interface PlayerCardStats {
  points: number;
  value: number;
  adp: number;
}

/**
 * A player shown as its own self-contained card — position badge, name, team/bye, and (when
 * projections exist) a key-stats row — instead of a bare name. Used anywhere a suggested
 * player needs to read as more than just text: Pick Next, Strategy.
 */
export function PlayerCard({
  player,
  positionRank,
  stats,
  reasonParts,
  badge,
  actions,
  compact = false,
}: {
  player: Player;
  positionRank?: number;
  stats?: PlayerCardStats;
  reasonParts?: string[];
  badge?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`player-card ${compact ? 'player-card--compact' : ''}`}>
      <div className="player-card__header">
        <span className="position-badge" style={{ backgroundColor: POSITION_COLORS[player.position[0]] }}>
          {player.position[0]}
          {positionRank ?? ''}
        </span>
        <div className="player-card__identity">
          <strong>{player.name}</strong>
          <span className="player-card__meta">
            {player.team}
            {player.bye_week ? ` · bye ${player.bye_week}` : ''}
          </span>
        </div>
        {badge && <span className="badge badge--value">{badge}</span>}
      </div>

      {stats && (
        <div className="player-card__stats">
          <span>{stats.points.toFixed(1)} pts</span>
          <span>
            {stats.value >= 0 ? '+' : ''}
            {stats.value.toFixed(1)} value
          </span>
          <span>ADP {stats.adp}</span>
        </div>
      )}

      {reasonParts && reasonParts.length > 0 && (
        <ul className="player-card__reasons">
          {reasonParts.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {actions && <div className="player-card__actions">{actions}</div>}
    </div>
  );
}
