// ============================================================
// SIDEBAR — SalonPro
// ============================================================
import type {} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, ShoppingBag,
  FileText, Settings, BarChart3, LogOut, ChevronLeft,
  ChevronRight, Scissors
} from 'lucide-react';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/app/reservations',  icon: Calendar,         label: 'Réservations' },
  { path: '/app/clients',       icon: Users,            label: 'Clients CRM' },
  { path: '/app/caisse',        icon: ShoppingBag,      label: 'Caisse' },
  { path: '/app/factures',      icon: FileText,         label: 'Factures' },
  { path: '/app/services',      icon: Scissors,         label: 'Services' },
  { path: '/app/statistiques',  icon: BarChart3,        label: 'Statistiques' },
  { path: '/app/parametres',    icon: Settings,         label: 'Paramètres' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    toast.success('À bientôt !');
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col border-r border-white/5 overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <span className="text-[#29B6F6] font-bold text-lg">✦</span>
              <span className="text-white font-bold text-base whitespace-nowrap">SalonPro</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
        >
          {collapsed
            ? <ChevronRight size={16} className="text-gray-400" />
            : <ChevronLeft size={16} className="text-gray-400" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative"
              style={{
                backgroundColor: isActive ? 'rgba(41,182,246,0.15)' : 'transparent',
                color: isActive ? '#29B6F6' : '#888',
              }}
            >
              <Icon
                size={20}
                className="shrink-0 transition-colors"
                style={{ color: isActive ? '#29B6F6' : '#666' }}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    style={{ color: isActive ? '#29B6F6' : '#888' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Indicateur actif */}
              {isActive && (
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full"
                  style={{ backgroundColor: '#29B6F6' }}
                />
              )}

              {/* Tooltip quand collapsed */}
              {collapsed && (
                <div className="absolute left-16 bg-[#1a1a1a] border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
