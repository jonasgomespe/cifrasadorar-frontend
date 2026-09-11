import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Play, Copy, Check } from 'lucide-react';
import styles from './SetlistView.module.css';
import { getOfflineSetlists, getOfflineSongs, getOfflineChords } from '../../../../data/datasources/local/IndexedDBConfig';
import { type LocalSetlist } from '../../../../domain/entities/LocalSetlist';
import { type Song } from '../../../../domain/entities/Song';
import { type Chord } from '../../../../domain/entities/Chord';

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.031 2C6.514 2 2.029 6.485 2.029 12c0 1.905.534 3.684 1.464 5.201L2 22.25l5.228-1.37a9.93 9.93 0 004.803 1.238h.004c5.517 0 10.002-4.485 10.002-10 0-2.671-1.04-5.183-2.93-7.073C17.214 3.045 14.702 2 12.031 2zm5.836 14.283c-.244.685-1.218 1.34-1.721 1.398-.475.054-1.09.077-3.528-.909-2.73-1.104-4.49-3.87-4.626-4.05-.136-.182-1.11-1.477-1.11-2.817 0-1.339.7-1.998.948-2.27.247-.272.54-.34.72-.34.18 0 .36.002.518.01.166.008.388-.063.606.462.227.545.772 1.884.84 2.02.068.136.113.295.023.476-.091.181-.136.295-.272.454-.136.159-.286.354-.408.476-.136.136-.278.284-.12.556.159.272.705 1.162 1.512 1.88 1.037.925 1.91 1.212 2.182 1.348.272.136.431.114.59-.068.16-.182.68-0.794.862-1.066.182-.272.363-.227.612-.136.25.091 1.583.747 1.855.883.272.136.454.204.522.318.068.113.068.657-.176 1.342z" />
  </svg>
);

export const SetlistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [setlist, setSetlist] = useState<LocalSetlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [chordsMap, setChordsMap] = useState<Record<string, Chord>>({});
  const [loading, setLoading] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (setlistId: string) => {
    try {
      setLoading(true);
      const [allSetlists, allSongs, allChords] = await Promise.all([
        getOfflineSetlists(),
        getOfflineSongs(),
        getOfflineChords()
      ]);

      const cMap: Record<string, Chord> = {};
      allChords.forEach(c => {
        cMap[c.id] = c;
      });
      setChordsMap(cMap);

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

  // Gerador de Texto Pronto para WhatsApp
  const generateWhatsAppMessage = () => {
    if (!setlist) return '';

    const dateStr = formatDate(setlist.date);
    const origin = window.location.origin;

    let text = `🎵 *REPERTÓRIO DE LOUVOR*\n`;
    text += `📋 *${setlist.name}*\n`;
    text += `📅 *Data:* ${dateStr}\n`;
    text += `🎼 *Músicas (${songs.length}):*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    songs.forEach((song, index) => {
      const chord = chordsMap[song.chordId || ''];
      const tonality = chord ? (chord.tonality || chord.name) : null;

      text += `*${index + 1}º* 🎶 *${song.title}* - ${song.artist}\n`;
      const meta = [];
      if (tonality) meta.push(`Tom: *${tonality}*`);
      if (song.bpm) meta.push(`BPM: *${song.bpm}*`);
      if (meta.length > 0) {
        text += `   ↳ ${meta.join(' • ')}\n`;
      }
      text += `   🔗 Cifra: ${origin}/song/${song.id}?setlistId=${setlist.id}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ _Ordem gerada pelo CifrasAdorar_`;

    return text;
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch {
      // Fallback simples caso clipboard api falhe
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
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

      {/* Barra de Ações de Compartilhamento */}
      {songs.length > 0 && (
        <div className={styles.shareBar}>
          <button 
            className={styles.whatsappBtn} 
            onClick={handleShareWhatsApp}
            title="Compartilhar repertório pronto no WhatsApp"
          >
            <WhatsAppIcon size={18} />
            <span>Compartilhar no WhatsApp</span>
          </button>

          <button 
            className={styles.copyBtn} 
            onClick={handleCopyText}
            title="Copiar texto do repertório para área de transferência"
          >
            {copiedToast ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
            <span>{copiedToast ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      )}

      {/* Toast Feedback */}
      {copiedToast && (
        <div className={styles.toastNotification}>
          <Check size={16} /> Repertório copiado para a área de transferência!
        </div>
      )}

      <div className={styles.songsList}>
        {songs.length === 0 ? (
          <p className={styles.loading}>Nenhuma música encontrada nesta lista.</p>
        ) : (
          songs.map((song, index) => {
            const chord = chordsMap[song.chordId || ''];
            const tonality = chord ? (chord.tonality || chord.name) : null;

            return (
              <div 
                key={`${song.id}-${index}`} 
                className={styles.songItem}
                onClick={() => openSong(song.id)}
              >
                <div className={styles.orderBadge}>
                  {index + 1}º
                </div>
                
                <div className={styles.songInfo}>
                  <div className={styles.songTitleRow}>
                    <h4>{song.title}</h4>
                    {tonality && (
                      <span className={styles.tonalityBadge}>Tom: {tonality}</span>
                    )}
                  </div>
                  <p>
                    {song.artist}
                    {song.bpm ? ` • ${song.bpm} BPM` : ''}
                  </p>
                </div>

                <Play size={18} color="var(--primary-color)" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

