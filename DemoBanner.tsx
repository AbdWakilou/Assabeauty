// ============================================================
// DEMO BANNER — SalonPro
// ─────────────────────────────────────────────────────────────
// Bandeau fixe affiché en haut du Layout quand isDemo() est true.
// Informe l'utilisateur qu'il est en mode démo et propose
// de créer un compte réel.
// ============================================================
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function DemoBanner() {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5 border-b"
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.10)',
        borderColor:     'rgba(245, 158, 11, 0.30)',
      }}
    >
      {/* Icône + texte */}
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
        <span
          className="text-xs font-bold tracking-wide whitespace-nowrap"
          style={{ color: '#F59E0B' }}
        >
          MODE DÉMO
        </span>
        <span
          className="text-xs hidden sm:inline truncate"
          style={{ color: 'rgba(245,158,11,0.7)' }}
        >
          — Données fictives · Rien n'est enregistré
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/onboarding')}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                   transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: '#F59E0B',
          color: '#0a0a0a',
        }}
      >
        Créer mon compte gratuit →
      </button>
    </div>
  );
}
