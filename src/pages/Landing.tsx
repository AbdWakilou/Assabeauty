// ============================================================
// LANDING PAGE — SalonPro
// ============================================================
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CalendarPlus, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Mail, MessageCircle,
  Star
} from 'lucide-react';

const APP_NAME = 'SalonPro';
const WHATSAPP_NUMBER = '+22997000000';
const EMAIL_CONTACT = 'contact@salonpro.app';

// ── ANIMATION VARIANTS ─────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// ── COMPOSANT TRAIT DÉCORATIF ─────────────────────────────
function DecorativeLine() {
  return (
    <div className="flex justify-center mt-4 mb-8">
      <div
        style={{
          height: '3px',
          width: '80px',
          background: 'linear-gradient(90deg, #29B6F6, #C9A84C, #29B6F6)',
          borderRadius: '2px',
        }}
      />
    </div>
  );
}

// ── TÉMOIGNAGES DATA ──────────────────────────────────────
const temoignages = [
  {
    photo: 'https://i.pravatar.cc/150?img=47',
    citation: 'Mes clientes réservent depuis WhatsApp. Simple pour elles, simple pour moi.',
    nom: 'Nadia B.',
    metier: 'Maquilleuse',
    ville: 'Lomé',
  },
  {
    photo: 'https://i.pravatar.cc/150?img=48',
    citation: 'Avant je perdais 3-4 clientes par semaine. Maintenant mon agenda est plein tous les jours.',
    nom: 'Fatou K.',
    metier: 'Coiffeuse',
    ville: 'Cotonou',
  },
  {
    photo: 'https://i.pravatar.cc/150?img=49',
    citation: 'Les rappels automatiques ont supprimé tous mes no-shows. Je gagne 40 000 FCFA de plus par mois.',
    nom: 'Aminata D.',
    metier: 'Institut beauté',
    ville: 'Dakar',
  },
  {
    photo: 'https://i.pravatar.cc/150?img=12',
    citation: 'Je gère 2 salons depuis mon téléphone. Les stats m\'ont aidé à doubler mon chiffre d\'affaires.',
    nom: 'Moussa T.',
    metier: 'Barbershop',
    ville: 'Abidjan',
  },
];

// ── PLANS DATA ────────────────────────────────────────────
const plans = [
  {
    emoji: '🌱',
    nom: 'Essentiel',
    description: 'Pour démarrer et ne plus perdre de clientes',
    prix: 7000,
    badge: null,
    cardClass: 'bg-white text-[#0a0a0a]',
    avantages: [
      'Jusqu\'à 100 clients enregistrés',
      'Agenda en ligne',
      'Réservation via lien WhatsApp',
      'Rappel automatique 24h avant (5 msg/jour max)',
      'Fiche cliente basique (nom, téléphone, service)',
      'Caisse & facturation PDF',
    ],
    limitations: [
      'Pas de fidélisation automatique',
      'Pas de statistiques',
      'Pas de fiche allergie/anniversaire',
    ],
  },
  {
    emoji: '💎',
    nom: 'Professionnel',
    description: 'Pour les salons qui veulent fidéliser et gagner plus',
    prix: 12000,
    badge: '⭐ Le plus choisi',
    cardClass: 'bg-[#0a0a0a] text-white border border-[#29B6F6]',
    avantages: [
      'Jusqu\'à 3 salons / collaborateurs',
      'Tout le plan Essentiel',
      'Rappels illimités',
      'Fidélisation automatique (anniversaire, relance)',
      'Fiche cliente complète (allergies, anniversaire, notes)',
      'Services illimités',
      'Statistiques avancées',
    ],
    limitations: [
      'Pas de dashboard multi-salons illimités',
    ],
  },
  {
    emoji: '🏢',
    nom: 'Réseau',
    description: 'Pour gérer plusieurs salons depuis un seul endroit',
    prix: 20000,
    badge: null,
    cardClass: 'bg-white text-[#0a0a0a]',
    avantages: [
      'Multi-salons illimités',
      'Tout le plan Professionnel',
      'Dashboard centralisé',
      'Statistiques avancées multi-salons',
      'Gestion équipe multi-site',
      'Prestataires illimités',
      'Support dédié',
    ],
    limitations: [],
  },
];

