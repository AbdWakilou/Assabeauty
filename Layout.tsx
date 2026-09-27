// ============================================================
// LAYOUT PRINCIPAL — SalonPro (app)
// ============================================================
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { authService, salonService } from '../../services/api';
import { isDemo } from '../../demo/demoMode';
import { DemoBanner } from '../ui/DemoBanner';
import type { Salon } from '../../types';

// ── Vérifie si un abonnement payant est actif ───────────────
function isAbonnementActif(salon: Salon): boolean {
  const s = salon as Salon & { abonnementExpiry?: string };
  if (!s.abonnementExpiry) return false;
  return new Date(s.abonnementExpiry) > new Date();
}

export function Layout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [salon, setSalon]                       = useState<Salon | null>(null);
  const [isDesktop, setIsDesktop]               = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    salonService.get().then((s) => {
      if (!s) return;
      setSalon(s);

      // ── BLOCAGE ABONNEMENT ──────────────────────────────────
      // Redirige vers /paywall si aucun abonnement actif.
      // En mode démo : jamais de redirection paywall.
      if (!isAbonnementActif(s) && !isDemo()) {
        navigate('/paywall', { replace: true });
      }
    });

    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [navigate]);

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

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
          {/* Bandeau mode démo */}
          {isDemo() && <DemoBanner />}

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
