import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, 
  Pause, 
  Minus, 
  Plus, 
  Sliders, 
  ChevronsDown, 
  Music, 
  Sparkles,
  ChevronDown,
  Type
} from 'lucide-react';
import styles from './SongToolsDrawer.module.css';

export interface SongToolsDrawerProps {
  isAutoScrolling: boolean;
  onToggleAutoScroll: () => void;
  speedIndex: number;
  speedPresets: number[];
  onSpeedDown: () => void;
  onSpeedUp: () => void;
  onSelectSpeed: (index: number) => void;
  isFocusMode: boolean;
  // Integrações opcionais de Tom e Zoom
  fontSize?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  transposeSteps?: number;
  onTransposeUp?: () => void;
  onTransposeDown?: () => void;
}

type TabType = 'scroll' | 'tone' | 'more';

interface ToolTab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const TABS: ToolTab[] = [
  { id: 'scroll', label: 'Auto-Scroll', icon: ChevronsDown },
  { id: 'tone', label: 'Tom & Zoom', icon: Sliders },
  { id: 'more', label: 'Mais Menus', icon: Sparkles }
];

export const SongToolsDrawer: React.FC<SongToolsDrawerProps> = ({
  isAutoScrolling,
  onToggleAutoScroll,
  speedIndex,
  speedPresets,
  onSpeedDown,
  onSpeedUp,
  onSelectSpeed,
  isFocusMode,
  fontSize,
  onZoomIn,
  onZoomOut,
  transposeSteps,
  onTransposeUp,
  onTransposeDown
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('scroll');

  const currentSpeed = speedPresets[speedIndex] ?? 1.0;

  const handleScrollToggle = () => {
    // Quando o usuário clica em iniciar o auto-scroll, o sidebar esconde
    // e só reaparece quando clicar novamente no botão de ferramentas
    if (!isAutoScrolling) {
      setIsOpen(false);
    }
    onToggleAutoScroll();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Botão Gatilho Flutuante: Fixo no canto inferior direito, fora da área das cifras */}
      {!isOpen && (
        <button
          type="button"
          className={`${styles.triggerBtn} ${isFocusMode ? styles.triggerFocus : ''} ${isAutoScrolling ? styles.triggerActive : ''}`}
          onClick={() => setIsOpen(true)}
          title="Abrir ferramentas de palco e auto-scroll"
          aria-label="Abrir painel de ferramentas"
        >
          {isAutoScrolling ? (
            <>
              <span className={styles.pulseDot} />
              <span className={styles.triggerText}>Ferramentas ({currentSpeed}x)</span>
              <Sliders size={16} />
            </>
          ) : (
            <>
              <Sliders size={16} />
              <span className={styles.triggerText}>Ferramentas</span>
            </>
          )}
        </button>
      )}

      {/* Backdrop e Painel Drawer: SOMENTE aparecem quando isOpen === true */}
      {isOpen && (
        <>
          {/* Backdrop de fundo escuro para foco e fechamento */}
          <div 
            className={styles.backdrop} 
            onClick={() => setIsOpen(false)} 
            aria-hidden="true"
          />

          {/* Painel Drawer Retrátil Fixo na Parte Inferior da Tela */}
          <div 
            className={`${styles.drawerContainer} ${isFocusMode ? styles.drawerFocus : ''}`}
            aria-modal="true"
            role="dialog"
          >
            {/* Barra superior de arraste / toque para fechar */}
            <div className={styles.drawerHandleBar} onClick={() => setIsOpen(false)}>
              <div className={styles.handlePill} />
            </div>

            {/* Cabeçalho do Drawer */}
            <div className={styles.drawerHeader}>
              <div className={styles.titleWrapper}>
                <Sliders size={18} color="var(--primary-color)" />
                <h3>Ferramentas da Música</h3>
              </div>
              <button 
                type="button" 
                className={styles.closeBtn} 
                onClick={() => setIsOpen(false)}
                title="Fechar painel"
                aria-label="Fechar painel"
              >
                <ChevronDown size={22} />
              </button>
            </div>

            {/* Barra de Abas (Extensível para menus futuros) */}
            <div className={styles.tabsBar}>
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conteúdo da Aba Ativa com Animação Fluida */}
            <div className={styles.tabContent}>
              {/* =========================================
                  ABA 1: AUTO-SCROLL
                 ========================================= */}
              {activeTab === 'scroll' && (
                <div key="tab-scroll" className={`${styles.scrollSection} ${styles.tabPaneAnimation}`}>
                  {/* Botão Principal Play / Stop */}
                  <button
                    type="button"
                    className={`${styles.mainScrollToggleBtn} ${isAutoScrolling ? styles.btnRunning : ''}`}
                    onClick={handleScrollToggle}
                  >
                    {isAutoScrolling ? (
                      <>
                        <Pause size={20} fill="currentColor" />
                        <span>PARAR AUTO-SCROLL</span>
                      </>
                    ) : (
                      <>
                        <Play size={20} fill="currentColor" />
                        <span>INICIAR AUTO-SCROLL</span>
                      </>
                    )}
                  </button>

                  {/* Ajuste de Velocidade */}
                  <div className={styles.speedControlRow}>
                    <div className={styles.speedLabelArea}>
                      <span className={styles.fieldLabel}>Velocidade da Rolagem:</span>
                      <span className={styles.speedBadge}>{currentSpeed}x</span>
                    </div>

                    <div className={styles.stepperGroup}>
                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={onSpeedDown}
                        disabled={speedIndex <= 0}
                        title="Diminuir velocidade"
                      >
                        <Minus size={16} />
                      </button>

                      <button
                        type="button"
                        className={styles.stepperBtn}
                        onClick={onSpeedUp}
                        disabled={speedIndex >= speedPresets.length - 1}
                        title="Aumentar velocidade"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Chips de Velocidade Rápida */}
                  <div className={styles.presetsChips}>
                    {speedPresets.map((speed, idx) => (
                      <button
                        key={speed}
                        type="button"
                        className={`${styles.presetChip} ${speedIndex === idx ? styles.presetChipActive : ''}`}
                        onClick={() => onSelectSpeed(idx)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Dica de usabilidade */}
                  <p className={styles.helperTip}>
                    💡 <strong>Dica:</strong> Você pode mover a barra de rolagem ou a tela manualmente a qualquer momento; a rolagem continuará normalmente.
                  </p>
                </div>
              )}

              {/* =========================================
                  ABA 2: TOM & ZOOM
                 ========================================= */}
              {activeTab === 'tone' && (
                <div key="tab-tone" className={`${styles.toneSection} ${styles.tabPaneAnimation}`}>
                  {onTransposeUp && onTransposeDown && (
                    <div className={styles.toolRow}>
                      <div className={styles.toolInfo}>
                        <Music size={18} color="var(--primary-color)" />
                        <div>
                          <strong>Transposição (Tom)</strong>
                          <span className={styles.toolSub}>{transposeSteps !== undefined && transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps || 0} semitons</span>
                        </div>
                      </div>
                      <div className={styles.stepperGroup}>
                        <button type="button" className={styles.stepperBtn} onClick={onTransposeDown} title="Descer meio tom">
                          <Minus size={16} />
                        </button>
                        <button type="button" className={styles.stepperBtn} onClick={onTransposeUp} title="Subir meio tom">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {onZoomIn && onZoomOut && fontSize !== undefined && (
                    <div className={styles.toolRow}>
                      <div className={styles.toolInfo}>
                        <Type size={18} color="var(--primary-color)" />
                        <div>
                          <strong>Tamanho da Fonte</strong>
                          <span className={styles.toolSub}>{fontSize}px</span>
                        </div>
                      </div>
                      <div className={styles.stepperGroup}>
                        <button type="button" className={styles.stepperBtn} onClick={onZoomOut} disabled={fontSize <= 10} title="Diminuir fonte">
                          <Minus size={16} />
                        </button>
                        <button type="button" className={styles.stepperBtn} onClick={onZoomIn} disabled={fontSize >= 32} title="Aumentar fonte">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================
                  ABA 3: MAIS RECURSOS (ESTRUTURA EXTENSÍVEL)
                 ========================================= */}
              {activeTab === 'more' && (
                <div key="tab-more" className={`${styles.moreSection} ${styles.tabPaneAnimation}`}>
                  <div className={styles.featurePreviewCard}>
                    <div className={styles.featureIcon}>⏱️</div>
                    <div className={styles.featureDetails}>
                      <strong>Metrônomo com BPM</strong>
                      <p>Cliques sonoros e visuais sincronizados com o BPM da música.</p>
                    </div>
                    <span className={styles.comingSoonBadge}>Em breve</span>
                  </div>

                  <div className={styles.featurePreviewCard}>
                    <div className={styles.featureIcon}>🎸</div>
                    <div className={styles.featureDetails}>
                      <strong>Dicionário de Acordes</strong>
                      <p>Desenhos visuais dos shapes para violão, teclado e guitarra.</p>
                    </div>
                    <span className={styles.comingSoonBadge}>Em breve</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
};
