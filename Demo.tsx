// ============================================================
// DEMO ENTRY — SalonPro
// ─────────────────────────────────────────────────────────────
// Route /demo :
//  1. Active le mode démo (flag module en mémoire)
//  2. Redirige vers /app/dashboard
// Le PrivateRoute voit isAuthenticated() → true grâce au flag.
// Toutes les données sont fictives, rien n'est persisté.
// ============================================================
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { enterDemoMode } from '../demo/demoMode';

export default function Demo() {
  const navigate = useNavigate();

  useEffect(() => {
    enterDemoMode();
    navigate('/app/dashboard', { replace: true });
  }, [navigate]);

  // Écran de transition (quelques ms avant le redirect)
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0a0a0a', fontFamily: 'Poppins, sans-serif' }}
    >
      <div className="text-center space-y-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: '#F59E0B', animation: 'pulse 1.5s infinite' }}
        >
          <span className="text-white font-bold text-2xl">🎭</span>
        </div>
        <p className="text-gray-400 text-sm">Chargement de la démo…</p>
        <p className="text-gray-600 text-xs">Données fictives — aucune inscription requise</p>
      </div>
    </div>
  );
}
