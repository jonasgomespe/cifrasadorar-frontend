import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Sun,
  SunDim,
  Maximize2,
  Minimize2,
  Play,
  Pause
} from 'lucide-react';
import styles from './SongViewer.module.css';
import { getOfflineSongs, getOfflineChords, getOfflineSetlists } from '../../../../data/datasources/local/IndexedDBConfig';
import { type LocalSetlist } from '../../../../domain/entities/LocalSetlist';
import { apiFetch } from '../../../../services/api';
import { transposeChord, transposeLyrics, parseSongSections } from '../../../utils/transpose';
import { SongToolsDrawer } from '../../../components/SongToolsDrawer/SongToolsDrawer';

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

const SPEED_PRESETS = [0.5, 0.8, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0];

export const SongViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const setlistId = searchParams.get('setlistId');
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [chord, setChord] = useState<Chord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [showChords, setShowChords] = useState(true);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('cifras_font_size');
    const parsed = saved ? parseInt(saved, 10) : 14;
    return !isNaN(parsed) && parsed >= 10 && parsed <= 32 ? parsed : 14;
  });

  // Auto-scroll
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [speedIndex, setSpeedIndex] = useState<number>(() => {
    const saved = localStorage.getItem('cifras_scroll_speed');
    const parsed = saved ? parseInt(saved, 10) : 2;
    return !isNaN(parsed) && parsed >= 0 && parsed < SPEED_PRESETS.length ? parsed : 2;
  });
  const scrollAnimRef = useRef<number | null>(null);
  const scrollAccRef = useRef<number>(0);

  const handleSpeedDown = () => {
    setSpeedIndex(prev => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem('cifras_scroll_speed', String(next));
      return next;
    });
  };

  const handleSpeedUp = () => {
    setSpeedIndex(prev => {
      const next = Math.min(SPEED_PRESETS.length - 1, prev + 1);
      localStorage.setItem('cifras_scroll_speed', String(next));
      return next;
    });
  };


  const handleZoomIn = () => {
    setFontSize(prev => {
      const next = Math.min(prev + 1, 32);
      localStorage.setItem('cifras_font_size', String(next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setFontSize(prev => {
      const next = Math.max(prev - 1, 10);
      localStorage.setItem('cifras_font_size', String(next));
      return next;
    });
  };

  const handleResetZoom = () => {
    setFontSize(14);
    localStorage.setItem('cifras_font_size', '14');
  };

  // Modo Palco: Manter Tela Acesa (Screen Wake Lock)
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockSentinelRef = useRef<any>(null);

  const requestWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        sentinel.addEventListener('release', () => {
          setIsWakeLockActive(false);
          wakeLockSentinelRef.current = null;
        });
        wakeLockSentinelRef.current = sentinel;
        setIsWakeLockActive(true);
      } catch {
        setIsWakeLockActive(false);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch {
        // Fallback silencioso
      }
      wakeLockSentinelRef.current = null;
      setIsWakeLockActive(false);
    }
  };

  const toggleWakeLock = async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      alert('Seu navegador não suporta manter a tela ligada automaticamente.');
      return;
    }

    if (isWakeLockActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  useEffect(() => {
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWakeLockActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
    };
  }, []);

  // Modo Palco: Modo Foco / Tela Cheia
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const toggleFocusMode = async () => {
    const nextMode = !isFocusMode;
    setIsFocusMode(nextMode);

    try {
      if (nextMode) {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // Fallback silencioso
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFocusMode]);

  // Estrutura da Música (Chips de Seções)
  const sections = useMemo(() => {
    return parseSongSections(song?.lyrics);
  }, [song?.lyrics]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add(styles.highlightSection);
      setTimeout(() => {
        el.classList.remove(styles.highlightSection);
      }, 1600);
    }
  };

  // Helper para obter o container de rolagem atual (modo normal ou palco)
  const getScrollContainer = (): HTMLElement | Window => {
    if (isFocusMode && containerRef.current) {
      return containerRef.current;
    }
    let cur = containerRef.current?.parentElement;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      const style = window.getComputedStyle(cur);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return cur;
      }
      cur = cur.parentElement;
    }
    return window;
  };

  // Auto-scroll loop contínuo e suave
  useEffect(() => {
    if (!isAutoScrolling) {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
        scrollAnimRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    const speedMultiplier = SPEED_PRESETS[speedIndex];

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Velocidade base: ~28px por segundo multiplicado pelo multiplicador de velocidade
      const px = 28 * speedMultiplier * dt;
      scrollAccRef.current += px;

      if (scrollAccRef.current >= 1) {
        const toMove = Math.floor(scrollAccRef.current);
        scrollAccRef.current -= toMove;

        const target = getScrollContainer();
        if (target === window) {
          window.scrollBy({ top: toMove, behavior: 'auto' });
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 8) {
            setIsAutoScrolling(false);
            return;
          }
        } else {
          const el = target as HTMLElement;
          el.scrollTop += toMove;
          if (el.scrollHeight - el.scrollTop - el.clientHeight <= 4) {
            setIsAutoScrolling(false);
            return;
          }
        }
      }

      scrollAnimRef.current = requestAnimationFrame(step);
    };

    scrollAnimRef.current = requestAnimationFrame(step);

    return () => {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
        scrollAnimRef.current = null;
      }
    };
  }, [isAutoScrolling, speedIndex, isFocusMode]);

  const [currentSetlist, setCurrentSetlist] = useState<LocalSetlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);


  useEffect(() => {
    loadData();
    if (setlistId) {
      loadSetlistInfo(setlistId);
    } else {
      setCurrentSetlist(null);
      setCurrentIndex(-1);
    }
  }, [id, setlistId]);

  const loadSetlistInfo = async (sId: string) => {
    try {
      const setlists = await getOfflineSetlists();
      const found = setlists.find(s => s.id === sId);
      if (found) {
        setCurrentSetlist(found);
        const idx = found.songIds.indexOf(id || '');
        setCurrentIndex(idx);
      }
    } catch (err) {
      console.error('Error loading setlist info:', err);
    }
  };

  const goToSetlistSong = (targetIndex: number) => {
    if (!currentSetlist || targetIndex < 0 || targetIndex >= currentSetlist.songIds.length) return;
    const targetSongId = currentSetlist.songIds[targetIndex];
    navigate(`/song/${targetSongId}?setlistId=${currentSetlist.id}`);
  };

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);

      // Tentar buscar offline primeiro
      const offlineSongs = await getOfflineSongs();
      const offlineSong = offlineSongs.find(s => s.id === id);

      if (offlineSong) {
        setIsOffline(true);
        setSong(offlineSong as unknown as Song);
        if (offlineSong.chordId) {
          const offlineChords = await getOfflineChords();
          const offlineChord = offlineChords.find(c => c.id === offlineSong.chordId);
          setChord(offlineChord || null);
        }
      } else {
        // Se não tiver offline, busca na API
        setIsOffline(false);
        const songsData = await apiFetch('/songs');
        const songData = songsData.find((s: Song) => s.id === id);
        if (songData) {
          setSong(songData);
          if (songData.chordId) {
            const chordsData = await apiFetch('/chords');
            const chordData = chordsData.find((c: Chord) => c.id === songData.chordId);
            setChord(chordData || null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading song data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentSetlist) {
      navigate(`/setlists/${currentSetlist.id}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return <div className={styles.emptyState}>Carregando...</div>;
  }

  if (!song) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Voltar">
            <ArrowLeft size={24} />
          </button>
          <h2>Música não encontrada</h2>
        </header>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`${styles.container} ${isFocusMode ? styles.focusContainer : ''}`}
    >
      {!isFocusMode && (
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack} aria-label="Voltar">
            <ArrowLeft size={24} />
          </button>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>
              {song.title}
              {isOffline && <span className={styles.badge}>Offline</span>}
            </h1>
            <p className={styles.subtitle}>{song.artist} {song.bpm ? `• BPM: ${song.bpm}` : ''}</p>
          </div>
        </header>
      )}

      {!isFocusMode && currentSetlist && (
        <div className={styles.setlistBar}>
          <div className={styles.setlistInfo}>
            <span className={styles.setlistName}>Ordem: {currentSetlist.name}</span>
            <span className={styles.setlistCounter}>
              Música {currentIndex >= 0 ? currentIndex + 1 : '?'} de {currentSetlist.songIds.length}
            </span>
          </div>

          <div className={styles.setlistNavBtns}>
            <button
              className={styles.setlistNavBtn}
              onClick={() => goToSetlistSong(currentIndex - 1)}
              disabled={currentIndex <= 0}
              title="Música anterior da ordem"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              className={styles.setlistNavBtn}
              onClick={() => goToSetlistSong(currentIndex + 1)}
              disabled={currentIndex >= currentSetlist.songIds.length - 1}
              title="Próxima música da ordem"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <section className={`${styles.card} ${isFocusMode ? styles.focusCard : ''}`}>
        <div className={styles.chordHeader}>
          <div>
            <h2 className={styles.chordTitle}>
              {isFocusMode ? `${song.title} • ` : ''}
              {chord ? transposeChord(chord.name, transposeSteps) : 'Sem Acorde'}
            </h2>
            <span className={styles.chordTonality}>
              {chord ? `Tom: ${transposeChord(chord.tonality, transposeSteps)}` : ''}
              {song.bpm ? ` • ${song.bpm} BPM` : ''}
            </span>
          </div>

          <div className={styles.actionsArea}>
            {isFocusMode && currentSetlist && (
              <div className={styles.focusSetlistNav} title="Navegação da Ordem">
                <button
                  className={styles.focusNavBtn}
                  onClick={() => goToSetlistSong(currentIndex - 1)}
                  disabled={currentIndex <= 0}
                  title="Música anterior"
                  aria-label="Música anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.focusCounter}>
                  {currentIndex >= 0 ? currentIndex + 1 : '?'}/{currentSetlist.songIds.length}
                </span>
                <button
                  className={styles.focusNavBtn}
                  onClick={() => goToSetlistSong(currentIndex + 1)}
                  disabled={currentIndex >= currentSetlist.songIds.length - 1}
                  title="Próxima música"
                  aria-label="Próxima música"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Controle de Rolagem Automática (Auto-scroll) */}
            <div className={styles.autoScrollControls} title="Rolagem automática da cifra">
              <button
                type="button"
                className={`${styles.autoScrollPlayBtn} ${isAutoScrolling ? styles.autoScrollActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAutoScrolling(p => !p);
                }}
                aria-label={isAutoScrolling ? "Parar rolagem" : "Iniciar rolagem automática"}
                title={isAutoScrolling ? "Parar auto-scroll (Stop)" : "Iniciar auto-scroll"}
              >
                {isAutoScrolling ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
                <span className={styles.autoScrollLabel}>{isAutoScrolling ? 'Parar' : 'Rolar'}</span>
              </button>
              <button
                type="button"
                className={styles.speedBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeedDown();
                }}
                disabled={speedIndex <= 0}
                aria-label="Diminuir velocidade"
                title="Diminuir velocidade do scroll"
              >
                <Minus size={13} />
              </button>
              <span className={styles.speedValue} title="Multiplicador de velocidade">
                {SPEED_PRESETS[speedIndex]}x
              </span>
              <button
                type="button"
                className={styles.speedBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeedUp();
                }}
                disabled={speedIndex >= SPEED_PRESETS.length - 1}
                aria-label="Aumentar velocidade"
                title="Aumentar velocidade do scroll"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className={styles.zoomControls} title="Ajustar tamanho da fonte">
              <button
                className={styles.zoomBtn}
                onClick={handleZoomOut}
                disabled={fontSize <= 10}
                aria-label="Diminuir tamanho da fonte"
                title="Diminuir texto (Zoom -)"
              >
                <ZoomOut size={16} />
              </button>
              <button
                className={styles.zoomValue}
                onClick={handleResetZoom}
                aria-label="Restaurar tamanho padrão"
                title="Clique para restaurar padrão (14px)"
              >
                {fontSize}px
              </button>
              <button
                className={styles.zoomBtn}
                onClick={handleZoomIn}
                disabled={fontSize >= 32}
                aria-label="Aumentar tamanho da fonte"
                title="Aumentar texto (Zoom +)"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <div className={styles.transposeControls} title="Transposição de tom">
              <button className={styles.transposeBtn} onClick={() => setTransposeSteps(p => p - 1)} aria-label="Descer meio tom" title="Descer meio tom (-1)">
                <Minus size={16} />
              </button>
              <span className={styles.transposeValue}>
                {transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps}
              </span>
              <button className={styles.transposeBtn} onClick={() => setTransposeSteps(p => p + 1)} aria-label="Subir meio tom" title="Subir meio tom (+1)">
                <Plus size={16} />
              </button>
            </div>

            <button
              className={styles.iconBtn}
              onClick={() => setShowChords(!showChords)}
              title={showChords ? "Ocultar Notas" : "Mostrar Notas"}
              aria-label="Alternar Notas"
            >
              {showChords ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            <button
              className={`${styles.iconBtn} ${isWakeLockActive ? styles.wakeLockActive : ''}`}
              onClick={toggleWakeLock}
              title={isWakeLockActive ? "Tela sempre acesa (Ativo)" : "Manter tela acesa (Inativo)"}
              aria-label="Manter tela acesa"
            >
              {isWakeLockActive ? <Sun size={20} /> : <SunDim size={20} />}
            </button>

            <button
              className={`${styles.iconBtn} ${isFocusMode ? styles.focusActive : ''}`}
              onClick={toggleFocusMode}
              title={isFocusMode ? "Sair do Modo Palco" : "Modo Palco (Tela Cheia)"}
              aria-label="Modo Palco"
            >
              {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {/* Chips de Estrutura da Música (Intro, Verso, Refrão, Ponte, etc.) */}
        {sections.length > 0 && (
          <div className={styles.structureBar}>
            <span className={styles.structureTitle}>Estrutura:</span>
            <div className={styles.structureChipsScroll}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`${styles.structureChip} ${styles[`chip_${section.type}`] || ''}`}
                  onClick={() => scrollToSection(section.id)}
                  title={`Ir para ${section.name}`}
                >
                  <span className={styles.chipBullet}></span>
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.instructionsArea} style={{ fontSize: `${fontSize}px` }}>
          {chord && chord.instructions && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <strong>Instruções do Acorde Principal:</strong><br />
              <div dangerouslySetInnerHTML={{ __html: transposeLyrics(chord.instructions, transposeSteps, true, showChords) }} />
            </div>
          )}
          {song.lyrics ? (
            <div dangerouslySetInnerHTML={{ __html: transposeLyrics(song.lyrics, transposeSteps, true, showChords) }} />
          ) : (
            'Nenhuma letra ou cifra cadastrada para esta música.'
          )}
        </div>
      </section>

      {/* Painel Flutuante / Drawer de Ferramentas de Palco */}
      <SongToolsDrawer
        isAutoScrolling={isAutoScrolling}
        onToggleAutoScroll={() => setIsAutoScrolling(p => !p)}
        speedIndex={speedIndex}
        speedPresets={SPEED_PRESETS}
        onSpeedDown={handleSpeedDown}
        onSpeedUp={handleSpeedUp}
        onSelectSpeed={(idx) => {
          setSpeedIndex(idx);
          localStorage.setItem('cifras_scroll_speed', String(idx));
        }}
        isFocusMode={isFocusMode}
        fontSize={fontSize}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        transposeSteps={transposeSteps}
        onTransposeUp={() => setTransposeSteps(p => p + 1)}
        onTransposeDown={() => setTransposeSteps(p => p - 1)}
      />
    </div>
  );
};
