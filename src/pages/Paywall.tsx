// ============================================================
// PAGE PAYWALL — ASBeauty  (FedaPay via Cloudflare Worker YEA)
// ============================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, LogOut, CreditCard } from 'lucide-react';
import { authService } from '../services/api';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'essentiel',
    emoji: '🌱',
    nom: 'Essentiel',
    prix: 7_000,
    avantages: ["Jusqu'à 100 clients enregistrés", 'Caisse & facturation PDF', 'Réservations', 'Support standard'],
  },
  {
    id: 'professionnel',
    emoji: '💎',
    nom: 'Professionnel',
    prix: 12_000,
    highlight: true,
    avantages: ["Jusqu'à 3 salons / collaborateurs", 'Statistiques avancées', 'Programme fidélité', 'Export CSV', 'Support prioritaire'],
  },
  {
    id: 'reseau',
    emoji: '🏢',
    nom: 'Réseau',
    prix: 20_000,
    avantages: ['Multi-salons illimités', 'Tableau de bord global', 'Gestion équipe avancée', 'Support dédié'],
  },
];

// ✅ Endpoint ASBeauty sur le YEA backend multi-app
const WORKER_URL = 'https://yea-backend.wakilouboukari9.workers.dev/asbeauty/create-payment';

export default function Paywall() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // ── Récupère prénom/nom depuis displayName ou Firestore ──
  const resolveUserName = async (uid: string, displayName: string | null) => {
    let firstname = 'Client';
    let lastname = 'YEA';

    if (displayName) {
      const parts = displayName.trim().split(' ');
      firstname = parts[0] || 'Client';
      lastname = parts.slice(1).join(' ') || 'YEA';
    } else {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          firstname = data.firstname || data.prenom || 'Client';
          lastname  = data.lastname  || data.nom   || 'YEA';
        }
      } catch (e) {
        console.warn('[Paywall] Impossible de récupérer le nom depuis Firestore', e);
      }
    }

    return { firstname, lastname };
  };

  // ── Initie le paiement FedaPay via le Worker ──────────────
  const handlePayment = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');

      const { firstname, lastname } = await resolveUserName(currentUser.uid, currentUser.displayName);
      const affiliateId = localStorage.getItem('salonpro_ref_affilie') || 'direct';

      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan:        planId,
          userId:      currentUser.uid,
          email:       currentUser.email,
          phone:       currentUser.phoneNumber || '66000001',
          firstname,
          lastname,
          country:     'bj',
          affiliateId,
        }),
      });

      const json = await res.json() as { paymentUrl?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Erreur initialisation paiement');

      if (json.paymentUrl) {
        window.location.href = json.paymentUrl;
      } else {
        throw new Error('URL de paiement introuvable dans la réponse du serveur.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.';
      alert(msg);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0a0a0a', fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#29B6F6' }}
        >
          <span className="text-white font-bold text-2xl">✦</span>
        </div>
        <h1 className="text-white font-bold text-2xl mb-2">
          Votre période d'essai est terminée
        </h1>
        <p className="text-gray-400 text-sm max-w-md">
          Choisissez un plan et payez par Mobile Money (MTN / Moov).
          Activation immédiate après paiement.
        </p>
      </motion.div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-10">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl p-6 border flex flex-col ${
              plan.highlight
                ? 'border-[#29B6F6]/60 bg-[#111]'
                : 'border-white/10 bg-[#111]'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#29B6F6] text-white text-xs font-bold px-3 py-1 rounded-full">
                RECOMMANDÉ
              </span>
            )}

            <div className="text-3xl mb-3">{plan.emoji}</div>
            <h3 className="text-white font-bold text-lg">{plan.nom}</h3>

            <div className="flex items-baseline gap-1 my-3">
              <span className="text-[#29B6F6] font-bold text-2xl">
                {plan.prix.toLocaleString('fr-FR')}
              </span>
              <span className="text-gray-400 text-sm">FCFA / mois</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {plan.avantages.map((av) => (
                <li key={av} className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={14} className="text-[#29B6F6] shrink-0" />
                  {av}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePayment(plan.id)}
              disabled={loadingPlan === plan.id}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: plan.highlight ? '#29B6F6' : '#1a1a1a',
                color: plan.highlight ? '#fff' : '#29B6F6',
                border: plan.highlight ? 'none' : '1px solid rgba(41,182,246,0.4)',
              }}
            >
              {loadingPlan === plan.id ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirection en cours...
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  Payer par MoMo
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Déconnexion */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
      >
        <LogOut size={15} />
        Se déconnecter
      </button>
    </div>
  );
}