// ── FEATURES DATA ─────────────────────────────────────────
const features = [
  {
    icon: <Calendar size={24} className="text-white" />,
    titre: 'Réservation automatique 24h/24',
    desc: 'Vos clientes réservent même à minuit. Vous retrouvez votre agenda plein le matin.',
  },
  {
    icon: <span className="text-white text-xl">👤</span>,
    titre: 'Fiche cliente complète',
    desc: 'Nom, téléphone, allergies, anniversaire, service habituel et notes perso. Chaque cliente se sent unique.',
  },
  {
    icon: <span className="text-white text-xl">🔔</span>,
    titre: 'Rappels automatiques',
    desc: 'Un message WhatsApp 24h avant chaque rendez-vous. Fini les no-shows qui vous coûtent cher.',
  },
  {
    icon: <span className="text-white text-xl">❤️</span>,
    titre: 'Fidélisation automatique',
    desc: 'Message de remerciement après chaque visite. Offre spéciale pour son anniversaire. Relance si elle n\'est pas revenue.',
  },
  {
    icon: <span className="text-white text-xl">📊</span>,
    titre: 'Vos chiffres en temps réel',
    desc: 'Chiffre d\'affaires, rendez-vous honorés, no-shows, service le plus demandé.',
  },
  {
    icon: <MessageCircle size={24} className="text-white" />,
    titre: 'Tout sur WhatsApp',
    desc: 'Vos clientes restent sur l\'appli qu\'elles connaissent déjà. Aucun téléchargement. Zéro friction.',
  },
];

