import React, { useState, useEffect } from 'react';
import styles from './SongsManagement.module.css';
import { Search, Plus } from 'lucide-react';
import { apiFetch } from '../../../../services/api';
import type { Chord } from '../Chords/ChordsManagement';

interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  chordId: string | null;
  lyrics: string | null;
  createdAt?: string;
}

export const SongsManagement: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [chords, setChords] = useState<Chord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpm, setBpm] = useState<number | ''>('');
  const [chordId, setChordId] = useState('');
  const [lyrics, setLyrics] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [songsData, chordsData] = await Promise.all([
        apiFetch('/songs'),
        apiFetch('/chords')
      ]);
      setSongs(songsData);
      setChords(chordsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        artist,
        bpm: bpm === '' ? null : Number(bpm),
        chordId: chordId === '' ? null : chordId,
        lyrics: lyrics === '' ? null : lyrics
      };

      if (editingId) {
        await apiFetch(`/songs/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/songs', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      fetchInitialData();
    } catch (error) {
      console.error('Error saving song:', error);
    }
  };

  const handleEdit = (song: Song) => {
    setEditingId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setBpm(song.bpm ?? '');
    setChordId(song.chordId ?? '');
    setLyrics(song.lyrics ?? '');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta música?')) return;
    try {
      await apiFetch(`/songs/${id}`, {
        method: 'DELETE',
      });
      if (editingId === id) {
        resetForm();
      }
      fetchInitialData();
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setArtist('');
    setBpm('');
    setChordId('');
    setLyrics('');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestão de Músicas</h1>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{editingId ? 'Editar Música' : 'Registrar Nova Música'}</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Título da Música</label>
            <input type="text" placeholder="Ex: Trem Bala" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className={styles.formGroup}>
            <label>Artista</label>
            <input type="text" placeholder="Ex: Ana Vilela" value={artist} onChange={e => setArtist(e.target.value)} required />
          </div>

          <div className={styles.formGroup}>
            <label>Acorde Associado</label>
            <div className={styles.chordSelectGroup}>
              <select value={chordId} onChange={e => setChordId(e.target.value)}>
                <option value="">Selecionar acorde...</option>
                {chords.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" className={styles.newChordBtn}>
                <Plus size={16} /> Novo Acorde
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>BPM (Batidas por Minuto)</label>
            <input type="number" placeholder="Ex: 90" value={bpm} onChange={e => setBpm(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Letra da Música (Cifra)</label>
            <textarea 
              placeholder="Cole a letra e os acordes aqui..." 
              value={lyrics} 
              onChange={e => setLyrics(e.target.value)} 
              rows={8}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ margin: 0 }}>
              {editingId ? 'Atualizar Música' : 'Salvar Música'}
            </button>
            {editingId && (
              <button type="button" className={styles.submitBtn} onClick={resetForm} style={{ backgroundColor: '#94a3b8', margin: 0 }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2 className={styles.cardTitle}>Músicas Registradas</h2>
          <div className={styles.searchBox}>
            <input type="text" placeholder="Buscar música..." />
            <Search size={16} className={styles.searchIcon} />
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>MÚSICA</th>
                <th>ARTISTA</th>
                <th>ACORDE</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {songs.map(song => {
                const chord = chords.find(c => c.id === song.chordId);
                return (
                  <tr key={song.id}>
                    <td><strong>{song.title}</strong></td>
                    <td>{song.artist}</td>
                    <td><span className={styles.badge}>{chord ? chord.name : '-'}</span></td>
                    <td>
                      <button className={styles.actionBtn} onClick={() => handleEdit(song)}>Editar</button>
                      <button className={styles.actionBtn} onClick={() => handleDelete(song.id)} style={{ marginLeft: '8px', color: '#ef4444' }}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
