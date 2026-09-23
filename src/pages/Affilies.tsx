// ============================================================
// PAGE AFFILIÉS — SalonPro
// Inscription + Dashboard affilié avec code unique et stats
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Copy, Check, TrendingUp, Users, DollarSign,
  LogIn, ChevronRight, Eye, EyeOff, ArrowLeft, Star
} from 'lucide-react';
import {
  collection, doc, setDoc, getDoc, query, where, getDocs,
  serverTimestamp, increment, updateDoc,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut,
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

const APP_NAME = 'SalonPro';

// ── helpers ────────────────────────────────────────────────
function genCode(prenom: string, nom: string): string {
  const base = (prenom.slice(0, 3) + nom.slice(0, 3))
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

function tauxPourFilleuls(n: number): number {
  if (n >= 30) return 35;
  if (n >= 15) return 28;
  if (n >= 5)  return 20;
  return 15;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

// ── Types ──────────────────────────────────────────────────
interface AffiliateProfile {
  uid: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  code: string;
  lien: string;
  taux: number;
  statut: 'actif' | 'suspendu';
  dateInscription: string;
  createdAt: string;
  clics: number;
  filleuls: number;
  commissionsGagnees: number;
  commissionsPendantes: number;
  mobileMoneyNumero: string;
  mobileMoneyPays: string;
}

// ── Composant principal ────────────────────────────────────
export default function Affilies() {
  const [mode, setMode] = useState<'landing' | 'register' | 'login' | 'dashboard'>('landing');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [copied, setCopied] = useState(false);

  // Champs inscription
  const [prenom, setPrenom] = useState('');
  const [nom, setNom]     = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel]     = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loginEmail, setLoginEmail]     = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ── Mobile Money (payout automatique) ─────────────────────
  const [mmNumero, setMmNumero] = useState('');
  const [mmPays, setMmPays]     = useState('BJ');

  // Pays supportés par FedaPay Payout
  const PAYS_FEDAPAY = [
    { code: 'BJ', label: '🇧🇯 Bénin'          },
    { code: 'SN', label: '🇸🇳 Sénégal'         },
    { code: 'CI', label: '🇨🇮 Côte d\'Ivoire'  },
    { code: 'ML', label: '🇲🇱 Mali'            },
    { code: 'BF', label: '🇧🇫 Burkina Faso'    },
    { code: 'TG', label: '🇹🇬 Togo'            },
    { code: 'NE', label: '🇳🇪 Niger'           },
    { code: 'GN', label: '🇬🇳 Guinée'          },
    { code: 'CM', label: '🇨🇲 Cameroun'        },
  ];
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Vérification auth au montage
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'affilies', user.uid));
      if (snap.exists()) {
        setProfile(snap.data() as AffiliateProfile);
        setMode('dashboard');
      }
    });
    return unsub;
  }, []);

  // ── Inscription ──────────────────────────────────────────
  const handleRegister = async () => {
    if (!prenom.trim() || !nom.trim() || !email.trim() || !tel.trim() || !password) {
      toast.error('Tous les champs sont requis.');
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      // Générer un code unique
      let code = genCode(prenom, nom);
      const existing = await getDocs(query(collection(db, 'affilies'), where('code', '==', code)));
      if (!existing.empty) code = genCode(prenom, nom); // retry si collision

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const lien = `${window.location.origin}/onboarding?ref=${code}`;
      const now  = new Date().toISOString();
      const newProfile: AffiliateProfile = {
        uid:                  cred.user.uid,
        prenom:               prenom.trim(),
        nom:                  nom.trim(),
        email:                email.trim(),
        telephone:            tel.trim(),
        code,
        lien,
        taux:                 15,          // palier de départ
        statut:               'actif',
        dateInscription:      now,
        createdAt:            now,
        clics:                0,
        filleuls:             0,
        commissionsGagnees:   0,
        commissionsPendantes: 0,
        mobileMoneyNumero:    mmNumero.trim(),
        mobileMoneyPays:      mmPays,
      };
      await setDoc(doc(db, 'affilies', cred.user.uid), {
        ...newProfile,
        createdAt: serverTimestamp(),      // timestamp serveur en Firestore
      });
      setProfile(newProfile);
      setMode('dashboard');
      toast.success('Bienvenue dans le programme affilié ! 🎉');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      if (msg.includes('email-already-in-use')) {
        toast.error('Cet email est déjà utilisé. Connectez-vous.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Connexion ────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const snap = await getDoc(doc(db, 'affilies', cred.user.uid));
      if (!snap.exists()) {
        toast.error('Aucun compte affilié trouvé pour cet email.');
        await signOut(auth);
        return;
      }
      setProfile(snap.data() as AffiliateProfile);
      setMode('dashboard');
      toast.success('Connexion réussie !');
    } catch {
      toast.error('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  // ── Copier le lien ───────────────────────────────────────
  const affiliateLink = profile
    ? `${window.location.origin}/onboarding?ref=${profile.code}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2500);
  };

  const taux = profile ? tauxPourFilleuls(profile.filleuls) : 15;

  // ── Déconnexion ──────────────────────────────────────────
  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    setMode('landing');
  };

  // ════════════════════════════════════════════════════════
  // LANDING AFFILIÉ
  // ════════════════════════════════════════════════════════
  if (mode === 'landing') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5" style={{ height: 65 }}>
          <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-[#29B6F6] text-xl font-bold">✦</span>
              <span className="text-white font-bold text-lg">{APP_NAME}</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('login')}
                className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium border border-white/10 hover:border-white/30 rounded-xl transition-colors"
              >
                J'ai déjà un compte
              </button>
              <button
                onClick={() => setMode('register')}
                className="bg-[#29B6F6] text-white px-5 py-2.5 text-sm font-bold rounded-xl hover:bg-[#0288D1] transition-all"
              >
                Devenir affilié
              </button>
            </div>
          </div>
        </header>

        <div className="pt-24 pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-16">
              <span className="text-[#29B6F6] text-sm font-semibold tracking-widest uppercase">Programme Affiliés</span>
              <h1 className="font-playfair font-bold text-white text-4xl md:text-5xl mt-4 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Gagnez jusqu'à <span className="text-[#29B6F6]">35 %</span><br />en recommandant SalonPro
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
                Partagez votre lien unique. Chaque salon qui s'abonne via votre lien vous rapporte une commission mensuelle récurrente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setMode('register')}
                  className="bg-[#29B6F6] text-white text-lg font-bold px-10 py-4 rounded-2xl hover:bg-[#0288D1] hover:scale-105 transition-all shadow-xl"
                >
                  Créer mon compte affilié →
                </button>
                <button
                  onClick={() => setMode('login')}
                  className="border border-white/20 text-white px-8 py-4 rounded-2xl hover:border-white/40 hover:bg-white/5 transition-all"
                >
                  <LogIn size={18} className="inline mr-2" />
                  Mon espace affilié
                </button>
              </div>
            </motion.div>

            {/* Barème */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-[#111] border border-white/8 rounded-2xl p-8 mb-10">
              <h2 className="text-white font-bold text-xl text-center mb-6">Barème de commission</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { palier: '1 – 4 filleuls', taux: '15 %', color: '#6b7280' },
                  { palier: '5 – 14 filleuls', taux: '20 %', color: '#29B6F6' },
                  { palier: '15 – 29 filleuls', taux: '28 %', color: '#0288D1' },
                  { palier: '30+ filleuls', taux: '35 %', color: '#f59e0b' },
                ].map((p) => (
                  <div key={p.palier} className="text-center p-5 rounded-xl"
                    style={{ backgroundColor: p.color + '18', border: `1px solid ${p.color}35` }}>
                    <div className="text-3xl font-bold mb-1" style={{ color: p.color }}>{p.taux}</div>
                    <div className="text-gray-400 text-xs">{p.palier}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Avantages */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { icon: '🔗', t: 'Lien & code uniques', d: 'Chaque affilié reçoit un lien personnalisé traçable et un code promo dédié.' },
                { icon: '📈', t: 'Dashboard temps réel', d: 'Clics, inscriptions, commissions gagnées et pendantes, tout en un coup d\'œil.' },
                { icon: '💳', t: 'Paiement mensuel', d: 'Vos commissions sont reversées chaque mois directement sur votre compte.' },
              ].map((a) => (
                <div key={a.t} className="bg-[#111] border border-white/8 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">{a.icon}</div>
                  <h3 className="text-white font-bold mb-2">{a.t}</h3>
                  <p className="text-gray-400 text-sm">{a.d}</p>
                </div>
              ))}
            </motion.div>

            {/* Comment ça marche */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-[#111] border border-white/8 rounded-2xl p-8">
              <h2 className="text-white font-bold text-xl text-center mb-8">Comment ça marche</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { num: '1', t: 'Inscrivez-vous', d: 'Créez votre compte affilié gratuitement en 2 minutes.' },
                  { num: '2', t: 'Partagez votre lien', d: 'Envoyez votre lien unique aux salons de coiffure et de beauté.' },
                  { num: '3', t: 'Touchez vos commissions', d: 'Gagnez 15 à 35 % de chaque abonnement souscrit via votre lien.' },
                ].map((s) => (
                  <div key={s.num} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-[#29B6F6] flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">{s.num}</div>
                    <h3 className="text-white font-bold mb-2">{s.t}</h3>
                    <p className="text-gray-400 text-sm">{s.d}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer minimal */}
        <footer className="py-8 px-4 border-t border-white/5 text-center text-gray-600 text-sm">
          <Link to="/" className="hover:text-gray-400 transition-colors">← Retour à l'accueil</Link>
          <span className="mx-3">·</span>
          © 2026 {APP_NAME}
        </footer>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // FORMULAIRE INSCRIPTION / CONNEXION
  // ════════════════════════════════════════════════════════
  if (mode === 'register' || mode === 'login') {
    const isRegister = mode === 'register';
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#0a0a0a' }}>
        <Link to="/affilies" onClick={() => setMode('landing')}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Retour
        </Link>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-md">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#29B6F6' }}>
                {isRegister ? <Star size={28} className="text-white" /> : <LogIn size={28} className="text-white" />}
              </div>
              <h1 className="text-white font-bold text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                {isRegister ? 'Devenir affilié' : 'Espace affilié'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {isRegister ? 'Inscription gratuite · Commission 15–35 %' : 'Connectez-vous à votre espace'}
              </p>
            </div>

            {isRegister ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Prénom *</label>
                    <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Amina"
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Nom *</label>
                    <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Diallo"
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com"
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Téléphone *</label>
                  <input value={tel} onChange={e => setTel(e.target.value)} placeholder="+229 97 00 00 00"
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                </div>

                {/* ── Mobile Money ─────────────────────────── */}
                <div className="bg-[#0f1f2e] border border-[#29B6F6]/20 rounded-xl p-4 space-y-3">
                  <p className="text-[#29B6F6] text-xs font-semibold uppercase tracking-wider">
                    💸 Infos de paiement Mobile Money
                  </p>
                  <p className="text-gray-500 text-xs">
                    Vos commissions seront versées automatiquement sur ce numéro dès qu'un filleul paie.
                  </p>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Pays Mobile Money *</label>
                    <select
                      value={mmPays}
                      onChange={e => setMmPays(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm"
                    >
                      {PAYS_FEDAPAY.map(p => (
                        <option key={p.code} value={p.code}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1.5">Numéro Mobile Money *</label>
                    <input
                      value={mmNumero}
                      onChange={e => setMmNumero(e.target.value)}
                      placeholder="+229 97 00 00 00"
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm"
                    />
                    <p className="text-gray-600 text-xs mt-1">Format international avec indicatif pays</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Mot de passe *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-2.5 pr-10 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button onClick={handleRegister} disabled={loading}
                  className="w-full bg-[#29B6F6] text-white font-bold py-3.5 rounded-xl hover:bg-[#0288D1] transition-all disabled:opacity-50 mt-2">
                  {loading ? 'Création...' : 'Créer mon compte affilié →'}
                </button>
                <p className="text-center text-gray-500 text-sm">
                  Déjà affilié ?{' '}
                  <button onClick={() => setMode('login')} className="text-[#29B6F6] font-semibold hover:underline">
                    Se connecter
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Email</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="vous@email.com"
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-[#29B6F6] transition-colors" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <input type={showLoginPass ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••"
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 pr-10 rounded-xl outline-none focus:border-[#29B6F6] transition-colors" />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button onClick={handleLogin} disabled={loading}
                  className="w-full bg-[#29B6F6] text-white font-bold py-3.5 rounded-xl hover:bg-[#0288D1] transition-all disabled:opacity-50">
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
                <p className="text-center text-gray-500 text-sm">
                  Pas encore affilié ?{' '}
                  <button onClick={() => setMode('register')} className="text-[#29B6F6] font-semibold hover:underline">
                    Créer un compte
                  </button>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // DASHBOARD AFFILIÉ
  // ════════════════════════════════════════════════════════
  if (mode === 'dashboard' && profile) {
    const prochainPalier = profile.filleuls < 5 ? 5 :
      profile.filleuls < 15 ? 15 :
      profile.filleuls < 30 ? 30 : null;
    const progress = prochainPalier
      ? Math.round((profile.filleuls / prochainPalier) * 100)
      : 100;

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Header dashboard */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5" style={{ height: 65 }}>
          <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#29B6F6] text-xl font-bold">✦</span>
              <span className="text-white font-bold text-lg">{APP_NAME}</span>
              <span className="text-gray-600 mx-2">·</span>
              <span className="text-gray-400 text-sm">Espace Affilié</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm hidden sm:block">{profile.prenom} {profile.nom}</span>
              <button onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
          {/* Welcome */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
            <h1 className="text-white font-bold text-2xl md:text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              Bonjour, {profile.prenom} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">Voici l'état de vos performances d'affiliation.</p>
          </motion.div>

          {/* Lien + code */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Votre code d'affiliation</p>
                <div className="flex items-center gap-3">
                  <span className="text-[#29B6F6] font-bold text-2xl tracking-widest">{profile.code}</span>
                  <button onClick={() => { navigator.clipboard.writeText(profile.code); toast.success('Code copié !'); }}
                    className="text-gray-500 hover:text-gray-300 transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Taux actuel</p>
                <span className="text-[#f59e0b] font-bold text-2xl">{taux} %</span>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Votre lien affilié</p>
              <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/8 rounded-xl px-4 py-3">
                <p className="text-gray-300 text-sm flex-1 truncate">{affiliateLink}</p>
                <button onClick={copyLink}
                  className="shrink-0 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: copied ? '#22c55e' : '#29B6F6' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Statistiques */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Clics', value: profile.clics, icon: <TrendingUp size={20} />, color: '#29B6F6' },
              { label: 'Filleuls actifs', value: profile.filleuls, icon: <Users size={20} />, color: '#22c55e' },
              { label: 'Commissions gagnées', value: `${profile.commissionsGagnees.toLocaleString()} FCFA`, icon: <DollarSign size={20} />, color: '#f59e0b' },
              { label: 'En attente', value: `${profile.commissionsPendantes.toLocaleString()} FCFA`, icon: <ChevronRight size={20} />, color: '#a78bfa' },
            ].map((s) => (
              <div key={s.label} className="bg-[#111] border border-white/8 rounded-2xl p-5">
                <div className="mb-3" style={{ color: s.color }}>{s.icon}</div>
                <div className="text-white font-bold text-xl md:text-2xl">{s.value}</div>
                <div className="text-gray-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Progression palier */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            className="bg-[#111] border border-white/8 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Progression vers le prochain palier</h3>
              {prochainPalier ? (
                <span className="text-gray-400 text-sm">{profile.filleuls} / {prochainPalier} filleuls</span>
              ) : (
                <span className="text-[#f59e0b] text-sm font-semibold">Palier maximum atteint 🏆</span>
              )}
            </div>
            <div className="w-full bg-[#1a1a1a] rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, backgroundColor: '#29B6F6' }}
              />
            </div>
            {prochainPalier && (
              <p className="text-gray-500 text-xs mt-3">
                Plus que <span className="text-white font-semibold">{prochainPalier - profile.filleuls} filleul{prochainPalier - profile.filleuls > 1 ? 's' : ''}</span> pour passer à{' '}
                <span className="text-[#29B6F6] font-semibold">{tauxPourFilleuls(prochainPalier)} %</span> de commission
              </p>
            )}
          </motion.div>

          {/* Tableau des paliers */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            className="bg-[#111] border border-white/8 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-5">Barème de commission</h3>
            <div className="space-y-3">
              {[
                { palier: '1 – 4 filleuls', taux: '15 %', color: '#6b7280', min: 0, max: 4 },
                { palier: '5 – 14 filleuls', taux: '20 %', color: '#29B6F6', min: 5, max: 14 },
                { palier: '15 – 29 filleuls', taux: '28 %', color: '#0288D1', min: 15, max: 29 },
                { palier: '30+ filleuls', taux: '35 %', color: '#f59e0b', min: 30, max: Infinity },
              ].map((p) => {
                const active = profile.filleuls >= p.min && profile.filleuls <= p.max;
                return (
                  <div key={p.palier} className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      backgroundColor: active ? p.color + '18' : '#1a1a1a',
                      border: `1px solid ${active ? p.color + '50' : 'rgba(255,255,255,0.05)'}`,
                    }}>
                    <div className="flex items-center gap-3">
                      {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />}
                      {!active && <div className="w-2 h-2" />}
                      <span className={active ? 'text-white font-semibold' : 'text-gray-500'}>{p.palier}</span>
                      {active && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: p.color + '30', color: p.color }}>Actuel</span>}
                    </div>
                    <span className="font-bold text-lg" style={{ color: active ? p.color : '#4b5563' }}>{p.taux}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
