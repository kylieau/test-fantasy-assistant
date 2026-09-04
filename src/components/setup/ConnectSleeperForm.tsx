import { useState, type FormEvent } from 'react';
import {
  ALL_STRATEGIES,
  STRATEGY_DESCRIPTIONS,
  STRATEGY_LABELS,
  type DraftStrategy,
} from '../../domain/strategy';
import { useDraft } from '../../state/DraftContext';

export function ConnectSleeperForm() {
  const { connectSleeperDraft } = useDraft();
  const [username, setUsername] = useState('');
  const [draftId, setDraftId] = useState('');
  const [strategy, setStrategy] = useState<DraftStrategy>('balanced');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsConnecting(true);
    setError(null);

    const result = await connectSleeperDraft(draftId.trim(), username.trim(), strategy);

    setIsConnecting(false);
    if (!result.ok) {
      setError(result.error);
    }
  }

  return (
    <form className="league-setup" onSubmit={handleSubmit}>
      <h2>Connect to Sleeper</h2>
      <p className="connect-sleeper__note">
        Real players and live picks sync automatically from your Sleeper draft. Since Sleeper
        doesn't provide projections or ADP, recommendations aren't available in this mode yet —
        this is a live tracker: your team, everyone else's team, and who's still on the board.
      </p>

      <label className="field">
        <span>Your Sleeper username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. sleeperuser"
          required
        />
      </label>

      <label className="field">
        <span>Draft ID</span>
        <input
          type="text"
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
          placeholder="from the draft room URL"
          required
        />
      </label>

      <fieldset className="strategy-picker">
        <legend>Your draft strategy</legend>
        <p className="connect-sleeper__note">
          Kept for when recommendations become available in a future update — not used yet.
        </p>
        {ALL_STRATEGIES.map((s) => (
          <label key={s} className="strategy-option">
            <input
              type="radio"
              name="strategy"
              value={s}
              checked={strategy === s}
              onChange={() => setStrategy(s)}
            />
            <span>
              <strong>{STRATEGY_LABELS[s]}</strong>
              <small>{STRATEGY_DESCRIPTIONS[s]}</small>
            </span>
          </label>
        ))}
      </fieldset>

      {error && <p className="connect-sleeper__error">{error}</p>}

      <button type="submit" className="primary-button" disabled={isConnecting}>
        {isConnecting ? 'Connecting…' : 'Connect'}
      </button>
    </form>
  );
}
