// ============================================================
// ONBOARDING — SalonPro (5 étapes)
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle, ChevronRight, ChevronLeft, Eye, EyeOff, Upload, RotateCcw, Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { authService, salonService, servicesService, employesService } from '../services/api';
import type { ServiceType, Horaires } from '../types';
import toast from 'react-hot-toast';

// ── TYPES ──────────────────────────────────────────────────
type ServiceForm = { nom: string; duree: number; prix: number; description: string };
type EmployeForm = {
  prenom: string; nom: string; telephone: string;
  servicesIds: string[]; horaires: Horaires; actif: boolean;
};

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;
type JourKey = typeof JOURS[number];

const defaultHoraires: Horaires = {
  lundi:    { actif: true,  debut: '08:00', fin: '18:00' },
  mardi:    { actif: true,  debut: '08:00', fin: '18:00' },
  mercredi: { actif: true,  debut: '08:00', fin: '18:00' },
  jeudi:    { actif: true,  debut: '08:00', fin: '18:00' },
  vendredi: { actif: true,  debut: '08:00', fin: '18:00' },
  samedi:   { actif: true,  debut: '09:00', fin: '17:00' },
  dimanche: { actif: false, debut: '00:00', fin: '00:00' },
};

const TYPES_SERVICES: { id: ServiceType; label: string; emoji: string }[] = [
  { id: 'coiffure',    label: 'Coiffure',    emoji: '✂️' },
  { id: 'beaute',      label: 'Beauté',      emoji: '💄' },
  { id: 'esthetique',  label: 'Esthétique',  emoji: '✨' },
  { id: 'maquillage',  label: 'Maquillage',  emoji: '💋' },
  { id: 'tatouage',    label: 'Tatouage',    emoji: '🎨' },
  { id: 'henne',       label: 'Henné',       emoji: '🌿' },
  { id: 'spa',         label: 'Spa',         emoji: '🧖' },
];

