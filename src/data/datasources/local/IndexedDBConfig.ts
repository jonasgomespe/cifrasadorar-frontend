import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { type Chord } from '../../../domain/entities/Chord';
import { type Song } from '../../../domain/entities/Song';
import { type LocalSetlist } from '../../../domain/entities/LocalSetlist';

interface CifrasAppDB extends DBSchema {
  chords: {
    key: string;
    value: Chord;
    indexes: { 'by-name': string };
  };
  songs: {
    key: string;
    value: Song;
    indexes: { 'by-title': string };
  };
  setlists: {
    key: string;
    value: LocalSetlist;
    indexes: { 'by-date': Date | string };
  };
}

const DB_NAME = 'cifrasadorar-db';
const DB_VERSION = 2; // Bumped version for setlists

let dbPromise: Promise<IDBPDatabase<CifrasAppDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CifrasAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chords')) {
          const chordStore = db.createObjectStore('chords', { keyPath: 'id' });
          chordStore.createIndex('by-name', 'name');
        }
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('by-title', 'title');
        }
        if (!db.objectStoreNames.contains('setlists')) {
          const setlistStore = db.createObjectStore('setlists', { keyPath: 'id' });
          setlistStore.createIndex('by-date', 'date');
        }
      },
    });
  }
  return dbPromise;
};

// Utils para Acordes Offline
export const saveChordOffline = async (chord: Chord) => {
  const db = await getDB();
  await db.put('chords', chord);
};

export const getOfflineChords = async (): Promise<Chord[]> => {
  const db = await getDB();
  return db.getAll('chords');
};

// Utils para Músicas Offline
export const saveSongOffline = async (song: Song) => {
  const db = await getDB();
  await db.put('songs', song);
};

export const getOfflineSongs = async (): Promise<Song[]> => {
  const db = await getDB();
  return db.getAll('songs');
};

export const removeSongOffline = async (songId: string) => {
  const db = await getDB();
  await db.delete('songs', songId);
};

export const clearOfflineData = async () => {
  const db = await getDB();
  await db.clear('songs');
  await db.clear('chords');
  await db.clear('setlists');
};

// Utils para Setlists Offline
export const saveSetlistOffline = async (setlist: LocalSetlist) => {
  const db = await getDB();
  await db.put('setlists', setlist);
};

export const getOfflineSetlists = async (): Promise<LocalSetlist[]> => {
  const db = await getDB();
  return db.getAll('setlists');
};

export const removeSetlistOffline = async (setlistId: string) => {
  const db = await getDB();
  await db.delete('setlists', setlistId);
};
