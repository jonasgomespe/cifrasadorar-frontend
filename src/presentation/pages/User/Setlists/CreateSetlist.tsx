import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronUp, ChevronDown, Trash2, Search, ListOrdered, Music } from 'lucide-react';
import styles from './CreateSetlist.module.css';
import { getOfflineSongs, saveSetlistOffline } from '../../../../data/datasources/local/IndexedDBConfig';
import { type Song } from '../../../../domain/entities/Song';

const generateUniqueId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'setlist_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const CreateSetlist: React.FC = () => {
  const [name, setName] = useState('');
  const [downloadedSongs, setDownloadedSongs] = useState<Song[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'select' | 'order'>('select');
  const navigate = useNavigate();

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    const songs = await getOfflineSongs();
    setDownloadedSongs(songs as unknown as Song[]);
  };

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds(prev => {
      if (prev.includes(songId)) {
        return prev.filter(id => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedSongIds(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= selectedSongIds.length - 1) return;
    setSelectedSongIds(prev => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const removeSong = (songId: string) => {
    setSelectedSongIds(prev => prev.filter(id => id !== songId));
  };

  const handleSave = async () => {
    if (!name.trim() || selectedSongIds.length === 0) return;

    const newSetlist = {
      id: generateUniqueId(),
      name: name.trim(),
      date: new Date().toISOString(),
      songIds: selectedSongIds,
    };

    await saveSetlistOffline(newSetlist);
    navigate('/setlists', { replace: true });
  };

  const filteredSongs = downloadedSongs.filter(song => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query);
  });

  const orderedSongs = selectedSongIds
    .map(id => downloadedSongs.find(s => s.id === id))
    .filter(Boolean) as Song[];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={24} />
        </button>
        <h1>Criar Repertório</h1>
        <button 
          className={styles.saveBtn} 
          onClick={handleSave}
          disabled={!name.trim() || selectedSongIds.length === 0}
        >
          Salvar Ordem
        </button>
      </header>

      <div className={styles.formCard}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="setName">Nome do Culto / Evento</label>
          <input
            id="setName"
            type="text"
            className={styles.input}
            placeholder="Ex: Culto de Domingo, Ensaio Jovem..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tabsBar}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'select' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('select')}
        >
          <Music size={16} />
          Selecionar Músicas
          <span className={styles.badge}>{selectedSongIds.length}</span>
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'order' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('order')}
        >
          <ListOrdered size={16} />
          Ordem de Tocar
          {selectedSongIds.length > 0 && <span className={styles.badge}>{selectedSongIds.length}</span>}
        </button>
      </div>

      {activeTab === 'select' ? (
        <>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={18} />
            <input 
              type="text"
              className={styles.searchInput}
              placeholder="Buscar nas músicas baixadas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <p className={styles.helperText}>
            Toque nas músicas baixadas para adicionar na ordem que a equipe vai tocar.
          </p>

          <div className={styles.songsList}>
            {downloadedSongs.length === 0 ? (
              <div className={styles.emptyState}>
                Nenhuma música baixada no momento.<br />
                Acesse a aba <strong>Biblioteca</strong> e baixe as músicas para usar offline.
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className={styles.emptyState}>
                Nenhuma música encontrada para "{searchQuery}".
              </div>
            ) : (
              filteredSongs.map((song) => {
                const isSelected = selectedSongIds.includes(song.id);
                const orderIndex = selectedSongIds.indexOf(song.id) + 1;

                return (
                  <div 
                    key={song.id} 
                    className={`${styles.songItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggleSongSelection(song.id)}
                  >
                    <div className={styles.checkbox}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    
                    <div className={styles.songInfo}>
                      <h4>{song.title}</h4>
                      <p>{song.artist}</p>
                    </div>

                    {isSelected && (
                      <div className={styles.orderBadge}>
                        {orderIndex}º
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <p className={styles.helperText}>
            Use as setas para ajustar a sequência exata em que as músicas serão tocadas.
          </p>

          <div className={styles.songsList}>
            {orderedSongs.length === 0 ? (
              <div className={styles.emptyState}>
                Nenhuma música selecionada ainda.<br />
                Volte na aba "Selecionar Músicas" e marque as músicas do culto.
              </div>
            ) : (
              orderedSongs.map((song, index) => (
                <div key={song.id} className={styles.orderCard}>
                  <div className={styles.orderBadge}>
                    {index + 1}º
                  </div>

                  <div className={styles.songInfo}>
                    <h4>{song.title}</h4>
                    <p>{song.artist}</p>
                  </div>

                  <div className={styles.orderControls}>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      title="Subir posição"
                      aria-label="Subir"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => moveDown(index)}
                      disabled={index === orderedSongs.length - 1}
                      title="Descer posição"
                      aria-label="Descer"
                    >
                      <ChevronDown size={18} />
                    </button>
                    <button 
                      className={`${styles.actionBtn} ${styles.removeBtn}`}
                      onClick={() => removeSong(song.id)}
                      title="Remover da ordem"
                      aria-label="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
