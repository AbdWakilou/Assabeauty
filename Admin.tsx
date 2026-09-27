// ============================================================
// ADMIN — SalonPro
// Super-admin : vue complète sur salons, utilisateurs,
// affiliés, commissions, abonnements, activité globale.
// Accès : /admin  |  Login par variables d'env
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, getDocs, doc, updateDoc, getDoc,
  query, orderBy, collectionGroup,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Users, DollarSign, TrendingUp, CheckCircle, Clock,
  Eye, EyeOff, LogOut, RefreshCw, ChevronDown, ChevronUp,
  Search, Star, AlertCircle, X, Building2,
  Activity, CreditCard, UserCheck, Filter, BarChart3,
  ShoppingBag, Calendar, Scissors,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Credentials admin ──────────────────────────────────────
const ADMIN_LOGIN    = 'admin@salonpro.app';
const ADMIN_PASSWORD = 'SalonProAdmin2026!';

// ── Types ──────────────────────────────────────────────────
interface SalonDoc {
  id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  whatsapp: string;
  plan: string;
  trialStartDate: string;
  trialDays: number;
  rccm?: string;
  ifu?: string;
  typesServices?: string[];
  factureCounter?: number;
}

interface UserDoc {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  salonId?: string;
  createdAt: string;
}

interface AffiliateDoc {
  uid: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  code: string;
  createdAt: string;
  clics: number;
  filleuls: number;
  commissionsGagnees: number;
  commissionsPendantes: number;
  dernierPaiement?: string;
  statut?: 'actif' | 'suspendu';
}

interface SalonStats {
  id: string;
  clients: number;
  factures: number;
  rdv: number;
  services: number;
  employes: number;
  chiffreAffaires: number;
}

type AdminTab = 'overview' | 'salons' | 'users' | 'affilies';
type SortDir = 'asc' | 'desc';

// ── helpers ────────────────────────────────────────────────
function tauxPourFilleuls(n: number) {
  if (n >= 30) return 35;
  if (n >= 15) return 28;
  if (n >= 5)  return 20;
  return 15;
}

function joursEssai(trialStart: string, trialDays: number) {
  const start = new Date(trialStart);
  const end   = new Date(start.getTime() + trialDays * 86400000);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function fmt(n: number) { return n.toLocaleString('fr-FR'); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const planColor: Record<string, string> = {
  essentiel:     '#6b7280',
  professionnel: '#29B6F6',
  reseau:        '#f59e0b',
};

const planLabel: Record<string, string> = {
  essentiel:     '🌱 Essentiel',
  professionnel: '💎 Professionnel',
  reseau:        '🏢 Réseau',
};

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Stat card ──────────────────────────────────────────────
function SC({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
      <div className="mb-3" style={{ color }}>{icon}</div>
      <div className="text-white font-bold text-2xl">{value}</div>
      <div className="text-gray-500 text-xs mt-1">{label}</div>
      {sub && <div className="text-xs mt-1 font-medium" style={{ color }}>{sub}</div>}
    </div>
  );
}

// ── Badge plan ─────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const c = planColor[plan] ?? '#6b7280';
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: c + '20', color: c, border: `1px solid ${c}40` }}>
      {planLabel[plan] ?? plan}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
