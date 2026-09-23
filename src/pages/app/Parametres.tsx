// ============================================================
// PARAMÈTRES — SalonPro
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { Save, Upload, RotateCcw, LogOut, CheckCircle, CreditCard } from 'lucide-react';
import { salonService, authService } from '../../services/api';
import { auth } from '../../lib/firebase';
import type { Salon, ServiceType } from '../../types';
import { formatDate, joursEssaiRestants } from '../../utils/helpers';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const TYPES_SERVICES: { id: ServiceType; label: string; emoji: string }[] = [
  { id: 'coiffure',    label: 'Coiffure',    emoji: '✂️' },
  { id: 'beaute',      label: 'Beauté',      emoji: '💄' },
  { id: 'esthetique',  label: 'Esthétique',  emoji: '✨' },
  { id: 'maquillage',  label: 'Maquillage',  emoji: '💋' },
  { id: 'tatouage',    label: 'Tatouage',    emoji: '🎨' },
  { id: 'henne',       label: 'Henné',       emoji: '🌿' },
  { id: 'spa',         label: 'Spa',         emoji: '🧖' },
];

const PLANS: Record<string, { label: string; prix: number; emoji: string; description: string }> = {
  essentiel:      { label: 'Essentiel',      prix: 7000,  emoji: '🌱', description: "Jusqu'à 100 clients" },
  professionnel:  { label: 'Professionnel',  prix: 12000, emoji: '💎', description: "Jusqu'à 3 salons / collaborateurs" },
  reseau:         { label: 'Réseau',         prix: 20000, emoji: '🏢', description: 'Multi-salons illimités' },
};

const UPGRADE_PLANS = [
  { id: 'essentiel',     emoji: '🌱', label: 'Essentiel',     prix: 7_000,  description: "Jusqu'à 100 clients" },
  { id: 'professionnel', emoji: '💎', label: 'Professionnel', prix: 12_000, description: "Jusqu'à 3 salons / collaborateurs", highlight: true },
  { id: 'reseau',        emoji: '🏢', label: 'Réseau',        prix: 20_000, description: 'Multi-salons illimités' },
];

const WORKER_URL = 'https://yea-backend.wakilouboukari9.workers.dev/asbeauty/create-payment';

