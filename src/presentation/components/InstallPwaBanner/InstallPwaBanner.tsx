import React, { useState } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import styles from './InstallPwaBanner.module.css';

export const InstallPwaBanner: React.FC = () => {
  const { isInstallable, showIOSModal, setShowIOSModal, installApp } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    }
  };

  return (
    <>
      {isInstallable && !isDismissed && (
        <div className={styles.bannerContainer}>
          <div className={styles.leftArea}>
            <img src="/pwa-192x192.png" alt="Cifras Adorar" className={styles.appIcon} />
            <div className={styles.textGroup}>
              <span className={styles.title}>Instalar Cifras Adorar</span>
              <span className={styles.subtitle}>Acesso rápido e cifras offline no palco</span>
            </div>
          </div>

          <div className={styles.rightArea}>
            <button className={styles.installBtn} onClick={installApp} aria-label="Instalar aplicativo">
              <Download size={14} />
              <span>Instalar</span>
            </button>
            <button className={styles.dismissBtn} onClick={handleDismiss} title="Fechar aviso" aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal explicativo para iPhone / Safari */}
      {showIOSModal && (
        <div className={styles.modalOverlay} onClick={() => setShowIOSModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Smartphone size={20} color="var(--primary-color)" />
                <span>Instalar no iPhone</span>
              </div>
              <button className={styles.dismissBtn} onClick={() => setShowIOSModal(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalStep}>
              <span className={styles.stepNumber}>1</span>
              <div>
                Toque no botão de <strong>Compartilhar</strong> do Safari (<Share size={14} style={{ verticalAlign: 'middle' }} />) na barra inferior do celular.
              </div>
            </div>

            <div className={styles.modalStep}>
              <span className={styles.stepNumber}>2</span>
              <div>
                Role as opções para baixo e selecione <strong>Adicionar à Tela de Início</strong> (<PlusSquare size={14} style={{ verticalAlign: 'middle' }} />).
              </div>
            </div>

            <div className={styles.modalStep}>
              <span className={styles.stepNumber}>3</span>
              <div>
                Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! O app estará na sua tela inicial.
              </div>
            </div>

            <button className={styles.closeModalBtn} onClick={() => setShowIOSModal(false)}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
