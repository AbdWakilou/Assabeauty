// ============================================================
// PWAInstallBanner.tsx — Bandeau install + share + update
// ============================================================
import { useState } from 'react';
import { Download, Share2, X, RefreshCw, Wifi, Smartphone, ArrowDownToLine } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

/* ── Bouton flottant persistant (Install + Share) ─────────── */
export function PWAFloatingButton() {
  const { isInstallable, isInstalled, isIOS, share, install, dismissInstall } = usePWA();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const ok = await share();
    if (ok && !navigator.share) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  const handleInstall = async () => {
    await install();
    setShowMenu(false);
  };

  // Si déjà installée en standalone, on affiche juste le bouton Share
  if (isInstalled) {
    return (
      <button
        onClick={handleShare}
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all"
        style={{ background: 'rgba(41,182,246,0.15)', border: '1px solid rgba(41,182,246,0.3)', color: '#29B6F6', backdropFilter: 'blur(12px)' }}
        title="Partager l'app"
      >
        <Share2 size={16} />
        {copied ? 'Lien copié !' : 'Partager'}
      </button>
    );
  }

  return (
    <>
      {/* Bouton principal */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">

        {/* Menu déroulant */}
        {showMenu && (
          <div
            className="flex flex-col gap-2 p-3 rounded-2xl shadow-xl"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' }}
          >
            {/* Installer */}
            {isInstallable && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                style={{ background: '#29B6F6', color: '#000' }}
              >
                <ArrowDownToLine size={16} />
                <span>Installer l'app</span>
              </button>
            )}

            {/* Guide iOS */}
            {isIOS && isInstallable && (
              <div
                className="px-4 py-3 rounded-xl text-xs"
                style={{ background: 'rgba(41,182,246,0.1)', color: '#888', lineHeight: 1.5 }}
              >
                <span style={{ color: '#29B6F6', fontWeight: 600 }}>iPhone/iPad :</span>
                <br />
                Appuyez sur <strong>☐↑</strong> puis « Sur l'écran d'accueil »
              </div>
            )}

            {/* Partager */}
            <button
              onClick={handleShare}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc' }}
            >
              <Share2 size={16} />
              <span>{copied ? '✓ Lien copié !' : 'Partager le lien'}</span>
            </button>

            {/* Fermer */}
            <button
              onClick={() => { setShowMenu(false); dismissInstall(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left"
              style={{ color: '#555' }}
            >
              <X size={14} />
              <span>Ne plus afficher</span>
            </button>
          </div>
        )}

        {/* Bouton principal toggle */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold transition-all"
          style={{
            background: showMenu ? '#1a1a1a' : '#29B6F6',
            color: showMenu ? '#29B6F6' : '#000',
            border: '1px solid rgba(41,182,246,0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {showMenu ? <X size={16} /> : isInstallable ? <Download size={16} /> : <Share2 size={16} />}
          {showMenu ? 'Fermer' : isInstallable ? 'Installer' : 'Partager'}
        </button>
      </div>
    </>
  );
}

/* ── Bandeau mise à jour disponible ──────────────────────── */
export function PWAUpdateBanner() {
  const { hasUpdate, applyUpdate } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 px-4 py-3"
      style={{ background: '#1e3a4f', borderBottom: '1px solid rgba(41,182,246,0.3)', color: '#fff' }}
    >
      <div className="flex items-center gap-2 text-sm">
        <RefreshCw size={15} style={{ color: '#29B6F6' }} />
        <span>Nouvelle version disponible</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={applyUpdate}
          className="px-3 py-1 rounded-lg text-xs font-semibold"
          style={{ background: '#29B6F6', color: '#000' }}
        >
          Mettre à jour
        </button>
        <button onClick={() => setDismissed(true)} style={{ color: '#555' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Toast hors-ligne ────────────────────────────────────── */
export function PWAOfflineToast() {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[90] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
      style={{ background: '#2a1f1f', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px' }}
    >
      <Wifi size={15} />
      <span>Vous êtes hors ligne — certaines données peuvent être indisponibles.</span>
    </div>
  );
}

/* ── Bannière d'installation persistante (première visite) ── */
export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, install, dismissInstall } = usePWA();
  const [visible, setVisible] = useState(true);

  if (!visible || isInstalled || !isInstallable) return null;

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    dismissInstall();
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[80] rounded-2xl shadow-2xl p-4"
      style={{ background: '#111', border: '1px solid rgba(41,182,246,0.25)', maxWidth: '420px', margin: '0 auto' }}
    >
      <div className="flex items-start gap-3">
        <img src="/icons/icon-72x72.png" alt="ASBeauty" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">Installer ASBeauty</p>
          <p className="text-xs mt-0.5" style={{ color: '#666' }}>
            {isIOS
              ? 'Appuyez sur ☐↑ puis « Sur l\'écran d\'accueil »'
              : 'Accédez à l\'app directement depuis votre écran d\'accueil'}
          </p>
        </div>
        <button onClick={handleDismiss} style={{ color: '#444', flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      {!isIOS && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#29B6F6', color: '#000' }}
          >
            <Smartphone size={15} />
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#888' }}
          >
            Plus tard
          </button>
        </div>
      )}
    </div>
  );
}
