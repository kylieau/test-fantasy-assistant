import { useCallback, useEffect, useState } from 'react';
import { deleteSavedDraft, listSavedDrafts, type SavedDraft } from '../persistence/savedDraftsRepository';

export function useSavedDrafts(): {
  savedDrafts: SavedDraft[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
} {
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSavedDrafts(await listSavedDrafts());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      await deleteSavedDraft(id);
      await refresh();
    },
    [refresh],
  );

  return { savedDrafts, isLoading, refresh, remove };
}