// ── STEPPER ───────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Compte' },
  { num: 2, label: 'Salon' },
  { num: 3, label: 'Services' },
  { num: 4, label: 'Signature' },
  { num: 5, label: 'Activation' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                backgroundColor: step.num <= current ? '#29B6F6' : '#1a1a1a',
                border: `2px solid ${step.num <= current ? '#29B6F6' : '#333'}`,
                color: step.num <= current ? 'white' : '#555',
              }}
            >
              {step.num < current ? <CheckCircle size={16} /> : step.num}
            </div>
            <span className="text-xs hidden md:block" style={{ color: step.num <= current ? '#29B6F6' : '#555' }}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="flex-1 h-0.5 mx-1 transition-all"
              style={{ backgroundColor: step.num < current ? '#29B6F6' : '#1a1a1a' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── COMPOSANT CHAMP ────────────────────────────────────────
function Field({
  label, children, required, hint
}: {
  label: string; children: React.ReactNode; required?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-gray-300 text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-gray-600 text-xs mt-1">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function Onboarding() {
  const navigate = useNavigate();
  const sigRef = useRef<SignatureCanvas>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Étape 1 — Compte
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ── Étape 2 — Salon
  const [nomSalon, setNomSalon] = useState('');
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [typesServices, setTypesServices] = useState<ServiceType[]>([]);
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telSalon, setTelSalon] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [rccm, setRccm] = useState('');
  const [ifu, setIfu] = useState('');

  // ── Étape 3 — Services
  const [services, setServices] = useState<ServiceForm[]>([
    { nom: '', duree: 60, prix: 5000, description: '' },
  ]);
  const [employes, setEmployes] = useState<EmployeForm[]>([
    { prenom: '', nom: '', telephone: '', servicesIds: [], horaires: defaultHoraires, actif: true },
  ]);

  // ── Étape 4 — Signature
  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [masquerSignature, setMasquerSignature] = useState(false);
  const [prefixeFacture, setPrefixeFacture] = useState('FAC-');
  const [mentionLegale, setMentionLegale] = useState('Merci pour votre confiance. À bientôt !');
  const [modeSignature, setModeSignature] = useState<'dessiner' | 'upload'>('dessiner');

  // ── Code affilié / promo ───────────────────────────────
  // Priorité : URL (?ref=) > code saisi manuellement
  const [codePromo, setCodePromo]       = useState('');
  const [codeStatut, setCodeStatut]     = useState<'idle' | 'verif' | 'valide' | 'invalide'>('idle');
  const [refAffilie, setRefAffilie]     = useState<string | null>(null);

  // Lire ?ref= dans l'URL OU dans localStorage (posé par Landing)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref');
    const stored  = localStorage.getItem('ref_affilie');
    const code    = (urlRef ?? stored ?? '').trim().toUpperCase();
    if (code) {
      setRefAffilie(code);
      setCodePromo(code);
      setCodeStatut('valide');
    }
    // Incrémenter clics si ref vient de l'URL (= visite directe du lien)
    if (urlRef) {
      (async () => {
        try {
          const q = query(
            collection(db, 'affilies'),
            where('code', '==', urlRef.trim().toUpperCase()),
            where('statut', '==', 'actif'),
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const { updateDoc, increment } = await import('firebase/firestore');
            await updateDoc(snap.docs[0].ref, { clics: increment(1) });
          }
        } catch {
          // silencieux — ne jamais bloquer l'onboarding pour un clic
        }
      })();
    }
  }, []);

  // ── Validation ─────────────────────────────────────────
  const validateStep1 = () => {
    if (!prenom.trim()) { toast.error('Prénom requis'); return false; }
    if (!nom.trim()) { toast.error('Nom requis'); return false; }
    if (!telephone.trim()) { toast.error('Téléphone requis'); return false; }
    if (!email.trim() || !email.includes('@')) { toast.error('Email invalide'); return false; }
    if (password.length < 6) { toast.error('Mot de passe : minimum 6 caractères'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!nomSalon.trim()) { toast.error('Nom du salon requis'); return false; }
    if (typesServices.length === 0) { toast.error('Sélectionnez au moins un type de service'); return false; }
    if (!ville.trim()) { toast.error('Ville requise'); return false; }
    if (!adresse.trim()) { toast.error('Adresse requise'); return false; }
    if (!telSalon.trim()) { toast.error('Téléphone du salon requis'); return false; }
    if (!whatsapp.trim()) { toast.error('WhatsApp requis'); return false; }
    return true;
  };

  const validateStep3 = () => {
    for (const s of services) {
      if (!s.nom.trim()) { toast.error('Nom du service requis'); return false; }
      if (s.prix <= 0) { toast.error('Prix invalide'); return false; }
    }
    for (const e of employes) {
      if (!e.prenom.trim() || !e.nom.trim()) { toast.error('Prénom et nom de l\'employé requis'); return false; }
    }
    return true;
  };

  // ── Navigation étapes ──────────────────────────────────
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  // ── Logo upload ────────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Signature upload ───────────────────────────────────
  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSignature(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveSignatureFromCanvas = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setSignature(sigRef.current.getTrimmedCanvas().toDataURL('image/png'));
      toast.success('Signature sauvegardée !');
    } else {
      toast.error('Veuillez dessiner votre signature');
    }
  };

  // ── Services helpers ────────────────────────────────────
  const addService = () =>
    setServices(prev => [...prev, { nom: '', duree: 60, prix: 5000, description: '' }]);

  const removeService = (i: number) =>
    setServices(prev => prev.filter((_, idx) => idx !== i));

  const updateService = (i: number, field: keyof ServiceForm, value: string | number) =>
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  // ── Employés helpers ────────────────────────────────────
  const addEmploye = () =>
    setEmployes(prev => [...prev, {
      prenom: '', nom: '', telephone: '',
      servicesIds: [], horaires: defaultHoraires, actif: true,
    }]);

  const removeEmploye = (i: number) =>
    setEmployes(prev => prev.filter((_, idx) => idx !== i));

  const updateEmploye = (i: number, field: string, value: string | string[] | boolean | Horaires) =>
    setEmployes(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  const toggleServiceForEmploye = (empIdx: number, srvIdx: number) => {
    const srvId = `srv-local-${srvIdx}`;
    const emp = employes[empIdx];
    const next = emp.servicesIds.includes(srvId)
      ? emp.servicesIds.filter(id => id !== srvId)
      : [...emp.servicesIds, srvId];
    updateEmploye(empIdx, 'servicesIds', next);
  };

  // ── Validation code promo en temps réel ───────────────
  const verifierCode = async (code: string) => {
    const val = code.trim().toUpperCase();
    setCodePromo(val);
    if (!val) {
      setCodeStatut('idle');
      setRefAffilie(null);
      return;
    }
    setCodeStatut('verif');
    try {
      const q = query(
        collection(db, 'affilies'),
        where('code', '==', val),
        where('statut', '==', 'actif'),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setCodeStatut('valide');
        setRefAffilie(val);
        localStorage.setItem('ref_affilie', val); // sync
      } else {
        setCodeStatut('invalide');
        setRefAffilie(null);
      }
    } catch {
      setCodeStatut('idle');
    }
  };

  // ── Finalisation ──────────────────────────────────────
  const handleFinish = async () => {
    setLoading(true);
    try {
      // ── Code affilié final : URL/localStorage > code saisi > null ──
      const codeRef = refAffilie || localStorage.getItem('ref_affilie') || null;

      // ────────────────────────────────────────────────────────────────
      // ⚠️  ORDRE CRITIQUE (imposé par les Firestore Rules) :
      //     1. Firebase Auth  2. users/{uid}  3. salons/{salonId}
      //     Les rules vérifient users/{uid}.salonId avant d'autoriser
      //     l'écriture dans salons — donc user DOIT exister en premier.
      // ────────────────────────────────────────────────────────────────

      // 1. Créer le compte Firebase Auth + doc users/{uid}
      const salonId = `salon-${Date.now()}`;
      const newUser = await authService.register({
        prenom, nom, telephone, email, password,
        salonId,
        refAffilie: codeRef,
      });
      const uid = newUser.id;

      // 2. Créer le salon (rules ok car users/{uid} existe maintenant)
      await salonService.save({
        id: salonId,
        nom: nomSalon,
        logo: logo ?? null,
        typesServices,
        ville,
        adresse,
        telephone: telSalon,
        whatsapp,
        rccm: rccm || null,
        ifu: ifu || null,
        signature,
        masquerSignature,
        prefixeFacture,
        mentionLegale: mentionLegale || null,
        plan: 'professionnel',
        trialStartDate: new Date().toISOString(),
        trialDays: 5,
        refAffilie: codeRef,
      });

      // 3. Logger dans inscriptions/{uid}
      await setDoc(doc(db, 'inscriptions', uid), {
        userId:     uid,
        email:      email.trim(),
        salonNom:   nomSalon,
        ville,
        refAffilie: codeRef,
        source:     codeRef ? 'affiliation' : 'direct',
        createdAt:  serverTimestamp(),
      });

      // 4. Incrémenter filleuls chez l'affilié (si code valide)
      if (codeRef) {
        try {
          const q = query(
            collection(db, 'affilies'),
            where('code', '==', codeRef),
            where('statut', '==', 'actif'),
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const affilieRef = snap.docs[0].ref;
            // Utiliser updateDoc avec increment pour être atomique
            const { updateDoc, increment } = await import('firebase/firestore');
            await updateDoc(affilieRef, { filleuls: increment(1) });
          }
        } catch {
          // Ne pas bloquer l'inscription si l'update affilié échoue
          console.warn('Impossible de mettre à jour le compteur affilié');
        }
      }

      // 5. Enregistrer les services
      for (const srv of services) {
        if (srv.nom.trim()) {
          await servicesService.create({
            nom: srv.nom,
            duree: srv.duree,
            prix: srv.prix,
            description: srv.description || null,
            actif: true,
          });
        }
      }

      // 6. Enregistrer les employés
      for (const emp of employes) {
        if (emp.prenom.trim() && emp.nom.trim()) {
          await employesService.create({
            prenom: emp.prenom,
            nom: emp.nom,
            telephone: emp.telephone,
            servicesIds: emp.servicesIds,
            horaires: emp.horaires,
            actif: true,
          });
        }
      }

      // 7. Nettoyer localStorage APRÈS toutes les écritures Firestore
      localStorage.removeItem('ref_affilie');

      setStep(5);
      toast.success('Votre espace est prêt ! 🎉');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la configuration';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 w-fit mx-auto">
        <span className="text-[#29B6F6] text-xl font-bold">✦</span>
        <span className="text-white font-bold text-xl">SalonPro</span>
      </Link>

      <div className="max-w-2xl mx-auto">
        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >

            {/* ── ÉTAPE 1 — COMPTE ─────────────────────── */}
            {step === 1 && (
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-8">
                <h2 className="font-playfair font-bold text-white text-2xl mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                  👤 Créez votre compte
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Prénom" required>
                    <input className={inputClass} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Mariam" />
                  </Field>
                  <Field label="Nom" required>
                    <input className={inputClass} value={nom} onChange={e => setNom(e.target.value)} placeholder="SARR" />
                  </Field>
                </div>
                <div className="mt-4 space-y-4">
                  <Field label="Téléphone" required>
                    <input className={inputClass} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+221 77 000 00 00" type="tel" />
                  </Field>
                  <Field label="Email" required>
                    <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" type="email" />
                  </Field>
                  <Field label="Mot de passe" required hint="Minimum 6 caractères">
                    <div className="relative">
                      <input
                        className={`${inputClass} pr-12`}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 — SALON ──────────────────────── */}
            {step === 2 && (
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 space-y-5">
                <h2 className="font-playfair font-bold text-white text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                  🏪 Votre salon
                </h2>

                <Field label="Nom du salon" required>
                  <input className={inputClass} value={nomSalon} onChange={e => setNomSalon(e.target.value)} placeholder="Salon Beauté Dorée" />
                </Field>

                {/* Logo upload */}
                <Field label="Logo (optionnel)">
                  <div className="flex items-center gap-4">
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-white/20" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-2xl">✦</div>
                    )}
                    <label className="cursor-pointer flex items-center gap-2 bg-[#1a1a1a] border border-white/10 text-gray-300 px-4 py-2 rounded-xl hover:border-[#29B6F6] transition-colors text-sm">
                      <Upload size={16} />
                      {logo ? 'Changer' : 'Importer un logo'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </Field>

                {/* Types de services */}
                <Field label="Types de services" required>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {TYPES_SERVICES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTypesServices(prev =>
                          prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                        )}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all"
                        style={{
                          backgroundColor: typesServices.includes(t.id) ? 'rgba(41,182,246,0.15)' : '#1a1a1a',
                          borderColor: typesServices.includes(t.id) ? '#29B6F6' : 'rgba(255,255,255,0.1)',
                          color: typesServices.includes(t.id) ? '#29B6F6' : '#999',
                        }}
                      >
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ville" required>
                    <input className={inputClass} value={ville} onChange={e => setVille(e.target.value)} placeholder="Dakar" />
                  </Field>
                  <Field label="Adresse" required>
                    <input className={inputClass} value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="45 Rue de la Paix" />
                  </Field>
                  <Field label="Téléphone salon" required>
                    <input className={inputClass} value={telSalon} onChange={e => setTelSalon(e.target.value)} placeholder="+221 33 867 12 34" type="tel" />
                  </Field>
                  <Field label="WhatsApp" required>
                    <input className={inputClass} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+221 77 867 12 34" type="tel" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="RCCM" hint="Optionnel">
                    <input className={inputClass} value={rccm} onChange={e => setRccm(e.target.value)} placeholder="SN-DKR-2024-B-..." />
                  </Field>
                  <Field label="IFU" hint="Optionnel">
                    <input className={inputClass} value={ifu} onChange={e => setIfu(e.target.value)} placeholder="Numéro IFU" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 3 — SERVICES & EMPLOYÉS ─────────── */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Services */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white text-xl font-playfair" style={{ fontFamily: 'Playfair Display, serif' }}>
                      💈 Vos services
                    </h2>
                    <button onClick={addService} className="flex items-center gap-1 text-[#29B6F6] text-sm hover:underline">
                      <Plus size={16} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-4">
                    {services.map((srv, i) => (
                      <div key={i} className="bg-[#1a1a1a] rounded-xl p-4 space-y-3 relative">
                        {services.length > 1 && (
                          <button
                            onClick={() => removeService(i)}
                            className="absolute top-3 right-3 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <input
                          className={inputClass}
                          value={srv.nom}
                          onChange={e => updateService(i, 'nom', e.target.value)}
                          placeholder="Nom du service (ex: Tresse africaine)"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Durée (minutes)</label>
                            <input
                              type="number"
                              className={inputClass}
                              value={srv.duree}
                              onChange={e => updateService(i, 'duree', parseInt(e.target.value) || 30)}
                              min={15}
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-xs mb-1 block">Prix (FCFA)</label>
                            <input
                              type="number"
                              className={inputClass}
                              value={srv.prix}
                              onChange={e => updateService(i, 'prix', parseInt(e.target.value) || 0)}
                              min={0}
                            />
                          </div>
                        </div>
                        <textarea
                          className={`${inputClass} resize-none h-16`}
                          value={srv.description}
                          onChange={e => updateService(i, 'description', e.target.value)}
                          placeholder="Description (optionnel)"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employés */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white text-xl font-playfair" style={{ fontFamily: 'Playfair Display, serif' }}>
                      👩‍💼 Votre équipe
                    </h2>
                    <button onClick={addEmploye} className="flex items-center gap-1 text-[#29B6F6] text-sm hover:underline">
                      <Plus size={16} /> Ajouter
                    </button>
                  </div>
                  <div className="space-y-4">
                    {employes.map((emp, i) => (
                      <div key={i} className="bg-[#1a1a1a] rounded-xl p-4 space-y-3 relative">
                        {employes.length > 1 && (
                          <button onClick={() => removeEmploye(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <input className={inputClass} value={emp.prenom} onChange={e => updateEmploye(i, 'prenom', e.target.value)} placeholder="Prénom" />
                          <input className={inputClass} value={emp.nom} onChange={e => updateEmploye(i, 'nom', e.target.value)} placeholder="Nom" />
                        </div>
                        <input className={inputClass} value={emp.telephone} onChange={e => updateEmploye(i, 'telephone', e.target.value)} placeholder="Téléphone" type="tel" />

                        {/* Services assignés */}
                        {services.some(s => s.nom.trim()) && (
                          <div>
                            <p className="text-gray-400 text-xs mb-2">Services assignés :</p>
                            <div className="flex flex-wrap gap-2">
                              {services.map((srv, si) => srv.nom.trim() && (
                                <button
                                  key={si}
                                  type="button"
                                  onClick={() => toggleServiceForEmploye(i, si)}
                                  className="px-3 py-1 rounded-full text-xs border transition-all"
                                  style={{
                                    backgroundColor: emp.servicesIds.includes(`srv-local-${si}`) ? 'rgba(41,182,246,0.15)' : '#111',
                                    borderColor: emp.servicesIds.includes(`srv-local-${si}`) ? '#29B6F6' : 'rgba(255,255,255,0.1)',
                                    color: emp.servicesIds.includes(`srv-local-${si}`) ? '#29B6F6' : '#777',
                                  }}
                                >
                                  {srv.nom}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Horaires */}
                        <div>
                          <p className="text-gray-400 text-xs mb-2">Horaires :</p>
                          <div className="space-y-2">
                            {JOURS.map(jour => (
                              <div key={jour} className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={emp.horaires[jour].actif}
                                  onChange={e => updateEmploye(i, 'horaires', {
                                    ...emp.horaires,
                                    [jour]: { ...emp.horaires[jour], actif: e.target.checked },
                                  })}
                                  className="accent-[#29B6F6]"
                                />
                                <span className="text-gray-400 text-xs capitalize w-16">{jour}</span>
                                {emp.horaires[jour].actif && (
                                  <>
                                    <input
                                      type="time"
                                      className="bg-[#111] border border-white/10 text-white text-xs px-2 py-1 rounded-lg focus:border-[#29B6F6] outline-none"
                                      value={emp.horaires[jour].debut}
                                      onChange={e => updateEmploye(i, 'horaires', {
                                        ...emp.horaires,
                                        [jour as JourKey]: { ...emp.horaires[jour as JourKey], debut: e.target.value },
                                      })}
                                    />
                                    <span className="text-gray-600 text-xs">→</span>
                                    <input
                                      type="time"
                                      className="bg-[#111] border border-white/10 text-white text-xs px-2 py-1 rounded-lg focus:border-[#29B6F6] outline-none"
                                      value={emp.horaires[jour].fin}
                                      onChange={e => updateEmploye(i, 'horaires', {
                                        ...emp.horaires,
                                        [jour as JourKey]: { ...emp.horaires[jour as JourKey], fin: e.target.value },
                                      })}
                                    />
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 4 — SIGNATURE & FACTURE ─────────── */}
            {step === 4 && (
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 space-y-6">
                <h2 className="font-playfair font-bold text-white text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
                  ✍️ Signature & Factures
                </h2>

                {/* Mode signature */}
                <div className="flex gap-2">
                  {(['dessiner', 'upload'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setModeSignature(mode)}
                      className="px-4 py-2 rounded-xl text-sm border transition-all"
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
                    <p className="text-gray-400 text-sm mb-2">Dessinez votre signature ci-dessous :</p>
                    <div className="border border-white/20 rounded-xl overflow-hidden" style={{ backgroundColor: '#fff' }}>
                      <SignatureCanvas
                        ref={sigRef}
                        penColor="#0a0a0a"
                        canvasProps={{ width: 500, height: 160, className: 'sigCanvas w-full' }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => sigRef.current?.clear()}
                        className="flex items-center gap-1 text-gray-400 text-sm hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RotateCcw size={14} /> Effacer
                      </button>
                      <button
                        onClick={saveSignatureFromCanvas}
                        className="flex items-center gap-1 text-[#29B6F6] text-sm border border-[#29B6F6]/30 px-3 py-1.5 rounded-lg hover:bg-[#29B6F6]/10 transition-colors"
                      >
                        <CheckCircle size={14} /> Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {signature && (
                      <img src={signature} alt="Signature" className="h-20 mb-2 bg-white rounded-lg p-2 object-contain" />
                    )}
                    <label className="cursor-pointer flex items-center gap-2 bg-[#1a1a1a] border border-white/10 text-gray-300 px-4 py-2 rounded-xl hover:border-[#29B6F6] transition-colors text-sm w-fit">
                      <Upload size={16} />
                      Importer un fichier PNG
                      <input type="file" accept="image/png" className="hidden" onChange={handleSigUpload} />
                    </label>
                  </div>
                )}

                {signature && (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400 text-sm">Signature enregistrée</span>
                  </div>
                )}

                {/* Toggle masquer signature */}
                <div className="flex items-center justify-between bg-[#1a1a1a] rounded-xl p-4">
                  <div>
                    <p className="text-white text-sm font-medium">Masquer la signature sur les factures</p>
                    <p className="text-gray-500 text-xs">La signature ne sera pas affichée sur les PDFs</p>
                  </div>
                  <button
                    onClick={() => setMasquerSignature(!masquerSignature)}
                    className="w-12 h-6 rounded-full transition-all relative"
                    style={{ backgroundColor: masquerSignature ? '#29B6F6' : '#333' }}
                  >
                    <div
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                      style={{ left: masquerSignature ? '26px' : '2px' }}
                    />
                  </button>
                </div>

                {/* Préfixe facture */}
                <Field label="Préfixe numéro de facture" hint="Ex: FAC-0001">
                  <input
                    className={inputClass}
                    value={prefixeFacture}
                    onChange={e => setPrefixeFacture(e.target.value)}
                    placeholder="FAC-"
                  />
                </Field>

                {/* Mention légale */}
                <Field label="Mention légale (optionnel)">
                  <textarea
                    className={`${inputClass} resize-none h-20`}
                    value={mentionLegale}
                    onChange={e => setMentionLegale(e.target.value)}
                    placeholder="Merci pour votre confiance. À bientôt !"
                  />
                </Field>

                {/* ── Code parrain / promo ─────────────────── */}
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    <Tag size={14} className="inline mr-1.5 text-[#29B6F6]" />
                    Code parrain ou promo{' '}
                    <span className="text-gray-600 font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-28 uppercase tracking-widest`}
                      value={codePromo}
                      onChange={e => verifierCode(e.target.value)}
                      placeholder="ex: KOFI202634"
                      maxLength={20}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none">
                      {codeStatut === 'verif'    && <Loader2 size={16} className="animate-spin text-gray-400" />}
                      {codeStatut === 'valide'   && <span className="text-green-400 text-xs">✅ Valide</span>}
                      {codeStatut === 'invalide' && <span className="text-red-400 text-xs">❌ Invalide</span>}
                    </div>
                  </div>
                  {codeStatut === 'valide' && (
                    <p className="text-green-400 text-xs">
                      Code <strong>{codePromo}</strong> appliqué — votre parrain sera crédité 🎉
                    </p>
                  )}
                </div>

                {/* Aperçu facture simplifié */}
                <div className="bg-white rounded-xl p-4 text-[#0a0a0a] text-xs">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                    <div className="font-bold text-base">Salon Exemple</div>
                    <div className="text-gray-500">Dakar, Sénégal</div>
                  </div>
                  <div className="font-bold text-sm mb-1">FACTURE N° {prefixeFacture}0001</div>
                  <div className="text-gray-500 mb-2">Date : {new Date().toLocaleDateString('fr-FR')}</div>
                  <table className="w-full mb-2">
                    <thead><tr className="border-b border-gray-200"><th className="text-left">Service</th><th>Durée</th><th className="text-right">Prix</th></tr></thead>
                    <tbody><tr><td>Tresse africaine</td><td className="text-center">3h</td><td className="text-right">15 000 FCFA</td></tr></tbody>
                  </table>
                  <div className="border-t border-gray-200 pt-2 text-right font-bold">Total : 15 000 FCFA</div>
                  {mentionLegale && <p className="text-gray-400 mt-2 italic">{mentionLegale}</p>}
                  {signature && !masquerSignature && (
                    <img src={signature} alt="Signature" className="h-10 mt-2 object-contain ml-auto" />
                  )}
                </div>
              </div>
            )}

            {/* ── ÉTAPE 5 — ACTIVATION ─────────────────── */}
            {step === 5 && (
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 text-center">
                <div className="text-7xl mb-6">🎉</div>
                <h2 className="font-playfair font-bold text-white text-3xl mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Votre espace est prêt !
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                  Votre salon a été configuré avec succès.<br />
                  Commencez à gérer vos rendez-vous et fidéliser vos clientes.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { emoji: '📅', label: 'Agenda', desc: 'Gérez vos RDV' },
                    { emoji: '👥', label: 'Clients', desc: 'Fidélisez vos clientes' },
                    { emoji: '💰', label: 'Caisse', desc: 'Encaissez facilement' },
                  ].map(item => (
                    <div key={item.label} className="bg-[#1a1a1a] rounded-xl p-4">
                      <div className="text-3xl mb-2">{item.emoji}</div>
                      <div className="text-white font-medium text-sm">{item.label}</div>
                      <div className="text-gray-500 text-xs">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="bg-[#29B6F6] text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-[#0288D1] transition-all hover:scale-105 active:scale-95"
                >
                  Accéder à mon tableau de bord →
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── BOUTONS NAVIGATION ─────────────────────── */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 text-gray-400 hover:text-white border border-white/10 px-5 py-3 rounded-xl transition-all hover:border-white/30"
              >
                <ChevronLeft size={18} /> Retour
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 bg-[#29B6F6] text-white font-bold px-7 py-3 rounded-xl hover:bg-[#0288D1] transition-all active:scale-95"
              >
                Suivant <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-2 bg-[#29B6F6] text-white font-bold px-7 py-3 rounded-xl hover:bg-[#0288D1] transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Création...
                  </>
                ) : (
                  <><CheckCircle size={18} /> Activer mon compte</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