export default function Parametres() {
  const navigate = useNavigate();
  const sigRef = useRef<SignatureCanvas>(null);
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [saving, setSaving] = useState(false);
  const [modeSignature, setModeSignature] = useState<'dessiner' | 'upload'>('dessiner');
  const [sigSaved, setSigSaved] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Form state
  const [nom, setNom] = useState('');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [typesServices, setTypesServices] = useState<ServiceType[]>([]);
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [rccm, setRccm] = useState('');
  const [ifu, setIfu] = useState('');
  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [masquerSignature, setMasquerSignature] = useState(false);
  const [prefixeFacture, setPrefixeFacture] = useState('FAC-');
  const [mentionLegale, setMentionLegale] = useState('');

  useEffect(() => {
    salonService.get().then(s => {
      if (s) {
        setSalon(s);
        setNom(s.nom);
        setLogo(s.logo);
        setTypesServices(s.typesServices);
        setVille(s.ville);
        setAdresse(s.adresse);
        setTelephone(s.telephone);
        setWhatsapp(s.whatsapp);
        setRccm(s.rccm ?? '');
        setIfu(s.ifu ?? '');
        setSignature(s.signature);
        setMasquerSignature(s.masquerSignature);
        setPrefixeFacture(s.prefixeFacture);
        setMentionLegale(s.mentionLegale ?? '');
      }
      setLoading(false);
    });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setSignature(ev.target?.result as string); setSigSaved(true); };
    reader.readAsDataURL(file);
  };

  const saveSignatureFromCanvas = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setSignature(sigRef.current.getTrimmedCanvas().toDataURL('image/png'));
      setSigSaved(true);
      toast.success('Signature enregistrée');
    } else {
      toast.error('Dessinez votre signature d\'abord');
    }
  };

  const toggleType = (t: ServiceType) => {
    setTypesServices(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const handleUpgrade = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');

      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan:        planId,
          userId:      currentUser.uid,
          email:       currentUser.email,
          phone:       currentUser.phoneNumber || salon?.telephone || '66000001',
          firstname:   currentUser.displayName?.split(' ')[0] || 'Client',
          lastname:    currentUser.displayName?.split(' ')[1] || 'ASBeauty',
          country:     'bj',
          affiliateId: 'direct',
        }),
      });

      const json = await res.json() as { paymentUrl?: string; error?: string };
      if (!res.ok) throw new Error(json.error || 'Erreur initialisation paiement');

      if (json.paymentUrl) {
        window.location.href = json.paymentUrl;
      } else {
        throw new Error('URL de paiement introuvable dans la réponse.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Réessaie.';
      toast.error(msg);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSave = async () => {
    if (!nom.trim()) { toast.error('Nom du salon requis'); return; }
    if (!salon) return;
    setSaving(true);
    try {
      await salonService.save({
        ...salon,
        nom,
        logo,
        typesServices,
        ville,
        adresse,
        telephone,
        whatsapp,
        rccm: rccm || null,
        ifu: ifu || null,
        signature,
        masquerSignature,
        prefixeFacture,
        mentionLegale: mentionLegale || null,
      });
      toast.success('Paramètres sauvegardés ✅');
      const updated = await salonService.get();
      if (updated) setSalon(updated);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Déconnecté avec succès');
    navigate('/login');
  };

  if (loading || !salon) {
    return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  }

  const joursRestants = joursEssaiRestants(salon.trialStartDate, salon.trialDays);
  const plan = PLANS[salon.plan] ?? PLANS['professionnel'];

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm placeholder-gray-600';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Paramètres
          </h1>
          <p className="text-gray-400 text-sm mt-1">Configuration de votre salon</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#29B6F6] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors text-sm disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Plan & Abonnement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111111] border border-white/5 rounded-2xl p-6"
      >
        <h2 className="text-white font-bold mb-4">📋 Plan & Abonnement</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">Plan actuel</p>
            <p className="text-white font-bold">{plan.emoji} {plan.label}</p>
            <p className="text-[#29B6F6] text-sm">{new Intl.NumberFormat('fr-FR').format(plan.prix)} FCFA/mois</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">Période d'essai</p>
            <p
              className="font-bold text-lg"
              style={{ color: joursRestants <= 2 ? '#ef4444' : joursRestants <= 5 ? '#f97316' : '#22c55e' }}
            >
              {joursRestants}j
            </p>
            <p className="text-gray-600 text-xs">restants</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">Début essai</p>
            <p className="text-white text-sm font-medium">{formatDate(salon.trialStartDate)}</p>
          </div>
        </div>
        <div className="mt-5">
          <p className="text-gray-400 text-xs mb-3 text-center">Changer de plan — paiement immédiat par Mobile Money</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {UPGRADE_PLANS.map(p => {
              const isCurrent = salon.plan === p.id;
              const isLoading = loadingPlan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => !isCurrent && handleUpgrade(p.id)}
                  disabled={isCurrent || isLoading}
                  className="relative flex flex-col items-center gap-1 px-3 py-4 rounded-xl border text-sm font-medium transition-all disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isCurrent
                      ? 'rgba(41,182,246,0.12)'
                      : p.highlight
                      ? '#1a1a1a'
                      : '#141414',
                    borderColor: isCurrent
                      ? '#29B6F6'
                      : p.highlight
                      ? 'rgba(41,182,246,0.35)'
                      : 'rgba(255,255,255,0.08)',
                    color: isCurrent ? '#29B6F6' : '#ccc',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {p.highlight && !isCurrent && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#29B6F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      RECOMMANDÉ
                    </span>
                  )}
                  <span className="text-xl">{p.emoji}</span>
                  <span className="font-bold text-white">{p.label}</span>
                  <span className="text-[#29B6F6] text-xs font-semibold">
                    {p.prix.toLocaleString('fr-FR')} FCFA/mois
                  </span>
                  <span className="text-gray-500 text-[10px]">{p.description}</span>
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-[#29B6F6] text-xs mt-1">
                      <CheckCircle size={11} /> Plan actuel
                    </span>
                  ) : isLoading ? (
                    <span className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Redirection...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-300 text-xs mt-1">
                      <CreditCard size={11} /> Payer par MoMo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Infos salon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-white font-bold">🏪 Informations du salon</h2>

        {/* Logo */}
        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-white/20" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-2xl">✦</div>
          )}
          <label className="cursor-pointer flex items-center gap-2 bg-[#1a1a1a] border border-white/10 text-gray-300 px-4 py-2 rounded-xl hover:border-[#29B6F6] transition-colors text-sm">
            <Upload size={16} />
            {logo ? 'Changer le logo' : 'Importer un logo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
          {logo && (
            <button onClick={() => setLogo(undefined)} className="text-red-400 text-sm hover:text-red-300">Supprimer</button>
          )}
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-1 block">Nom du salon *</label>
          <input className={inputCls} value={nom} onChange={e => setNom(e.target.value)} placeholder="Mon salon" />
        </div>

        {/* Types de services */}
        <div>
          <label className="text-gray-400 text-xs mb-2 block">Types de services</label>
          <div className="flex flex-wrap gap-2">
            {TYPES_SERVICES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleType(t.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border transition-all"
                style={{
                  backgroundColor: typesServices.includes(t.id) ? 'rgba(41,182,246,0.15)' : '#1a1a1a',
                  borderColor: typesServices.includes(t.id) ? '#29B6F6' : 'rgba(255,255,255,0.1)',
                  color: typesServices.includes(t.id) ? '#29B6F6' : '#999',
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Ville</label>
            <input className={inputCls} value={ville} onChange={e => setVille(e.target.value)} placeholder="Dakar" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Adresse</label>
            <input className={inputCls} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="45 Rue..." />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Téléphone</label>
            <input className={inputCls} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+221 33..." type="tel" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">WhatsApp</label>
            <input className={inputCls} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+221 77..." type="tel" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">RCCM</label>
            <input className={inputCls} value={rccm} onChange={e => setRccm(e.target.value)} placeholder="Optionnel" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">IFU</label>
            <input className={inputCls} value={ifu} onChange={e => setIfu(e.target.value)} placeholder="Optionnel" />
          </div>
        </div>
      </motion.div>

      {/* Factures */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4"
      >
        <h2 className="text-white font-bold">🧾 Configuration des factures</h2>

        <div>
          <label className="text-gray-400 text-xs mb-1 block">Préfixe numéro de facture</label>
          <input className={inputCls} value={prefixeFacture} onChange={e => setPrefixeFacture(e.target.value)} placeholder="FAC-" />
          <p className="text-gray-600 text-xs mt-1">Ex: {prefixeFacture}0001</p>
        </div>

        <div>
          <label className="text-gray-400 text-xs mb-1 block">Mention légale</label>
          <textarea
            className={`${inputCls} resize-none h-20`}
            value={mentionLegale}
            onChange={e => setMentionLegale(e.target.value)}
            placeholder="Merci pour votre confiance. À bientôt !"
          />
        </div>

        {/* Signature */}
        <div>
          <label className="text-gray-400 text-xs mb-2 block">Signature électronique</label>
          <div className="flex gap-2 mb-3">
            {(['dessiner', 'upload'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setModeSignature(mode)}
                className="px-3 py-1.5 rounded-xl text-xs border transition-all"
                style={{
                  backgroundColor: modeSignature === mode ? 'rgba(41,182,246,0.15)' : '#1a1a1a',
                  borderColor: modeSignature === mode ? '#29B6F6' : 'rgba(255,255,255,0.1)',
                  color: modeSignature === mode ? '#29B6F6' : '#999',
                }}
              >
                {mode === 'dessiner' ? '✏️ Dessiner' : '📤 Importer PNG'}
              </button>
            ))}
          </div>

          {modeSignature === 'dessiner' ? (
            <div>
              <div className="border border-white/20 rounded-xl overflow-hidden bg-white mb-2">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#0a0a0a"
                  canvasProps={{ width: 500, height: 120, className: 'sigCanvas w-full' }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => sigRef.current?.clear()} className="flex items-center gap-1 text-gray-400 text-xs border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition-colors">
                  <RotateCcw size={12} /> Effacer
                </button>
                <button onClick={saveSignatureFromCanvas} className="flex items-center gap-1 text-[#29B6F6] text-xs border border-[#29B6F6]/30 px-3 py-1.5 rounded-lg hover:bg-[#29B6F6]/10 transition-colors">
                  <CheckCircle size={12} /> Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div>
              {signature && (
                <img src={signature} alt="Signature actuelle" className="h-16 mb-2 bg-white rounded-lg p-2 object-contain" />
              )}
              <label className="cursor-pointer flex items-center gap-2 bg-[#1a1a1a] border border-white/10 text-gray-300 px-4 py-2 rounded-xl hover:border-[#29B6F6] transition-colors text-sm w-fit">
                <Upload size={16} /> Importer PNG
                <input type="file" accept="image/png" className="hidden" onChange={handleSigUpload} />
              </label>
            </div>
          )}

          {(signature || sigSaved) && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-2 mt-2">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-green-400 text-xs">Signature disponible</span>
            </div>
          )}
        </div>

        {/* Toggle masquer signature */}
        <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-4">
          <div>
            <p className="text-white text-sm">Masquer la signature sur les factures</p>
            <p className="text-gray-600 text-xs">La signature ne sera pas imprimée</p>
          </div>
          <button
            onClick={() => setMasquerSignature(!masquerSignature)}
            className="w-12 h-6 rounded-full transition-all relative shrink-0"
            style={{ backgroundColor: masquerSignature ? '#29B6F6' : '#333' }}
          >
            <div
              className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
              style={{ left: masquerSignature ? '26px' : '2px' }}
            />
          </button>
        </div>
      </motion.div>

      {/* Déconnexion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#111111] border border-red-500/20 rounded-2xl p-6"
      >
        <h2 className="text-white font-bold mb-4">⚠️ Zone de danger</h2>
        <p className="text-gray-400 text-sm mb-4">
          La déconnexion vous redirigera vers la page de connexion.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl font-medium hover:bg-red-500/20 transition-colors text-sm"
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      </motion.div>
    </div>
  );
}
