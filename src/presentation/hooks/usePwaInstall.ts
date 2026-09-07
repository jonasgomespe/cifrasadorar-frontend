import { useState, useEffect } from 'react';

// Variável global para reter o evento de instalação mesmo se a navegação ocorrer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalDeferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export const usePwaInstall = () => {
  const isBrowser = typeof window !== 'undefined';
  const isStandalone = isBrowser && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );

  const isIOS = isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

  const [isInstalled, setIsInstalled] = useState<boolean>(isStandalone);
  const [hasPrompt, setHasPrompt] = useState<boolean>(Boolean(globalDeferredPrompt));
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    const handlePromptReady = () => setHasPrompt(true);
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setHasPrompt(false);
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('pwa-installed', handleAppInstalled);

    if (globalDeferredPrompt) {
      setHasPrompt(true);
    }

    return () => {
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (globalDeferredPrompt) {
      try {
        globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setHasPrompt(false);
          globalDeferredPrompt = null;
        }
      } catch (err) {
        console.warn('Erro no prompt de instalação PWA:', err);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return {
    isInstallable: !isInstalled && (hasPrompt || isIOS),
    isInstalled,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    installApp,
  };
};
