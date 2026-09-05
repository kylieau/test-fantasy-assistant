import type { DraftState } from '../domain/draft';
import { getDb, SAVED_DRAFTS_STORE, type SavedDraft } from './db';

export type { SavedDraft };

// Guards against two saves landing in the same millisecond (getAll() orders by key, not by
// value, so a savedAt tie would otherwise leave "newest first" sorting non-deterministic).
let lastSavedAt = 0;

export async function saveDraftAs(label: string, state: DraftState): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const savedAt = Math.max(Date.now(), lastSavedAt + 1);
  lastSavedAt = savedAt;
  const record: SavedDraft = { id, label, savedAt, state };
  await db.put(SAVED_DRAFTS_STORE, record, id);
  return id;
}

export async function listSavedDrafts(): Promise<SavedDraft[]> {
  const db = await getDb();
  const all = await db.getAll(SAVED_DRAFTS_STORE);
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function loadSavedDraft(id: string): Promise<SavedDraft | undefined> {
  const db = await getDb();
  return db.get(SAVED_DRAFTS_STORE, id);
}

export async function deleteSavedDraft(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(SAVED_DRAFTS_STORE, id);
}
