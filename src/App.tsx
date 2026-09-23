// ============================================================
// APP.TSX — ASBeauty — Point d'entrée routing
// ============================================================
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authService } from './services/api';
import { Layout } from './components/layout/Layout';
import { PWAFloatingButton, PWAUpdateBanner, PWAOfflineToast, PWAInstallBanner } from './components/ui/PWAInstallBanner';

const Landing      = lazy(() => import('./pages/Landing'));
const Login        = lazy(() => import('./pages/Login'));
const Onboarding   = lazy(() => import('./pages/Onboarding'));
const Paywall      = lazy(() => import('./pages/Paywall'));
const Affilies     = lazy(() => import('./pages/Affilies'));
const Admin        = lazy(() => import('./pages/Admin'));
const Dashboard    = lazy(() => import('./pages/app/Dashboard'));
const Reservations = lazy(() => import('./pages/app/Reservations'));
const Clients      = lazy(() => import('./pages/app/Clients'));
const Caisse       = lazy(() => import('./pages/app/Caisse'));
const Factures     = lazy(() => import('./pages/app/Factures'));
const Services     = lazy(() => import('./pages/app/Services'));
const Statistiques = lazy(() => import('./pages/app/Statistiques'));
const Parametres   = lazy(() => import('./pages/app/Parametres'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="text-center space-y-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ backgroundColor: '#29B6F6', animation: 'pulse 2s infinite' }}
        >
          <span className="text-white font-bold text-2xl">✦</span>
        </div>
        <p className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Chargement...</p>
      </div>
    </div>
  );
}

// ── Guard auth seule (les routes /app/*) ───────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// ── Guard abonnement (bloque si trial expiré et pas abonné) ─
// Ce composant est utilisé dans Layout via useEffect + navigate
// Voir Layout.tsx pour l'implémentation

export default function App() {
  return (
    <BrowserRouter>
      {/* ── PWA — Bandeaux & boutons ───────────────────── */}
      <PWAUpdateBanner />
      <PWAOfflineToast />
      <PWAInstallBanner />
      <PWAFloatingButton />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#29B6F6', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 5000 },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Publiques ──────────────────────────────── */}
          <Route path="/"            element={<Landing />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/onboarding"  element={<Onboarding />} />
          <Route path="/paywall"     element={<Paywall />} />
          <Route path="/affilies"    element={<Affilies />} />
          <Route path="/admin"       element={<Admin />} />

          {/* ── Privées (/app/*) ───────────────────────── */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Layout />   {/* Layout vérifie aussi l'abonnement */}
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="clients"      element={<Clients />} />
            <Route path="caisse"       element={<Caisse />} />
            <Route path="factures"     element={<Factures />} />
            <Route path="services"     element={<Services />} />
            <Route path="statistiques" element={<Statistiques />} />
            <Route path="parametres"   element={<Parametres />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
