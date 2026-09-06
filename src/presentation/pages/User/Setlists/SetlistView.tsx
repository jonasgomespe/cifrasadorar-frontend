import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Play } from 'lucide-react';
import styles from './SetlistView.module.css';
import { getOfflineSetlists, getOfflineSongs } from '../../../../data/datasources/local/IndexedDBConfig';
import { type LocalSetlist } from '../../../../domain/entities/LocalSetlist';
import { type Song } from '../../../../domain/entities/Song';

export const SetlistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [setlist, setSetlist] = useState<LocalSetlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (setlistId: string) => {
    try {
      setLoading(true);
      const [allSetlists, allSongs] = await Promise.all([
        getOfflineSetlists(),
        getOfflineSongs()
      ]);

      const foundSetlist = allSetlists.find(s => s.id === setlistId);
      
      if (foundSetlist) {
        setSetlist(foundSetlist);
        
        // Map songIds to actual Song objects, preserving order
        const mappedSongs = foundSetlist.songIds
          .map(songId => (allSongs as unknown as Song[]).find(s => s.id === songId))
          .filter(Boolean) as Song[];
          
        setSongs(mappedSongs);
      }
    } catch (error) {
      console.error('Error loading setlist details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const openSong = (songId: string) => {
    if (!setlist) return;
    navigate(`/song/${songId}?setlistId=${setlist.id}`);
  };

  if (loading) {
    return <div className={styles.loading}>Carregando repertório...</div>;
  }

  if (!setlist) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/setlists')} aria-label="Voltar">
            <ArrowLeft size={24} />
          </button>
          <h1>Lista não encontrada</h1>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/setlists')} aria-label="Voltar">
          <ArrowLeft size={24} />
        </button>
        <h1>{setlist.name}</h1>
      </header>

      <div className={styles.topBar}>
        <div className={styles.dateInfo}>
          <Calendar size={15} /> 
          Criado em {formatDate(setlist.date)} • {songs.length} músicas
        </div>
        {songs.length > 0 && (
          <button className={styles.playAllBtn} onClick={() => openSong(songs[0].id)}>
            <Play size={14} fill="currentColor" /> Tocar Ordem
          </button>
        )}
      </div>

      <div className={styles.songsList}>
        {songs.length === 0 ? (
          <p className={styles.loading}>Nenhuma música encontrada nesta lista.</p>
        ) : (
          songs.map((song, index) => (
            <div 
              key={`${song.id}-${index}`} 
              className={styles.songItem}
              onClick={() => openSong(song.id)}
            >
              <div className={styles.orderBadge}>
                {index + 1}º
              </div>
              
              <div className={styles.songInfo}>
                <h4>{song.title}</h4>
                <p>{song.artist}</p>
              </div>

              <Play size={18} color="var(--primary-color)" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
