import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Trash2, Calendar, Plus, Sparkles } from 'lucide-react';
import styles from './SetlistsList.module.css';
import { getOfflineSetlists, removeSetlistOffline } from '../../../../data/datasources/local/IndexedDBConfig';
import { type LocalSetlist } from '../../../../domain/entities/LocalSetlist';

export const SetlistsList: React.FC = () => {
  const [setlists, setSetlists] = useState<LocalSetlist[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSetlists();
  }, []);

  const loadSetlists = async () => {
    try {
      setLoading(true);
      const data = await getOfflineSetlists();
      // Sort by date descending (newest first)
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSetlists(sorted);
    } catch (error) {
      console.error('Error loading setlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta lista?')) {
      await removeSetlistOffline(id);
      await loadSetlists();
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Repertórios</h1>
        <p className={styles.subtitle}>Monte e organize a ordem das músicas do culto</p>
      </header>

      <div className={styles.listHeader}>
        <h2>Listas Salvas ({setlists.length})</h2>
      </div>

      <div className={styles.setlistsContainer}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>Carregando...</p>
        ) : setlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)'
            }}>
              <Sparkles size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Nenhuma ordem criada</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                Organize a sequência das músicas que sua equipe vai tocar no dia do culto.
              </p>
            </div>
            <button
              onClick={() => navigate('/setlists/create')}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} /> Criar primeira ordem
            </button>
          </div>
        ) : (
          setlists.map((setlist) => (
            <div 
              key={setlist.id} 
              className={styles.setlistCard}
              onClick={() => navigate(`/setlists/${setlist.id}`)}
            >
              <div className={styles.setlistIcon}>
                <ListMusic size={24} />
              </div>
              <div className={styles.setlistInfo}>
                <h4>{setlist.name}</h4>
                <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {formatDate(setlist.date)} • {setlist.songIds.length} músicas
                </p>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(e, setlist.id)}
                aria-label="Excluir"
                title="Excluir Lista"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {setlists.length > 0 && (
        <button className={styles.fabBtn} onClick={() => navigate('/setlists/create')}>
          <Plus size={20} /> Criar ordem
        </button>
      )}
    </div>
  );
};
