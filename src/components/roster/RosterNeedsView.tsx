import { useState } from 'react';
import type { Player } from '../../domain/player';
import { groupRosterBySlot, type RosterSlot } from '../../domain/roster';
import { POSITION_COLORS } from '../positionColors';

export function RosterNeedsView({
  title = 'My Team',
  rosterSlots,
  roster,
  compact = false,
}: {
  title?: string;
  rosterSlots: RosterSlot[];
  roster: Player[];
  compact?: boolean;
}) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const grouped = groupRosterBySlot(rosterSlots, roster);

  return (
    <section className={`roster-needs ${compact ? 'roster-needs--compact' : ''}`}>
      <h2>{title}</h2>
      <div className="roster-needs__pills">
        {grouped.map((slot) => {
          const isFull = slot.filled >= slot.count;
          const isExpanded = expandedSlot === slot.position;
          return (
            <div key={slot.position} className="roster-pill-wrapper">
              <button
                type="button"
                className={`roster-pill ${isFull ? 'roster-pill--full' : 'roster-pill--open'}`}
                onClick={() => setExpandedSlot(isExpanded ? null : slot.position)}
                aria-expanded={isExpanded}
              >
                {slot.position} {slot.filled}/{slot.count}
              </button>
              {isExpanded && (
                <ul className="roster-pill__detail">
                  {slot.players.length > 0 ? (
                    slot.players.map((player) => (
                      <li key={player.id}>
                        <span
                          className="position-badge"
                          style={{ backgroundColor: POSITION_COLORS[player.position[0]] }}
                        >
                          {player.position[0]}
                        </span>
                        {player.name}
                      </li>
                    ))
                  ) : (
                    <li className="roster-pill__empty">No players yet</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