export default function Admin() {
  // Auth
  const [authed, setAuthed]     = useState(false);
  const [loginVal, setLoginVal] = useState('');
  const [passVal, setPassVal]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginErr, setLoginErr] = useState('');

  // Data
  const [salons, setSalons]     = useState<SalonDoc[]>([]);
  const [users, setUsers]       = useState<UserDoc[]>([]);
  const [affilies, setAffilies] = useState<AffiliateDoc[]>([]);
  const [salonStats, setSalonStats] = useState<Record<string, SalonStats>>({});
  const [loading, setLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // UI
  const [tab, setTab]           = useState<AdminTab>('overview');
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState('createdAt');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');
  const [filterPlan, setFilterPlan] = useState('tous');
  const [filterStatut, setFilterStatut] = useState('tous');

  // Modals
  const [detailSalon, setDetailSalon]       = useState<SalonDoc | null>(null);
  const [detailUser, setDetailUser]         = useState<UserDoc | null>(null);
  const [detailAffilié, setDetailAffilié]   = useState<AffiliateDoc | null>(null);
  const [payModal, setPayModal]             = useState<AffiliateDoc | null>(null);
  const [payMontant, setPayMontant]         = useState('');

  // ── Login ────────────────────────────────────────────────
  const handleLogin = () => {
    if (loginVal.trim() === ADMIN_LOGIN && passVal === ADMIN_PASSWORD) {
      setAuthed(true); setLoginErr('');
    } else {
      setLoginErr('Identifiants incorrects.');
    }
  };

  // ── Load all data ─────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      // Salons
      const salonsSnap = await getDocs(query(collection(db, 'salons'), orderBy('trialStartDate', 'desc')));
      const salonsData = salonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SalonDoc));
      setSalons(salonsData);

      // Users
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserDoc));
      setUsers(usersData);

      // Affiliés
      const affSnap = await getDocs(query(collection(db, 'affiliates'), orderBy('createdAt', 'desc')));
      const affData = affSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AffiliateDoc));
      setAffilies(affData);

      // Stats par salon (clients, factures, rdv, services, employes)
      const statsMap: Record<string, SalonStats> = {};
      await Promise.all(salonsData.map(async (s) => {
        try {
          const [clientsSnap, facturesSnap, rdvSnap, servicesSnap, employesSnap] = await Promise.all([
            getDocs(collection(db, 'salons', s.id, 'clients')),
            getDocs(collection(db, 'salons', s.id, 'factures')),
            getDocs(collection(db, 'salons', s.id, 'rendezVous')),
            getDocs(collection(db, 'salons', s.id, 'services')),
            getDocs(collection(db, 'salons', s.id, 'employes')),
          ]);
          const ca = facturesSnap.docs.reduce((sum, d) => {
            const f = d.data();
            return sum + (f.total ?? 0);
          }, 0);
          statsMap[s.id] = {
            id: s.id,
            clients: clientsSnap.size,
            factures: facturesSnap.size,
            rdv: rdvSnap.size,
            services: servicesSnap.size,
            employes: employesSnap.size,
            chiffreAffaires: ca,
          };
        } catch {
          statsMap[s.id] = { id: s.id, clients: 0, factures: 0, rdv: 0, services: 0, employes: 0, chiffreAffaires: 0 };
        }
      }));
      setSalonStats(statsMap);
    } catch (err) {
      toast.error('Erreur lors du chargement des données.');
      console.error(err);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  // ── Actions affiliés ──────────────────────────────────────
  const toggleStatutAffilié = async (a: AffiliateDoc) => {
    const next = a.statut === 'suspendu' ? 'actif' : 'suspendu';
    await updateDoc(doc(db, 'affiliates', a.uid), { statut: next });
    setAffilies(prev => prev.map(x => x.uid === a.uid ? { ...x, statut: next } : x));
    if (detailAffilié?.uid === a.uid) setDetailAffilié({ ...detailAffilié, statut: next });
    toast.success(`Affilié ${next === 'suspendu' ? 'suspendu' : 'réactivé'}.`);
  };

  const validerPaiement = async () => {
    if (!payModal) return;
    const m = parseFloat(payMontant);
    if (isNaN(m) || m <= 0) { toast.error('Montant invalide.'); return; }
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'affiliates', payModal.uid), {
      commissionsGagnees: payModal.commissionsGagnees + m,
      commissionsPendantes: Math.max(0, payModal.commissionsPendantes - m),
      dernierPaiement: now,
    });
    setAffilies(prev => prev.map(a => a.uid === payModal.uid
      ? { ...a, commissionsGagnees: a.commissionsGagnees + m,
          commissionsPendantes: Math.max(0, a.commissionsPendantes - m), dernierPaiement: now }
      : a));
    toast.success(`Paiement de ${fmt(m)} FCFA enregistré.`);
    setPayModal(null); setPayMontant('');
  };

  const ajusterCommissions = async (a: AffiliateDoc, delta: number) => {
    const next = Math.max(0, a.commissionsPendantes + delta);
    await updateDoc(doc(db, 'affiliates', a.uid), { commissionsPendantes: next });
    setAffilies(prev => prev.map(x => x.uid === a.uid ? { ...x, commissionsPendantes: next } : x));
    if (detailAffilié?.uid === a.uid) setDetailAffilié({ ...detailAffilié, commissionsPendantes: next });
    toast.success('Mis à jour.');
  };

  // ── Actions salons ────────────────────────────────────────
  const changerPlan = async (salon: SalonDoc, plan: string) => {
    await updateDoc(doc(db, 'salons', salon.id), { plan });
    setSalons(prev => prev.map(s => s.id === salon.id ? { ...s, plan } : s));
    if (detailSalon?.id === salon.id) setDetailSalon({ ...detailSalon, plan });
    toast.success(`Plan changé en ${plan}.`);
  };

  const prolongerEssai = async (salon: SalonDoc, jours: number) => {
    const newDays = salon.trialDays + jours;
    await updateDoc(doc(db, 'salons', salon.id), { trialDays: newDays });
    setSalons(prev => prev.map(s => s.id === salon.id ? { ...s, trialDays: newDays } : s));
    if (detailSalon?.id === salon.id) setDetailSalon({ ...detailSalon, trialDays: newDays });
    toast.success(`Essai prolongé de ${jours} jour(s).`);
  };

  // ── Tri générique ─────────────────────────────────────────
  function sortToggle(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIcon({ k }: { k: string }) {
    if (sortKey !== k) return <ChevronDown size={12} className="opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  // ── Stats globales ────────────────────────────────────────
  const totalCA          = Object.values(salonStats).reduce((s, x) => s + x.chiffreAffaires, 0);
  const totalClients     = Object.values(salonStats).reduce((s, x) => s + x.clients, 0);
  const totalFactures    = Object.values(salonStats).reduce((s, x) => s + x.factures, 0);
  const totalRdv         = Object.values(salonStats).reduce((s, x) => s + x.rdv, 0);
  const pendingAff       = affilies.reduce((s, a) => s + a.commissionsPendantes, 0);
  const verseeAff        = affilies.reduce((s, a) => s + a.commissionsGagnees, 0);
  const salonsActifs     = salons.filter(s => joursEssai(s.trialStartDate, s.trialDays) > 0).length;
  const salonsExpires    = salons.length - salonsActifs;

  // ── Salons filtrés ────────────────────────────────────────
  const filteredSalons = salons
    .filter(s => {
      const q = search.toLowerCase();
      const match = !q || `${s.nom} ${s.ville} ${s.telephone}`.toLowerCase().includes(q);
      const matchPlan = filterPlan === 'tous' || s.plan === filterPlan;
      const jours = joursEssai(s.trialStartDate, s.trialDays);
      const matchStatut = filterStatut === 'tous'
        || (filterStatut === 'actif' && jours > 0)
        || (filterStatut === 'expiré' && jours <= 0);
      return match && matchPlan && matchStatut;
    })
    .sort((a, b) => {
      let va: string | number = '', vb: string | number = '';
      if (sortKey === 'nom')       { va = a.nom; vb = b.nom; }
      if (sortKey === 'plan')      { va = a.plan; vb = b.plan; }
      if (sortKey === 'clients')   { va = salonStats[a.id]?.clients ?? 0; vb = salonStats[b.id]?.clients ?? 0; }
      if (sortKey === 'ca')        { va = salonStats[a.id]?.chiffreAffaires ?? 0; vb = salonStats[b.id]?.chiffreAffaires ?? 0; }
      if (sortKey === 'createdAt') { va = a.trialStartDate; vb = b.trialStartDate; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ── Users filtrés ─────────────────────────────────────────
  const filteredUsers = users
    .filter(u => {
      const q = search.toLowerCase();
      return !q || `${u.prenom} ${u.nom} ${u.email} ${u.telephone}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.createdAt < b.createdAt) return sortDir === 'asc' ? -1 : 1;
      if (a.createdAt > b.createdAt) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ── Affiliés filtrés ──────────────────────────────────────
  const filteredAffilies = affilies
    .filter(a => {
      const q = search.toLowerCase();
      const matchQ = !q || `${a.prenom} ${a.nom} ${a.email} ${a.code}`.toLowerCase().includes(q);
      const matchS = filterStatut === 'tous' || (a.statut ?? 'actif') === filterStatut;
      return matchQ && matchS;
    })
    .sort((a, b) => {
      let va: number = 0, vb: number = 0;
      if (sortKey === 'filleuls')             { va = a.filleuls; vb = b.filleuls; }
      if (sortKey === 'commissionsPendantes') { va = a.commissionsPendantes; vb = b.commissionsPendantes; }
      if (sortKey === 'commissionsGagnees')   { va = a.commissionsGagnees; vb = b.commissionsGagnees; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ════════════════════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0a' }}>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="w-full max-w-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-500/15 border border-red-500/25">
                <span className="text-3xl">🔐</span>
              </div>
              <h1 className="text-white font-bold text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                Panneau Administrateur
              </h1>
              <p className="text-gray-500 text-sm mt-1">SalonPro — Accès restreint</p>
            </div>

            {loginErr && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{loginErr}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Identifiant</label>
                <input type="email" value={loginVal} onChange={e => setLoginVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="admin@salonpro.app"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-red-500/60 transition-colors" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={passVal}
                    onChange={e => setPassVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 pr-10 rounded-xl outline-none focus:border-red-500/60 transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button onClick={handleLogin}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all">
                Accéder au panneau admin
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // DASHBOARD ADMIN
  // ════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5" style={{ height: 65 }}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#29B6F6] text-xl font-bold">✦</span>
            <span className="text-white font-bold text-lg">SalonPro</span>
            <span className="text-gray-700 mx-1">·</span>
            <span className="text-red-400 text-sm font-semibold tracking-wide">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => loadData(true)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors" title="Rafraîchir">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setAuthed(false)}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-20 px-4 max-w-7xl mx-auto">

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {([
            { key: 'overview', label: '📊 Vue d\'ensemble' },
            { key: 'salons',   label: `🏪 Salons (${salons.length})` },
            { key: 'users',    label: `👤 Utilisateurs (${users.length})` },
            { key: 'affilies', label: `🤝 Affiliés (${affilies.length})` },
          ] as { key: AdminTab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setSortKey('createdAt'); setSortDir('desc'); setFilterPlan('tous'); setFilterStatut('tous'); }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? '#29B6F6' : '#111',
                color: tab === t.key ? 'white' : '#6b7280',
                border: tab === t.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">Chargement des données...</div>
        ) : (
          <>
            {/* ══ OVERVIEW ══════════════════════════════════ */}
            {tab === 'overview' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
                {/* KPI principaux */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SC label="Salons inscrits"     value={salons.length}              icon={<Building2 size={22}/>}  color="#29B6F6" sub={`${salonsActifs} actifs · ${salonsExpires} expirés`} />
                  <SC label="Utilisateurs"         value={users.length}               icon={<Users size={22}/>}      color="#a78bfa" />
                  <SC label="Clients (tous salons)"value={fmt(totalClients)}          icon={<UserCheck size={22}/>}  color="#22c55e" />
                  <SC label="Chiffre d'affaires"   value={`${fmt(totalCA)} F`}        icon={<TrendingUp size={22}/>} color="#f59e0b" sub="cumulé tous salons" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SC label="Factures émises"      value={fmt(totalFactures)}         icon={<CreditCard size={22}/>} color="#29B6F6" />
                  <SC label="Rendez-vous"           value={fmt(totalRdv)}              icon={<Calendar size={22}/>}   color="#6b7280" />
                  <SC label="Affiliés"              value={affilies.length}            icon={<Star size={22}/>}       color="#f59e0b" />
                  <SC label="Commissions en attente"value={`${fmt(pendingAff)} F`}    icon={<Clock size={22}/>}      color="#ef4444" sub="à verser aux affiliés" />
                </div>

                {/* Répartition plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                      <BarChart3 size={18} className="text-[#29B6F6]" /> Répartition par plan
                    </h3>
                    {['essentiel', 'professionnel', 'reseau'].map(plan => {
                      const count = salons.filter(s => s.plan === plan).length;
                      const pct = salons.length ? Math.round((count / salons.length) * 100) : 0;
                      return (
                        <div key={plan} className="mb-4">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-gray-400 text-sm capitalize">{planLabel[plan]}</span>
                            <span className="text-white text-sm font-medium">{count} salon{count > 1 ? 's' : ''}</span>
                          </div>
                          <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                            <div className="h-2 rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: planColor[plan] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                      <Activity size={18} className="text-[#29B6F6]" /> Top 5 salons (CA)
                    </h3>
                    {Object.values(salonStats)
                      .sort((a, b) => b.chiffreAffaires - a.chiffreAffaires)
                      .slice(0, 5)
                      .map((st, i) => {
                        const salon = salons.find(s => s.id === st.id);
                        if (!salon) return null;
                        const max = Object.values(salonStats)[0]?.chiffreAffaires || 1;
                        return (
                          <div key={st.id} className="flex items-center gap-3 mb-3">
                            <span className="text-gray-600 text-sm w-4">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-white text-sm">{salon.nom}</span>
                                <span className="text-gray-400 text-xs">{fmt(st.chiffreAffaires)} F</span>
                              </div>
                              <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-[#29B6F6]"
                                  style={{ width: `${(st.chiffreAffaires / max) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Inscriptions récentes */}
                <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-5">🆕 5 derniers salons inscrits</h3>
                  <div className="space-y-3">
                    {salons.slice(0, 5).map(s => {
                      const jours = joursEssai(s.trialStartDate, s.trialDays);
                      return (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5">
                          <div>
                            <span className="text-white font-medium text-sm">{s.nom}</span>
                            <span className="text-gray-500 text-xs ml-2">{s.ville}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <PlanBadge plan={s.plan} />
                            <span className={`text-xs font-medium ${jours > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {jours > 0 ? `J+${jours} essai` : 'Expiré'}
                            </span>
                            <span className="text-gray-600 text-xs">{fmtDate(s.trialStartDate)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Affiliés — commissions à payer */}
                {pendingAff > 0 && (
                  <div className="bg-[#1a0a00] border border-[#f59e0b]/20 rounded-2xl p-6">
                    <h3 className="text-[#f59e0b] font-bold mb-4 flex items-center gap-2">
                      <Clock size={18} /> Commissions en attente de paiement
                    </h3>
                    <div className="space-y-2">
                      {affilies.filter(a => a.commissionsPendantes > 0).map(a => (
                        <div key={a.uid} className="flex items-center justify-between py-2 border-b border-white/5">
                          <div>
                            <span className="text-white text-sm font-medium">{a.prenom} {a.nom}</span>
                            <span className="text-gray-500 text-xs ml-2 font-mono">{a.code}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[#f59e0b] font-bold">{fmt(a.commissionsPendantes)} FCFA</span>
                            <button onClick={() => { setPayModal(a); setPayMontant(String(a.commissionsPendantes)); }}
                              className="text-xs bg-green-500/15 border border-green-500/25 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/25 transition-colors flex items-center gap-1">
                              <CheckCircle size={12} /> Payer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ══ SALONS ════════════════════════════════════ */}
            {tab === 'salons' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                {/* Filtres */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher par nom, ville, téléphone..."
                      className="w-full bg-[#111] border border-white/10 text-white placeholder-gray-600 pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['tous', 'essentiel', 'professionnel', 'reseau'].map(p => (
                      <button key={p} onClick={() => setFilterPlan(p)}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize"
                        style={{ backgroundColor: filterPlan === p ? '#29B6F6' : '#111', color: filterPlan === p ? 'white' : '#6b7280', border: filterPlan === p ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                        {p === 'tous' ? 'Tous plans' : p}
                      </button>
                    ))}
                    {['tous', 'actif', 'expiré'].map(s => (
                      <button key={s} onClick={() => setFilterStatut(s)}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize"
                        style={{ backgroundColor: filterStatut === s ? '#6b7280' : '#111', color: filterStatut === s ? 'white' : '#6b7280', border: filterStatut === s ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                        {s === 'tous' ? 'Tout statut' : s}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-4">{filteredSalons.length} salon{filteredSalons.length > 1 ? 's' : ''}</p>

                {/* Tableau desktop */}
                <div className="hidden md:block bg-[#111] border border-white/8 rounded-2xl overflow-hidden mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {[
                          { k: 'nom', l: 'Salon' }, { k: 'plan', l: 'Plan' },
                          { k: 'clients', l: 'Clients' }, { k: 'ca', l: 'CA (FCFA)' },
                          { k: 'createdAt', l: 'Inscrit le' },
                        ].map(c => (
                          <th key={c.k} onClick={() => sortToggle(c.k)}
                            className="text-left text-gray-500 text-xs font-medium px-5 py-4 cursor-pointer hover:text-gray-300 select-none">
                            <span className="flex items-center gap-1">{c.l}<SortIcon k={c.k} /></span>
                          </th>
                        ))}
                        <th className="px-5 py-4 text-gray-500 text-xs font-medium text-left">Essai</th>
                        <th className="px-5 py-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSalons.map(s => {
                        const st = salonStats[s.id];
                        const jours = joursEssai(s.trialStartDate, s.trialDays);
                        return (
                          <tr key={s.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                            <td className="px-5 py-4">
                              <div className="text-white font-medium text-sm">{s.nom}</div>
                              <div className="text-gray-500 text-xs">{s.ville} · {s.telephone}</div>
                            </td>
                            <td className="px-5 py-4"><PlanBadge plan={s.plan} /></td>
                            <td className="px-5 py-4 text-white font-semibold">{st?.clients ?? '—'}</td>
                            <td className="px-5 py-4 text-white">{st ? fmt(st.chiffreAffaires) : '—'}</td>
                            <td className="px-5 py-4 text-gray-400 text-sm">{fmtDate(s.trialStartDate)}</td>
                            <td className="px-5 py-4">
                              <span className={`text-xs font-medium ${jours > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {jours > 0 ? `${jours}j restants` : 'Expiré'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <button onClick={() => setDetailSalon(s)}
                                className="text-gray-400 hover:text-[#29B6F6] transition-colors p-1.5 rounded-lg hover:bg-[#29B6F6]/10">
                                <Eye size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSalons.length === 0 && (
                        <tr><td colSpan={7} className="text-center text-gray-600 py-12">Aucun salon trouvé.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cartes mobile */}
                <div className="md:hidden space-y-3">
                  {filteredSalons.map(s => {
                    const st = salonStats[s.id];
                    const jours = joursEssai(s.trialStartDate, s.trialDays);
                    return (
                      <div key={s.id} className="bg-[#111] border border-white/8 rounded-xl p-4" onClick={() => setDetailSalon(s)}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-white font-semibold">{s.nom}</div>
                            <div className="text-gray-500 text-xs">{s.ville}</div>
                          </div>
                          <PlanBadge plan={s.plan} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-[#1a1a1a] rounded-lg p-2">
                            <div className="text-white font-bold">{st?.clients ?? 0}</div>
                            <div className="text-gray-600 text-xs">clients</div>
                          </div>
                          <div className="bg-[#1a1a1a] rounded-lg p-2">
                            <div className="text-white font-bold">{st?.factures ?? 0}</div>
                            <div className="text-gray-600 text-xs">factures</div>
                          </div>
                          <div className="bg-[#1a1a1a] rounded-lg p-2">
                            <div className={`font-bold text-xs ${jours > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {jours > 0 ? `${jours}j` : 'Expiré'}
                            </div>
                            <div className="text-gray-600 text-xs">essai</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ══ UTILISATEURS ══════════════════════════════ */}
            {tab === 'users' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher par nom, email, téléphone..."
                      className="w-full bg-[#111] border border-white/10 text-white placeholder-gray-600 pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}</p>

                <div className="hidden md:block bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Utilisateur', 'Email', 'Téléphone', 'Salon lié', 'Inscrit le'].map(h => (
                          <th key={h} className="text-left text-gray-500 text-xs font-medium px-5 py-4">{h}</th>
                        ))}
                        <th className="px-5 py-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const salon = salons.find(s => s.id === u.salonId);
                        return (
                          <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                            <td className="px-5 py-4">
                              <div className="text-white font-medium text-sm">{u.prenom} {u.nom}</div>
                            </td>
                            <td className="px-5 py-4 text-gray-400 text-sm">{u.email}</td>
                            <td className="px-5 py-4 text-gray-400 text-sm">{u.telephone}</td>
                            <td className="px-5 py-4">
                              {salon
                                ? <button onClick={() => setDetailSalon(salon)} className="text-[#29B6F6] text-sm hover:underline">{salon.nom}</button>
                                : <span className="text-gray-600 text-xs">—</span>
                              }
                            </td>
                            <td className="px-5 py-4 text-gray-500 text-sm">{fmtDate(u.createdAt)}</td>
                            <td className="px-5 py-4">
                              <button onClick={() => setDetailUser(u)}
                                className="text-gray-400 hover:text-[#29B6F6] transition-colors p-1.5 rounded-lg hover:bg-[#29B6F6]/10">
                                <Eye size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={6} className="text-center text-gray-600 py-12">Aucun utilisateur trouvé.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.map(u => {
                    const salon = salons.find(s => s.id === u.salonId);
                    return (
                      <div key={u.id} className="bg-[#111] border border-white/8 rounded-xl p-4" onClick={() => setDetailUser(u)}>
                        <div className="text-white font-semibold">{u.prenom} {u.nom}</div>
                        <div className="text-gray-500 text-xs">{u.email}</div>
                        <div className="text-gray-500 text-xs">{u.telephone}</div>
                        {salon && <div className="text-[#29B6F6] text-xs mt-1">{salon.nom}</div>}
                        <div className="text-gray-600 text-xs mt-1">{fmtDate(u.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ══ AFFILIÉS ══════════════════════════════════ */}
            {tab === 'affilies' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                {/* Stats affiliés */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <SC label="Affiliés inscrits"    value={affilies.length}                icon={<Star size={20}/>}       color="#f59e0b" />
                  <SC label="Total filleuls"        value={affilies.reduce((s,a)=>s+a.filleuls,0)} icon={<Users size={20}/>} color="#29B6F6" />
                  <SC label="Commissions en attente"value={`${fmt(pendingAff)} F`}        icon={<Clock size={20}/>}      color="#ef4444" />
                  <SC label="Total versé"           value={`${fmt(verseeAff)} F`}         icon={<CheckCircle size={20}/>} color="#22c55e" />
                </div>

                {/* Filtres */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher par nom, email, code..."
                      className="w-full bg-[#111] border border-white/10 text-white placeholder-gray-600 pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm" />
                  </div>
                  <div className="flex gap-2">
                    {['tous', 'actif', 'suspendu'].map(s => (
                      <button key={s} onClick={() => setFilterStatut(s)}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize"
                        style={{ backgroundColor: filterStatut === s ? '#29B6F6' : '#111', color: filterStatut === s ? 'white' : '#6b7280', border: filterStatut === s ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-4">{filteredAffilies.length} affilié{filteredAffilies.length > 1 ? 's' : ''}</p>

                <div className="hidden md:block bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {[
                          { k: 'nom', l: 'Affilié' }, { k: 'filleuls', l: 'Filleuls' },
                          { k: 'commissionsPendantes', l: 'En attente' }, { k: 'commissionsGagnees', l: 'Versées' },
                        ].map(c => (
                          <th key={c.k} onClick={() => sortToggle(c.k)}
                            className="text-left text-gray-500 text-xs font-medium px-5 py-4 cursor-pointer hover:text-gray-300 select-none">
                            <span className="flex items-center gap-1">{c.l}<SortIcon k={c.k} /></span>
                          </th>
                        ))}
                        <th className="text-left text-gray-500 text-xs font-medium px-5 py-4">Taux</th>
                        <th className="text-left text-gray-500 text-xs font-medium px-5 py-4">Statut</th>
                        <th className="px-5 py-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAffilies.map(a => {
                        const statut = a.statut ?? 'actif';
                        const taux   = tauxPourFilleuls(a.filleuls);
                        return (
                          <tr key={a.uid} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                            <td className="px-5 py-4">
                              <div className="text-white font-medium text-sm">{a.prenom} {a.nom}</div>
                              <div className="text-gray-500 text-xs">{a.email}</div>
                              <div className="text-[#29B6F6] text-xs font-mono">{a.code}</div>
                            </td>
                            <td className="px-5 py-4 text-white font-semibold">{a.filleuls}</td>
                            <td className="px-5 py-4 text-[#f59e0b] font-semibold">{fmt(a.commissionsPendantes)} F</td>
                            <td className="px-5 py-4 text-gray-300">{fmt(a.commissionsGagnees)} F</td>
                            <td className="px-5 py-4">
                              <span className="font-bold text-sm" style={{ color: taux===35?'#f59e0b':taux>=28?'#0288D1':taux>=20?'#29B6F6':'#6b7280' }}>
                                {taux} %
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statut==='actif' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                {statut}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => setDetailAffilié(a)}
                                  className="text-gray-400 hover:text-[#29B6F6] p-1.5 rounded-lg hover:bg-[#29B6F6]/10 transition-colors">
                                  <Eye size={15} />
                                </button>
                                <button onClick={() => { setPayModal(a); setPayMontant(String(a.commissionsPendantes)); }}
                                  className="text-gray-400 hover:text-green-400 p-1.5 rounded-lg hover:bg-green-500/10 transition-colors">
                                  <CheckCircle size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredAffilies.length === 0 && (
                        <tr><td colSpan={7} className="text-center text-gray-600 py-12">Aucun affilié trouvé.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile affiliés */}
                <div className="md:hidden space-y-3">
                  {filteredAffilies.map(a => (
                    <div key={a.uid} className="bg-[#111] border border-white/8 rounded-xl p-4">
                      <div className="flex justify-between mb-3">
                        <div>
                          <div className="text-white font-semibold">{a.prenom} {a.nom}</div>
                          <div className="text-[#29B6F6] text-xs font-mono">{a.code}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full h-fit ${(a.statut??'actif')==='actif' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                          {a.statut ?? 'actif'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="bg-[#1a1a1a] rounded-lg p-2">
                          <div className="text-white font-bold">{a.filleuls}</div>
                          <div className="text-gray-600 text-xs">filleuls</div>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-2">
                          <div className="text-[#f59e0b] font-bold text-sm">{fmt(a.commissionsPendantes)}</div>
                          <div className="text-gray-600 text-xs">en attente</div>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-2">
                          <div className="text-[#29B6F6] font-bold">{tauxPourFilleuls(a.filleuls)} %</div>
                          <div className="text-gray-600 text-xs">taux</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setDetailAffilié(a)}
                          className="flex-1 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1">
                          <Eye size={14}/> Détail
                        </button>
                        <button onClick={() => { setPayModal(a); setPayMontant(String(a.commissionsPendantes)); }}
                          className="flex-1 py-2 text-sm rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1">
                          <CheckCircle size={14}/> Payer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ════ MODAL DÉTAIL SALON ═══════════════════════════ */}
      <AnimatePresence>
        {detailSalon && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto"
            onClick={() => setDetailSalon(null)}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg my-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">{detailSalon.nom}</h3>
                <button onClick={() => setDetailSalon(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>

              {/* Infos */}
              <div className="space-y-2 mb-5">
                {[
                  { l: 'Ville', v: detailSalon.ville },
                  { l: 'Adresse', v: detailSalon.adresse },
                  { l: 'Téléphone', v: detailSalon.telephone },
                  { l: 'WhatsApp', v: detailSalon.whatsapp },
                  { l: 'RCCM', v: detailSalon.rccm ?? '—' },
                  { l: 'IFU', v: detailSalon.ifu ?? '—' },
                  { l: 'Inscrit le', v: fmtDate(detailSalon.trialStartDate) },
                  { l: 'Types services', v: (detailSalon.typesServices ?? []).join(', ') || '—' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-500 text-sm">{r.l}</span>
                    <span className="text-white text-sm font-medium text-right max-w-[60%]">{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              {salonStats[detailSalon.id] && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { l: 'Clients',   v: salonStats[detailSalon.id].clients,   c: '#29B6F6' },
                    { l: 'Factures',  v: salonStats[detailSalon.id].factures,  c: '#22c55e' },
                    { l: 'RDV',       v: salonStats[detailSalon.id].rdv,       c: '#a78bfa' },
                    { l: 'Services',  v: salonStats[detailSalon.id].services,  c: '#f59e0b' },
                    { l: 'Employés',  v: salonStats[detailSalon.id].employes,  c: '#6b7280' },
                    { l: 'CA (FCFA)', v: fmt(salonStats[detailSalon.id].chiffreAffaires), c: '#f59e0b' },
                  ].map(s => (
                    <div key={s.l} className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <div className="font-bold" style={{ color: s.c }}>{s.v}</div>
                      <div className="text-gray-600 text-xs mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Essai */}
              <div className="bg-[#1a1a1a] rounded-xl p-4 mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Essai</span>
                  <span className={`font-bold text-sm ${joursEssai(detailSalon.trialStartDate, detailSalon.trialDays) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {joursEssai(detailSalon.trialStartDate, detailSalon.trialDays) > 0
                      ? `${joursEssai(detailSalon.trialStartDate, detailSalon.trialDays)} jour(s) restants`
                      : 'Expiré'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mb-3">Durée configurée : {detailSalon.trialDays} jours</p>
                <div className="flex gap-2">
                  {[7, 14, 30].map(j => (
                    <button key={j} onClick={() => prolongerEssai(detailSalon, j)}
                      className="flex-1 py-2 text-xs rounded-lg bg-[#29B6F6]/10 border border-[#29B6F6]/20 text-[#29B6F6] hover:bg-[#29B6F6]/20 transition-colors">
                      +{j}j
                    </button>
                  ))}
                </div>
              </div>

              {/* Changer plan */}
              <div className="mb-5">
                <p className="text-gray-400 text-sm mb-3">Plan actuel : <PlanBadge plan={detailSalon.plan} /></p>
                <div className="flex gap-2">
                  {['essentiel', 'professionnel', 'reseau'].filter(p => p !== detailSalon.plan).map(p => (
                    <button key={p} onClick={() => changerPlan(detailSalon, p)}
                      className="flex-1 py-2 text-xs rounded-lg border transition-colors capitalize"
                      style={{ color: planColor[p], borderColor: planColor[p] + '40', backgroundColor: planColor[p] + '10' }}>
                      → {p}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODAL DÉTAIL UTILISATEUR ═════════════════════ */}
      <AnimatePresence>
        {detailUser && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
            onClick={() => setDetailUser(null)}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">{detailUser.prenom} {detailUser.nom}</h3>
                <button onClick={() => setDetailUser(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="space-y-2">
                {[
                  { l: 'Email',      v: detailUser.email },
                  { l: 'Téléphone',  v: detailUser.telephone },
                  { l: 'Inscrit le', v: fmtDate(detailUser.createdAt) },
                  { l: 'Salon ID',   v: detailUser.salonId ?? '—' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-500 text-sm">{r.l}</span>
                    <span className="text-white text-sm font-medium">{r.v}</span>
                  </div>
                ))}
              </div>
              {detailUser.salonId && (
                <button onClick={() => {
                  const s = salons.find(x => x.id === detailUser.salonId);
                  if (s) { setDetailUser(null); setDetailSalon(s); setTab('salons'); }
                }} className="mt-5 w-full py-2.5 text-sm rounded-xl border border-[#29B6F6]/30 text-[#29B6F6] hover:bg-[#29B6F6]/10 transition-colors">
                  Voir le salon associé →
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODAL DÉTAIL AFFILIÉ ═════════════════════════ */}
      <AnimatePresence>
        {detailAffilié && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
            onClick={() => setDetailAffilié(null)}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-lg">{detailAffilié.prenom} {detailAffilié.nom}</h3>
                <button onClick={() => setDetailAffilié(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="space-y-2 mb-5">
                {[
                  { l: 'Email', v: detailAffilié.email },
                  { l: 'Téléphone', v: detailAffilié.telephone },
                  { l: 'Code affilié', v: detailAffilié.code, mono: true },
                  { l: 'Inscrit le', v: fmtDate(detailAffilié.createdAt) },
                  { l: 'Dernier paiement', v: detailAffilié.dernierPaiement ? fmtDate(detailAffilié.dernierPaiement) : 'Aucun' },
                ].map(r => (
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-500 text-sm">{r.l}</span>
                    <span className={`text-sm font-medium ${r.mono ? 'text-[#29B6F6] font-mono' : 'text-white'}`}>{r.v}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <div className="text-white font-bold text-xl">{detailAffilié.filleuls}</div>
                  <div className="text-gray-500 text-xs mt-1">Filleuls</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <div className="text-[#f59e0b] font-bold">{fmt(detailAffilié.commissionsPendantes)}</div>
                  <div className="text-gray-500 text-xs mt-1">En attente (F)</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <div className="text-[#29B6F6] font-bold">{tauxPourFilleuls(detailAffilié.filleuls)} %</div>
                  <div className="text-gray-500 text-xs mt-1">Taux</div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4 mb-4">
                <p className="text-gray-400 text-xs mb-3">Ajuster commissions en attente (FCFA)</p>
                <div className="flex gap-2">
                  {[-1000, 1000, 5000].map(d => (
                    <button key={d} onClick={() => ajusterCommissions(detailAffilié, d)}
                      className="flex-1 py-2 text-xs rounded-lg transition-colors"
                      style={{ backgroundColor: d < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: d < 0 ? '#ef4444' : '#22c55e', border: `1px solid ${d < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                      {d > 0 ? '+' : ''}{d.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => toggleStatutAffilié(detailAffilié)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${(detailAffilié.statut ?? 'actif') === 'actif' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                  {(detailAffilié.statut ?? 'actif') === 'actif' ? 'Suspendre' : 'Réactiver'}
                </button>
                <button onClick={() => { setPayModal(detailAffilié); setPayMontant(String(detailAffilié.commissionsPendantes)); setDetailAffilié(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#29B6F6] text-white hover:bg-[#0288D1] transition-all">
                  Payer les commissions
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ MODAL PAIEMENT ═══════════════════════════════ */}
      <AnimatePresence>
        {payModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
            onClick={() => setPayModal(null)}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-bold">Enregistrer un paiement</h3>
                <button onClick={() => setPayModal(null)} className="text-gray-500 hover:text-white"><X size={18}/></button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Affilié : <span className="text-white font-medium">{payModal.prenom} {payModal.nom}</span><br />
                En attente : <span className="text-[#f59e0b] font-semibold">{fmt(payModal.commissionsPendantes)} FCFA</span>
              </p>
              <div className="mb-5">
                <label className="block text-gray-400 text-xs font-medium mb-2">Montant à verser (FCFA)</label>
                <input type="number" value={payMontant} onChange={e => setPayMontant(e.target.value)}
                  placeholder="ex: 15000"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-green-500/60 transition-colors" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPayModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all">
                  Annuler
                </button>
                <button onClick={validerPaiement}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 text-white transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={15}/> Valider
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
