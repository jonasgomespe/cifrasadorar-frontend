import React, { useState, useEffect } from 'react';
import styles from './ChordsManagement.module.css';
import { Search } from 'lucide-react';
import { apiFetch } from '../../../../services/api';

export interface Chord {
  id: string;
  name: string;
  type: string;
  tonality: string;
  instructions: string;
  createdAt?: string;
}

export const ChordsManagement: React.FC = () => {
  const [chords, setChords] = useState<Chord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('Maior');
  const [tonality, setTonality] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    fetchChords();
  }, []);

  const fetchChords = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/chords');
      setChords(data);
    } catch (error) {
      console.error('Error fetching chords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiFetch(`/chords/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ name, type, tonality, instructions }),
        });
      } else {
        await apiFetch('/chords', {
          method: 'POST',
          body: JSON.stringify({ name, type, tonality, instructions }),
        });
      }
      resetForm();
      fetchChords();
    } catch (error) {
      console.error('Error saving chord:', error);
    }
  };

  const handleEdit = (chord: Chord) => {
    setEditingId(chord.id);
    setName(chord.name);
    setType(chord.type);
    setTonality(chord.tonality);
    setInstructions(chord.instructions);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este acorde?')) return;
    try {
      await apiFetch(`/chords/${id}`, {
        method: 'DELETE',
      });
      if (editingId === id) {
        resetForm();
      }
      fetchChords();
    } catch (error) {
      console.error('Error deleting chord:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('Maior');
    setTonality('');
    setInstructions('');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestão de Acordes</h1>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{editingId ? 'Editar Acorde' : 'Registrar Novo Acorde'}</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nome do acorde</label>
            <input type="text" placeholder="Ex: D maior" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="Maior">Maior</option>
              <option value="Menor">Menor</option>
              <option value="Sétima">Sétima</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Tonalidade</label>
            <input type="text" placeholder="Ex: Ré" value={tonality} onChange={e => setTonality(e.target.value)} required />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Instruções</label>
            <input type="text" placeholder="Ex: Dedos: 2-3-2-0-0-2" value={instructions} onChange={e => setInstructions(e.target.value)} required />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ margin: 0 }}>
              {editingId ? 'Atualizar Acorde' : 'Salvar Acorde'}
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
          <h2 className={styles.cardTitle}>Acordes Registrados</h2>
          <div className={styles.searchBox}>
            <input type="text" placeholder="Buscar acorde..." />
            <Search size={16} className={styles.searchIcon} />
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ACORDE</th>
                <th>TONALIDADE</th>
                <th>CRIADO EM</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {chords.map(chord => (
                <tr key={chord.id}>
                  <td>
                    <strong>{chord.name}</strong> <span className={styles.badge}>{chord.type}</span>
                  </td>
                  <td>{chord.tonality}</td>
                  <td>{chord.createdAt ? new Date(chord.createdAt).toLocaleDateString('pt-BR') : ''}</td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => handleEdit(chord)}>
                      Editar
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleDelete(chord.id)} style={{ marginLeft: '8px', color: '#ef4444' }}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
