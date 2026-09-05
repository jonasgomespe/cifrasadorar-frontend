export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  chordId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
