import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DraftState } from '../domain/draft';

interface DraftDB extends DBSchema {
  draftState: {
    key: string;
    value: DraftState;
  };
}

const DB_NAME = 'fantasy-draft';
const DB_VERSION = 1;
const STORE_NAME = 'draftState';

let dbPromise: Promise<IDBPDatabase<DraftDB>> | undefined;

export function getDb(): Promise<IDBPDatabase<DraftDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DraftDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}

export { STORE_NAME };
export type { DraftDB };
