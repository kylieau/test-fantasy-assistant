import { useSavedDrafts } from '../../state/useSavedDrafts';
import { useDraft } from '../../state/DraftContext';

function formatSavedAt(savedAt: number): string {
  return new Date(savedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Lets the user resume or delete a previously labeled/saved draft, from the setup screen. */
export function SavedDraftsPanel() {
  const { savedDrafts, isLoading, remove } = useSavedDrafts();
  const { loadSavedDraftById } = useDraft();

  if (isLoading || savedDrafts.length === 0) return null;

  return (
    <section className="saved-drafts">
      <h2>Saved Drafts</h2>
      <ul className="saved-drafts__list">
        {savedDrafts.map((saved) => (
          <li key={saved.id} className="saved-drafts__item">
            <div className="saved-drafts__info">
              <strong>{saved.label}</strong>
              <span className="saved-drafts__meta">
                {saved.state.leagueSettings.teamCount}-team · pick {saved.state.currentPick} ·{' '}
                {formatSavedAt(saved.savedAt)}
              </span>
            </div>
            <div className="saved-drafts__actions">
              <button type="button" onClick={() => loadSavedDraftById(saved.id)}>
                Resume
              </button>
              <button type="button" onClick={() => remove(saved.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
