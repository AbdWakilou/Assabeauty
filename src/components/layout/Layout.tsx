// ============================================================
// LAYOUT PRINCIPAL — SalonPro (app)
// ============================================================
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { authService, salonService } from '../../services/api';
import { joursEssaiRestants } from '../../utils/helpers';
import type { Salon } from '../../types';

// ── Vérifie si l'abonnement est actif ──────────────────────
function isAbonnementActif(salon: Salon): boolean {
  // Si un champ abonnementExpiry existe et est dans le futur → abonné
  if ((salon as Salon & { abonnementExpiry?: string }).abonnementExpiry) {
    const expiry = new Date((salon as Salon & { abonnementExpiry?: string }).abonnementExpiry!);
    if (expiry > new Date()) return true;
  }
  // Sinon, vérifier le trial
  const jours = joursEssaiRestants(salon.trialStartDate, salon.trialDays);
  return jours > 0;
}

export function Layout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [salon, setSalon]                       = useState<Salon | null>(null);
  const [joursRestants, setJoursRestants]       = useState<number | null>(null);
  const [isDesktop, setIsDesktop]               = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    salonService.get().then((s) => {
      if (!s) return;
      setSalon(s);
      const jours = joursEssaiRestants(s.trialStartDate, s.trialDays);
      setJoursRestants(jours);

      // ── BLOCAGE ABONNEMENT (côté client — sans webhook Firebase) ──
      // Pas besoin de Cloud Functions / Blaze :
      // On lit trialStartDate + trialDays + abonnementExpiry depuis Firestore
      // et on compare côté client.
      if (!isAbonnementActif(s)) {
        navigate('/paywall', { replace: true });
      }
    });

    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [navigate]);

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  const trialBannerColor = joursRestants !== null
    ? joursRestants <= 2
      ? 'bg-red-500/15 border-red-500/30 text-red-400'
      : joursRestants <= 5
        ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
        : 'bg-green-500/15 border-green-500/30 text-green-400'
    : '';

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* Sidebar Desktop */}
      {isDesktop && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && !isDesktop && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full z-50 w-60"
            >
              <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <div
        className="transition-all duration-300 min-h-screen flex flex-col"
        style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-sm">
          {/* Bandeau essai — visible seulement si trial actif et < 14 jours */}
          {joursRestants !== null && joursRestants > 0 && joursRestants <= 14 && (
            <div className={`border-b px-4 py-2 text-center text-xs font-medium ${trialBannerColor}`}>
              ⏳ Période d'essai : <strong>{joursRestants} jour{joursRestants > 1 ? 's' : ''} restant{joursRestants > 1 ? 's' : ''}</strong> — plan {salon?.plan}
              {joursRestants <= 5 && (
                <button
                  onClick={() => navigate('/paywall')}
                  className="ml-2 underline hover:opacity-80 transition-opacity"
                >
                  Souscrire →
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 px-4 h-14">
            {!isDesktop && (
              <button
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
              </button>
            )}
            {!isDesktop && (
              <div className="flex items-center gap-2">
                <span className="text-[#29B6F6] font-bold">✦</span>
                <span className="text-white font-bold text-base">SalonPro</span>
              </div>
            )}

            <div className="flex-1" />

            <button className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors relative">
              <Bell size={18} className="text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#29B6F6] rounded-full" />
            </button>

            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#29B6F6' }}
              onClick={() => navigate('/app/parametres')}
              title="Paramètres"
            >
              S
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
