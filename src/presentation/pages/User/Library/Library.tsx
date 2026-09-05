import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Music, Download, CheckCircle } from 'lucide-react';
import styles from './Library.module.css';
import { apiFetch } from '../../../../services/api';
import { saveSongOffline, saveChordOffline, getOfflineSongs } from '../../../../data/datasources/local/IndexedDBConfig';

interface Chord {
  id: string;
  name: string;
  type: string;
  tonality: string;
  instructions: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  chordId: string | null;
  lyrics: string | null;
}

export const Library: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [chords, setChords] = useState<Chord[]>([]);
  const [downloadedSongIds, setDownloadedSongIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [songsData, chordsData, offlineSongs] = await Promise.all([
        apiFetch('/songs'),
        apiFetch('/chords'),
        getOfflineSongs()
      ]);
      setSongs(songsData);
      setChords(chordsData);
      setDownloadedSongIds(new Set(offlineSongs.map(s => s.id)));
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (song: Song) => {
    try {
      // Find the associated chord
      const chord = chords.find(c => c.id === song.chordId);
      
      // Save song to IndexedDB
      await saveSongOffline(song);
      
      // Save chord to IndexedDB if it exists
      if (chord) {
        await saveChordOffline(chord);
      }
      
      // Update state to show as downloaded
      setDownloadedSongIds(prev => new Set([...prev, song.id]));
    } catch (error) {
      console.error('Error downloading song:', error);
      alert('Erro ao baixar música');
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Biblioteca</h1>
        <p className={styles.subtitle}>Encontre e baixe novas cifras</p>
      </header>

      <div className={styles.searchBox}>
        <Search size={20} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar por música ou artista..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.songsList}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</p>
        ) : filteredSongs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma música encontrada.</p>
        ) : (
          filteredSongs.map(song => {
            const chord = chords.find(c => c.id === song.chordId);
            const isDownloaded = downloadedSongIds.has(song.id);
            
            return (
              <div key={song.id} className={styles.songCard} onClick={() => navigate(`/song/${song.id}`)} style={{ cursor: 'pointer' }}>
                <div className={styles.songIcon}>
                  <Music size={24} />
                </div>
                <div className={styles.songInfo}>
                  <h4>{song.title}</h4>
                  <p>{song.artist} {chord ? `• Tom: ${chord.tonality}` : ''}</p>
                </div>
                <button 
                  className={styles.downloadBtn} 
                  disabled={isDownloaded}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(song);
                  }}
                >
                  {isDownloaded ? (
                    <>
                      <CheckCircle size={16} /> Baixado
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Baixar
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
