import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DraftState } from '../domain/draft';

export interface SavedDraft {
  id: string;
  label: string;
  savedAt: number;
  state: DraftState;
}

interface DraftDB extends DBSchema {
  draftState: {
    key: string;
    value: DraftState;
  };
  savedDrafts: {
    key: string;
    value: SavedDraft;
  };
}

const DB_NAME = 'fantasy-draft';
const DB_VERSION = 2;
const STORE_NAME = 'draftState';
const SAVED_DRAFTS_STORE = 'savedDrafts';

let dbPromise: Promise<IDBPDatabase<DraftDB>> | undefined;

export function getDb(): Promise<IDBPDatabase<DraftDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DraftDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_NAME);
        }
        if (oldVersion < 2) {
          db.createObjectStore(SAVED_DRAFTS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export { STORE_NAME, SAVED_DRAFTS_STORE };
export type { DraftDB };
