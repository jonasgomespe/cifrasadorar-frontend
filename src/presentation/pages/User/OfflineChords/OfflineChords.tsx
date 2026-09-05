import React, { useState, useEffect } from 'react';
import { CloudOff, Music, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './OfflineChords.module.css';
import { getOfflineSongs, getOfflineChords, removeSongOffline, clearOfflineData } from '../../../../data/datasources/local/IndexedDBConfig';

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
  lyrics?: string | null;
}

export const OfflineChords: React.FC = () => {
  const [downloadedSongs, setDownloadedSongs] = useState<Song[]>([]);
  const [downloadedChords, setDownloadedChords] = useState<Chord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = async () => {
    try {
      setLoading(true);
      const [songs, chords] = await Promise.all([
        getOfflineSongs(),
        getOfflineChords()
      ]);
      setDownloadedSongs(songs as unknown as Song[]);
      setDownloadedChords(chords);
    } catch (error) {
      console.error('Error loading offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    try {
      await removeSongOffline(songId);
      // Reload list
      await loadOfflineData();
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearOfflineData();
      setShowModal(false);
      await loadOfflineData();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Acordes Offline</h1>
        <p className={styles.subtitle}>Baixe e acesse sem internet</p>
      </header>

      <div className={styles.statusCard}>
        <div className={styles.statusIcon}>
          <CloudOff size={28} />
        </div>
        <div className={styles.statusText}>
          <h3>Modo Offline Ativado</h3>
          <p>Suas músicas estão disponíveis sem conexão</p>
        </div>
      </div>

      <div className={styles.listHeader}>
        <h2>Músicas Baixadas ({downloadedSongs.length})</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={styles.storageInfo}>24 MB de 500 MB</span>
          {downloadedSongs.length > 0 && (
            <button className={styles.deleteAllBtn} onClick={() => setShowModal(true)}>
              <Trash2 size={16} /> Excluir Tudo
            </button>
          )}
        </div>
      </div>

      <div className={styles.songsList}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</p>
        ) : downloadedSongs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma música baixada.</p>
        ) : (
          downloadedSongs.map(song => {
            const chord = downloadedChords.find(c => c.id === song.chordId);
            return (
              <div key={song.id} className={styles.songCard} onClick={() => navigate(`/song/${song.id}`)} style={{ cursor: 'pointer' }}>
                <div className={styles.songIcon}>
                  <Music size={24} />
                </div>
                <div className={styles.songInfo}>
                  <h4>{song.title}</h4>
                  <p>{song.artist} {chord ? `• Tom: ${chord.tonality}` : ''}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.downloadBadge} onClick={(e) => e.stopPropagation()}>
                    Baixado
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteSong(e, song.id)}
                    aria-label="Excluir"
                    title="Excluir Música"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        <button className={styles.fabBtn} onClick={() => navigate('/library')}>
          + Baixar Novos Acordes
        </button>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Excluir todas as cifras?</h3>
            <p>Tem certeza de que deseja remover todas as cifras baixadas do seu dispositivo? Essa ação não pode ser desfeita e você precisará de internet para baixá-las novamente.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleClearAll}>
                Sim, Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