// ── POUR QUI DATA ─────────────────────────────────────────
const pourQui = [
  {
    emoji: '✂️',
    label: 'Salon de coiffure',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
  },
  {
    emoji: '💅',
    label: 'Institut beauté & ongles',
    photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
  },
  {
    emoji: '💄',
    label: 'Maquilleuse',
    photo: null,
  },
  {
    emoji: '🧖',
    label: 'Spa & massage',
    photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
  },
  {
    emoji: '🎨',
    label: 'Tatoueur & henné',
    photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&q=80',
  },
  {
    emoji: '✦',
    label: 'Et bien plus...',
    photo: null,
  },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function Landing() {
  // ── Capture du code affilié depuis l'URL (?ref=CODE) ──
  // Doit être le premier useEffect — persiste en localStorage
  // pour survivre à la navigation vers /onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.trim().length > 0) {
      localStorage.setItem('ref_affilie', ref.trim().toUpperCase());
    }
  }, []);

  // ── Easter egg admin : 5 clics sur le logo ────────────
  const [logoClicks, setLogoClicks] = useState(0);
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = useCallback(() => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (logoTimer.current) clearTimeout(logoTimer.current);
      if (next >= 5) {
        // Naviguer vers /admin sans laisser de trace dans l'historique
        window.location.href = '/admin';
        return 0;
      }
      // Réinitialiser le compteur après 3 secondes d'inactivité
      logoTimer.current = setTimeout(() => setLogoClicks(0), 3000);
      return next;
    });
  }, []);

  const navigate = useNavigate();
  const [currentTemoignage, setCurrentTemoignage] = useState(0);
  const footerRef = useRef<HTMLElement>(null);

  const prevTemoignage = () =>
    setCurrentTemoignage((p) => (p - 1 + temoignages.length) % temoignages.length);
  const nextTemoignage = () =>
    setCurrentTemoignage((p) => (p + 1) % temoignages.length);

  return (
    <div className="min-h-screen font-poppins bg-[#0a0a0a]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* ────────────────── HEADER ────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5" style={{ height: 65 }}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 select-none focus:outline-none"
            title=""
            tabIndex={-1}
          >
            <span className="text-[#29B6F6] text-xl font-bold">✦</span>
            <span className="text-white font-bold text-xl tracking-tight">{APP_NAME}</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors border border-white/10 hover:border-white/30 rounded-xl"
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              className="bg-[#29B6F6] text-white px-5 py-2.5 font-semibold transition-all hover:bg-[#0288D1] active:scale-95 hidden sm:block"
              style={{ borderRadius: 12 }}
            >
              Je commence
            </button>
          </div>
        </div>
      </header>

      {/* ────────────────── HERO ──────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center pt-[65px] overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-[#0a0a0a]/70" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          {/* Tag au-dessus du titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#29B6F6] text-xs tracking-[0.3em] uppercase font-semibold mb-6"
          >
            ✦ COIFFURE · BEAUTÉ · SPA · TATOUAGE · HENNÉ
          </motion.p>

          {/* Titre H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-playfair font-bold text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontFamily: 'Playfair Display, serif' }}
          >
            Votre salon est plein,<br />
            mais vous perdez des<br />
            clientes à chaque<br />
            <span style={{ color: '#C9A84C' }}>rendez-vous manqué.</span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-white/80 text-lg max-w-2xl mx-auto mb-10"
          >
            Pendant que vous coiffez, <strong className="text-[#29B6F6]">{APP_NAME}</strong> remplit votre agenda,
            confirme les rendez-vous et fidélise vos clientes — vous, vous encaissez plus.
          </motion.p>

          {/* CTA principal */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            onClick={() => navigate('/onboarding')}
            className="bg-[#29B6F6] text-white text-lg font-bold px-10 py-4 transition-all hover:bg-[#0288D1] hover:scale-105 active:scale-95 shadow-lg shadow-[#29B6F6]/30"
            style={{ borderRadius: 16 }}
          >
            Je remplis mon agenda →
          </motion.button>

          {/* Stats flottantes */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mt-14"
          >
            {[
              { icon: '📅', stat: '+47 rendez-vous', label: 'signés par mois' },
              { icon: '🔴', stat: 'Zéro', label: 'rendez-vous manqué' },
              { icon: '💰', stat: 'Plus de revenu', label: 'chaque semaine' },
            ].map((item) => (
              <div
                key={item.stat}
                className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 text-center"
                style={{ minWidth: 150 }}
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-white font-bold text-lg">{item.stat}</div>
                <div className="text-white/60 text-xs">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION VOUS PERDEZ DE L'ARGENT ──────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-2"
          >
            <h2
              className="font-playfair font-bold text-[#0a0a0a] text-3xl md:text-4xl"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Chaque semaine vous perdez de l'argent<br />
              <span style={{ color: '#C9A84C' }}>sans vous en rendre compte</span>
            </h2>
          </motion.div>
          <DecorativeLine />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-10"
          >
            {[
              {
                icon: '📵',
                titre: 'Le téléphone sonne, personne répond',
                desc: 'La cliente attend 2 secondes. Elle appelle la concurrente. Vous perdez une vente.',
              },
              {
                icon: '📓',
                titre: 'Votre agenda c\'est un cahier ou votre tête',
                desc: 'Oublis, doubles réservations, clientes mécontentes. Ça fait mal à votre réputation.',
              },
              {
                icon: '💸',
                titre: 'Vous ne savez pas combien vous gagnez vraiment',
                desc: 'Pas de chiffres clairs = pas de décisions claires = pas de croissance.',
              },
            ].map((card) => (
              <motion.div
                key={card.titre}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="font-bold text-[#0a0a0a] text-lg mb-2">{card.titre}</h3>
                <p className="text-gray-600 text-sm">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bannière alerte */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-[#0a0a0a] border border-red-500/50 rounded-2xl p-6 text-center"
          >
            <p className="text-red-400 font-semibold">
              🔴 En moyenne, un salon perd <strong>11 clientes par mois</strong> à cause des rendez-vous manqués.
              C'est <strong>~180 000 FCFA</strong> qui partent chez la concurrente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION LE PRODUIT FAIT LE TRAVAIL ───────────── */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-2"
          >
            <h2 className="font-playfair font-bold text-white text-3xl md:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              {APP_NAME} fait le travail
            </h2>
            <p
              className="font-playfair text-2xl md:text-3xl mt-2"
              style={{
                fontFamily: 'Playfair Display, serif',
                background: 'linear-gradient(90deg, #29B6F6, #C9A84C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              pendant que vous travaillez
            </p>
          </motion.div>
          <DecorativeLine />

          <div className="space-y-12">
            {[
              {
                num: '1',
                photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
                titre: 'Votre cliente réserve toute seule',
                desc: `Via WhatsApp ou votre lien ${APP_NAME}. Même à minuit. Même quand vous avez les mains dans les cheveux.`,
              },
              {
                num: '2',
                photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80',
                titre: `${APP_NAME} gère votre agenda`,
                desc: 'Plus d\'oublis. Plus de doubles réservations. Rappels automatiques envoyés à vos clientes.',
              },
              {
                num: '3',
                photo: 'https://images.unsplash.com/photo-1603297741047-2800db55d7ad?w=800&q=80',
                titre: 'Vos clientes reviennent seules',
                desc: 'Message automatique après chaque visite. Offre spéciale pour son anniversaire. Votre salon reste dans sa tête.',
              },
            ].map((bloc, i) => (
              <motion.div
                key={bloc.num}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}
              >
                <div className="flex-1 relative rounded-2xl overflow-hidden">
                  <img
                    src={bloc.photo}
                    alt={bloc.titre}
                    className="w-full h-56 md:h-72 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="flex-1 space-y-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: '#29B6F6' }}
                  >
                    {bloc.num}
                  </div>
                  <h3 className="text-white font-bold text-2xl font-playfair" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {bloc.titre}
                  </h3>
                  <p className="text-gray-400 text-base leading-relaxed">{bloc.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION FEATURES ─────────────────────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-2"
          >
            <h2 className="font-playfair font-bold text-[#0a0a0a] text-3xl md:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              Tout ce qu'il vous faut pour <span style={{ color: '#29B6F6' }}>gagner plus</span>
            </h2>
          </motion.div>
          <DecorativeLine />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.titre}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#29B6F6' }}
                >
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#0a0a0a] text-lg mb-2">{f.titre}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION POUR QUI ─────────────────────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#29B6F6' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-playfair font-bold text-white text-3xl md:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              {APP_NAME} est fait pour vous si vous êtes...
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {pourQui.map((item) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt={item.label}
                    className="w-full h-36 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center text-5xl bg-[#111111]">
                    {item.emoji}
                  </div>
                )}
                <div className="p-4 text-center">
                  <p className="text-white font-bold">
                    {item.emoji} {item.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION TARIFS ───────────────────────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-block bg-[#0a0a0a] text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
              Commencez gratuitement. Upgradez quand vous êtes prêt.
            </div>
            <h2 className="font-playfair font-bold text-[#0a0a0a] text-3xl md:text-4xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              Des tarifs adaptés à votre <span style={{ color: '#29B6F6' }}>croissance</span>
            </h2>
          </motion.div>
          <DecorativeLine />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.nom}
                variants={fadeUp}
                className={`rounded-2xl p-6 relative shadow-sm ${plan.cardClass}`}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="text-3xl mb-2">{plan.emoji}</div>
                <h3 className="font-bold text-xl mb-1">{plan.nom}</h3>
                <p className={`text-sm mb-4 ${plan.badge ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description}</p>

                <div className="mb-6">
                  <span className="font-bold text-4xl">
                    {new Intl.NumberFormat('fr-FR').format(plan.prix)}
                  </span>
                  <span className={`text-sm ml-1 ${plan.badge ? 'text-gray-400' : 'text-gray-500'}`}>FCFA/mois</span>
                </div>

                {/* Avantages */}
                <ul className="space-y-2 mb-4">
                  {plan.avantages.map((av) => (
                    <li key={av} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <span>{av}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plan.limitations.map((lim) => (
                      <li key={lim} className="flex items-start gap-2 text-sm">
                        <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                        <span className="text-gray-400">{lim}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => navigate('/onboarding')}
                  className="w-full bg-[#29B6F6] text-white py-3 font-bold transition-all hover:bg-[#0288D1] active:scale-95 mt-auto"
                  style={{ borderRadius: 12 }}
                >
                  {plan.nom === 'Réseau' ? 'Nous contacter' : plan.nom === 'Essentiel' ? 'Je remplis mon agenda' : 'Je commence maintenant'}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION TÉMOIGNAGES ──────────────────────────── */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <h2 className="font-playfair font-bold text-white text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Elles ont essayé.<br />
              <span style={{ color: '#C9A84C' }}>Elles ne reviennent plus en arrière.</span>
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
              </div>
              <span className="text-white font-bold">4.9/5</span>
            </div>
          </motion.div>
          <DecorativeLine />

          {/* Carousel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTemoignage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl p-8 text-center"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <img
                  src={temoignages[currentTemoignage].photo}
                  alt={temoignages[currentTemoignage].nom}
                  className="w-16 h-16 rounded-full mx-auto mb-4 object-cover border-2"
                  style={{ borderColor: '#29B6F6' }}
                />
                <blockquote className="text-white/90 italic text-lg mb-4" style={{ lineHeight: 1.7 }}>
                  "{temoignages[currentTemoignage].citation}"
                </blockquote>
                <div className="flex justify-center text-yellow-400 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="font-bold text-[#29B6F6]">{temoignages[currentTemoignage].nom}</p>
                <p className="text-gray-500 text-sm">
                  {temoignages[currentTemoignage].metier} · {temoignages[currentTemoignage].ville}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={prevTemoignage}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#29B6F6]/30 flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
              <div className="flex gap-2">
                {temoignages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTemoignage(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: i === currentTemoignage ? '#29B6F6' : 'rgba(255,255,255,0.3)',
                      transform: i === currentTemoignage ? 'scale(1.5)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={nextTemoignage}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#29B6F6]/30 flex items-center justify-center transition-colors"
              >
                <ChevronRight size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROGRAMME AFFILIÉS ──────────────────────────── */}
      <section className="py-24 px-4" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.div variants={fadeUp}>
              <span className="text-[#29B6F6] text-sm font-semibold tracking-widest uppercase">Programme Affiliés</span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-playfair font-bold text-white text-3xl md:text-4xl mt-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Gagnez en recommandant SalonPro
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
              Partagez votre lien, touchez une commission de <span className="text-[#29B6F6] font-semibold">15 % à 35 %</span> sur chaque abonnement souscrit. Pas de limite de gains.
            </motion.p>
            <DecorativeLine />
          </motion.div>

          {/* Grille avantages */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14"
          >
            {[
              { icon: '💸', titre: "15 % dès le 1er filleul", desc: 'Commission de base sur chaque abonnement actif de tes filleuls.' },
              { icon: '🚀', titre: "Jusqu'à 35 % selon volume", desc: 'Plus tu amènes de clients actifs, plus ton taux monte automatiquement.' },
              { icon: '📊', titre: 'Dashboard en temps réel', desc: 'Suis tes clics, conversions, commissions et paiements depuis ton espace.' },
            ].map((item) => (
              <motion.div
                key={item.titre}
                variants={fadeUp}
                className="bg-[#111] border border-white/8 rounded-2xl p-6 text-center"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{item.titre}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Grille taux */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-[#111] border border-white/8 rounded-2xl p-8 mb-14"
          >
            <h3 className="text-white font-bold text-xl mb-6 text-center">Barème de commission</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { palier: '1 – 4 filleuls', taux: '15 %', color: '#6b7280' },
                { palier: '5 – 14 filleuls', taux: '20 %', color: '#29B6F6' },
                { palier: '15 – 29 filleuls', taux: '28 %', color: '#0288D1' },
                { palier: '30 + filleuls', taux: '35 %', color: '#f59e0b' },
              ].map((p) => (
                <div key={p.palier} className="text-center p-4 rounded-xl" style={{ backgroundColor: p.color + '15', border: `1px solid ${p.color}30` }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: p.color }}>{p.taux}</div>
                  <div className="text-gray-400 text-xs">{p.palier}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA inscription affilié */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <button
              onClick={() => navigate('/affilies')}
              className="bg-[#29B6F6] text-white text-lg font-bold px-10 py-4 transition-all hover:bg-[#0288D1] hover:scale-105 active:scale-95 shadow-xl"
              style={{ borderRadius: 16 }}
            >
              Devenir affilié gratuitement →
            </button>
            <p className="text-gray-500 text-sm mt-4">Inscription gratuite · Paiement mensuel · Zéro engagement</p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ backgroundColor: '#29B6F6' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <img
              src="https://i.pravatar.cc/150?img=47"
              alt="Témoignage"
              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white"
            />
            <h2
              className="font-playfair font-bold text-white text-3xl md:text-4xl"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Arrêtez de perdre des clientes.<br />Commencez aujourd'hui.
            </h2>
            <p className="text-white/90 text-lg">
              Rejoignez les salons qui gagnent plus avec {APP_NAME}.
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="bg-[#0a0a0a] text-white text-lg font-bold px-10 py-4 transition-all hover:bg-[#1a1a1a] hover:scale-105 active:scale-95 shadow-xl"
              style={{ borderRadius: 24 }}
            >
              Je commence maintenant →
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── CONTACT ─────────────────────────────────────── */}
      <section ref={footerRef} className="py-16 px-4 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-playfair font-bold text-white text-2xl mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
            Contactez-nous
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-6 py-3 rounded-xl font-medium hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>
            <a
              href={`mailto:${EMAIL_CONTACT}`}
              className="flex items-center gap-3 bg-[#29B6F6]/10 border border-[#29B6F6]/30 text-[#29B6F6] px-6 py-3 rounded-xl font-medium hover:bg-[#29B6F6]/20 transition-colors"
            >
              <Mail size={20} />
              {EMAIL_CONTACT}
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="py-10 px-4 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#29B6F6] text-xl font-bold">✦</span>
            <span className="text-white font-bold text-lg">{APP_NAME}</span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2026 {APP_NAME}. Tous droits réservés.
          </p>
          <div className="flex gap-4 text-gray-600 text-sm">
            <a href="#" className="hover:text-gray-400 transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Politique de confidentialité</a>
            <a href="/affilies" className="hover:text-[#29B6F6] transition-colors">Programme Affiliés</a>
          </div>
        </div>
      </footer>

      {/* ─── BOUTON WHATSAPP FLOTTANT (bas gauche) ─────── */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg animate-pulse"
        style={{ backgroundColor: '#25D366' }}
        title="Chat WhatsApp"
      >
        <MessageCircle size={28} className="text-white" fill="white" />
      </a>

      {/* ─── BOUTON AGENDA FLOTTANT (bas droite) ───────── */}
      <button
        onClick={() => navigate('/onboarding')}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        style={{ backgroundColor: '#29B6F6' }}
        title="Prendre rendez-vous"
      >
        <CalendarPlus size={26} className="text-white" />
      </button>
    </div>
  );
}
