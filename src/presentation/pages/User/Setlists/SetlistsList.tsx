import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Trash2, Calendar, Plus, Sparkles } from 'lucide-react';
import styles from './SetlistsList.module.css';
import { getOfflineSetlists, removeSetlistOffline, getOfflineSongs, getOfflineChords } from '../../../../data/datasources/local/IndexedDBConfig';
import { type LocalSetlist } from '../../../../domain/entities/LocalSetlist';

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.031 2C6.514 2 2.029 6.485 2.029 12c0 1.905.534 3.684 1.464 5.201L2 22.25l5.228-1.37a9.93 9.93 0 004.803 1.238h.004c5.517 0 10.002-4.485 10.002-10 0-2.671-1.04-5.183-2.93-7.073C17.214 3.045 14.702 2 12.031 2zm5.836 14.283c-.244.685-1.218 1.34-1.721 1.398-.475.054-1.09.077-3.528-.909-2.73-1.104-4.49-3.87-4.626-4.05-.136-.182-1.11-1.477-1.11-2.817 0-1.339.7-1.998.948-2.27.247-.272.54-.34.72-.34.18 0 .36.002.518.01.166.008.388-.063.606.462.227.545.772 1.884.84 2.02.068.136.113.295.023.476-.091.181-.136.295-.272.454-.136.159-.286.354-.408.476-.136.136-.278.284-.12.556.159.272.705 1.162 1.512 1.88 1.037.925 1.91 1.212 2.182 1.348.272.136.431.114.59-.068.16-.182.68-0.794.862-1.066.182-.272.363-.227.612-.136.25.091 1.583.747 1.855.883.272.136.454.204.522.318.068.113.068.657-.176 1.342z" />
  </svg>
);

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

  const handleQuickShareWhatsApp = async (e: React.MouseEvent, setlist: LocalSetlist) => {
    e.stopPropagation();
    try {
      const [allSongs, allChords] = await Promise.all([
        getOfflineSongs(),
        getOfflineChords()
      ]);
      const dateStr = formatDate(setlist.date);
      const origin = window.location.origin;

      let text = `🎵 *REPERTÓRIO DE LOUVOR*\n`;
      text += `📋 *${setlist.name}*\n`;
      text += `📅 *Data:* ${dateStr}\n`;
      text += `🎼 *Músicas (${setlist.songIds.length}):*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      setlist.songIds.forEach((sId, idx) => {
        const song = allSongs.find(s => s.id === sId);
        if (song) {
          const chord = allChords.find(c => c.id === song.chordId);
          const tonality = chord ? (chord.tonality || chord.name) : null;
          text += `*${idx + 1}º* 🎶 *${song.title}* - ${song.artist}\n`;
          const meta = [];
          if (tonality) meta.push(`Tom: *${tonality}*`);
          if (song.bpm) meta.push(`BPM: *${song.bpm}*`);
          if (meta.length > 0) text += `   ↳ ${meta.join(' • ')}\n`;
          text += `   🔗 Cifra: ${origin}/song/${song.id}?setlistId=${setlist.id}\n\n`;
        }
      });

      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `✨ _Ordem gerada pelo CifrasAdorar_`;

      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error sharing setlist:', err);
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
              <div className={styles.cardActions}>
                <button
                  className={styles.shareCardBtn}
                  onClick={(e) => handleQuickShareWhatsApp(e, setlist)}
                  aria-label="Compartilhar no WhatsApp"
                  title="Compartilhar no WhatsApp"
                >
                  <WhatsAppIcon size={18} />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(e, setlist.id)}
                  aria-label="Excluir"
                  title="Excluir Lista"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {setlists.length > 0 && typeof document !== 'undefined' && createPortal(
        <button 
          type="button"
          className={styles.fabBtn} 
          onClick={() => navigate('/setlists/create')}
          title="Criar nova ordem de repertório"
        >
          <Plus size={20} /> Criar ordem
        </button>,
        document.body
      )}
    </div>
  );
};
