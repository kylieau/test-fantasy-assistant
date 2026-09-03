import type { DraftState } from '../domain/draft';
import { getDb, STORE_NAME } from './db';

const CURRENT_DRAFT_KEY = 'current';

export async function saveDraftState(state: DraftState): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, state, CURRENT_DRAFT_KEY);
}

export async function loadDraftState(): Promise<DraftState | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, CURRENT_DRAFT_KEY);
}

export async function clearDraftState(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, CURRENT_DRAFT_KEY);
}
