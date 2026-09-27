// ============================================================
// usePWA.ts — Hook pour Install Prompt + Share + SW Update
// ============================================================
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  install: () => Promise<boolean>;
  share: (data?: ShareData) => Promise<boolean>;
  dismissInstall: () => void;
  applyUpdate: () => void;
}

const APP_URL = window.location.origin;
const DEFAULT_SHARE: ShareData = {
  title: 'ASBeauty — Gestion de Rendez-vous',
  text: 'Gérez votre salon, vos clients et vos rendez-vous facilement avec ASBeauty.',
  url: APP_URL,
};

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Détecter iOS
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Détecter si déjà installée (mode standalone)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  const isInstalled = isStandalone;

  // ── Écouter beforeinstallprompt (Android/Desktop Chrome) ──
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Sur iOS, montrer le prompt manuel si pas encore installée
    if (isIOS && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) setIsInstallable(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isIOS, isStandalone]);

  // ── Détecter quand l'app est installée ────────────────────
  useEffect(() => {
    const handler = () => setIsInstallable(false);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  // ── Statut réseau ──────────────────────────────────────────
  useEffect(() => {
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // ── Enregistrer le Service Worker ─────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      // Vérifier mise à jour immédiatement
      reg.update();

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setHasUpdate(true);
          }
        });
      });
    }).catch(console.error);

    // Recharger quand le SW est activé après skipWaiting
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  // ── Installer l'app ────────────────────────────────────────
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  // ── Partager le lien ───────────────────────────────────────
  const share = useCallback(async (data: ShareData = DEFAULT_SHARE): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch {
        return false;
      }
    }
    // Fallback : copier dans le presse-papier
    try {
      await navigator.clipboard.writeText(data.url ?? APP_URL);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Ignorer le prompt ──────────────────────────────────────
  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
    sessionStorage.setItem('pwa-ios-dismissed', '1');
  }, []);

  // ── Appliquer la mise à jour ───────────────────────────────
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  return {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    isIOS,
    isStandalone,
    install,
    share,
    dismissInstall,
    applyUpdate,
  };
}
