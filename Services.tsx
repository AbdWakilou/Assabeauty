// ============================================================
// SERVICES & EMPLOYÉS — SalonPro
// ============================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Scissors, Users } from 'lucide-react';
import { servicesService, employesService } from '../../services/api';
import type { Service, Employe, Horaires } from '../../types';
import { formatFCFA, formatDuree } from '../../utils/helpers';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

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

const defaultServiceForm = () => ({ nom: '', duree: 60, prix: 5000, description: '', actif: true });
const defaultEmployeForm = () => ({
  prenom: '', nom: '', telephone: '', servicesIds: [] as string[], horaires: defaultHoraires, actif: true,
});

export default function Services() {
  const [activeTab, setActiveTab] = useState<'services' | 'employes'>('services');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);

  const [showSrvModal, setShowSrvModal] = useState(false);
  const [editingSrv, setEditingSrv] = useState<Service | null>(null);
  const [srvForm, setSrvForm] = useState(defaultServiceForm());
  const [savingSrv, setSavingSrv] = useState(false);

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employe | null>(null);
  const [empForm, setEmpForm] = useState(defaultEmployeForm());
  const [savingEmp, setSavingEmp] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([servicesService.getAll(), employesService.getAll()]);
      setServices(s);
      setEmployes(e);
    } finally {
      setLoading(false);
    }
  };

  // ── SERVICES ─────────────────────────────────────────────
  const openCreateSrv = () => { setEditingSrv(null); setSrvForm(defaultServiceForm()); setShowSrvModal(true); };
  const openEditSrv = (s: Service) => { setEditingSrv(s); setSrvForm({ nom: s.nom, duree: s.duree, prix: s.prix, description: s.description ?? '', actif: s.actif }); setShowSrvModal(true); };

  const handleSaveSrv = async () => {
    if (!srvForm.nom.trim()) { toast.error('Nom du service requis'); return; }
    setSavingSrv(true);
    try {
      if (editingSrv) {
        await servicesService.update(editingSrv.id, srvForm);
        toast.success('Service mis à jour ✅');
      } else {
        await servicesService.create(srvForm);
        toast.success('Service créé ✅');
      }
      setShowSrvModal(false);
      await loadAll();
    } catch { toast.error('Erreur'); } finally { setSavingSrv(false); }
  };

  const handleDeleteSrv = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return;
    try { await servicesService.delete(id); toast.success('Service supprimé'); await loadAll(); }
    catch { toast.error('Erreur lors de la suppression'); }
  };

  const toggleSrvActif = async (s: Service) => {
    await servicesService.update(s.id, { actif: !s.actif });
    toast.success(s.actif ? 'Service désactivé' : 'Service réactivé');
    await loadAll();
  };

  // ── EMPLOYÉS ─────────────────────────────────────────────
  const openCreateEmp = () => { setEditingEmp(null); setEmpForm(defaultEmployeForm()); setShowEmpModal(true); };
  const openEditEmp = (e: Employe) => {
    setEditingEmp(e);
    setEmpForm({ prenom: e.prenom, nom: e.nom, telephone: e.telephone, servicesIds: e.servicesIds, horaires: e.horaires, actif: e.actif });
    setShowEmpModal(true);
  };

  const handleSaveEmp = async () => {
    if (!empForm.prenom.trim() || !empForm.nom.trim()) { toast.error('Prénom et nom requis'); return; }
    setSavingEmp(true);
    try {
      if (editingEmp) {
        await employesService.update(editingEmp.id, empForm);
        toast.success('Employé mis à jour ✅');
      } else {
        await employesService.create(empForm);
        toast.success('Employé créé ✅');
      }
      setShowEmpModal(false);
      await loadAll();
    } catch { toast.error('Erreur'); } finally { setSavingEmp(false); }
  };

  const handleDeleteEmp = async (id: string) => {
    if (!confirm('Supprimer cet employé ?')) return;
    try { await employesService.delete(id); toast.success('Employé supprimé'); await loadAll(); }
    catch { toast.error('Erreur'); }
  };

  const toggleEmpActif = async (e: Employe) => {
    await employesService.update(e.id, { actif: !e.actif });
    toast.success(e.actif ? 'Employé désactivé' : 'Employé réactivé');
    await loadAll();
  };

  const toggleSrvForEmp = (srvId: string) => {
    setEmpForm(p => ({
      ...p,
      servicesIds: p.servicesIds.includes(srvId)
        ? p.servicesIds.filter(id => id !== srvId)
        : [...p.servicesIds, srvId],
    }));
  };

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm placeholder-gray-600';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Services & Équipe
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gérez vos prestations et votre équipe</p>
        </div>
        <button
          onClick={activeTab === 'services' ? openCreateSrv : openCreateEmp}
          className="flex items-center gap-2 bg-[#29B6F6] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors text-sm"
        >
          <Plus size={18} /> {activeTab === 'services' ? 'Nouveau service' : 'Nouvel employé'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#111111] border border-white/5 rounded-xl p-1 w-fit">
        {([
          { id: 'services', icon: <Scissors size={16} />, label: 'Services' },
          { id: 'employes', icon: <Users size={16} />, label: 'Équipe' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? '#29B6F6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#888',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : activeTab === 'services' ? (
        /* ── SERVICES ─────────────────────────────────────── */
        services.length === 0 ? (
          <EmptyState icon="💈" title="Aucun service" description="Créez votre premier service." ctaLabel="Créer un service" onCta={openCreateSrv} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#111111] border border-white/5 rounded-2xl p-5"
                style={{ opacity: s.actif ? 1 : 0.5 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#29B6F620', border: '1px solid #29B6F640' }}
                  >
                    <Scissors size={18} className="text-[#29B6F6]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleSrvActif(s)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" title={s.actif ? 'Désactiver' : 'Activer'}>
                      {s.actif ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} className="text-gray-500" />}
                    </button>
                    <button onClick={() => openEditSrv(s)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#29B6F6]/20 flex items-center justify-center transition-colors">
                      <Edit2 size={13} className="text-gray-400" />
                    </button>
                    <button onClick={() => handleDeleteSrv(s.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                      <Trash2 size={13} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                <h3 className="text-white font-bold mb-1">{s.nom}</h3>
                {s.description && <p className="text-gray-500 text-xs mb-3">{s.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-[#29B6F6] font-bold">{formatFCFA(s.prix)}</span>
                  <span className="text-gray-500 text-sm">{formatDuree(s.duree)}</span>
                </div>
                {!s.actif && <p className="text-orange-400 text-xs mt-2">⚠️ Service désactivé</p>}
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* ── EMPLOYÉS ────────────────────────────────────── */
        employes.length === 0 ? (
          <EmptyState icon="👩‍💼" title="Aucun employé" description="Ajoutez votre premier employé." ctaLabel="Ajouter un employé" onCta={openCreateEmp} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {employes.map((emp, i) => {
              const empServices = services.filter(s => emp.servicesIds.includes(s.id));
              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#111111] border border-white/5 rounded-2xl p-5"
                  style={{ opacity: emp.actif ? 1 : 0.5 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                        style={{ backgroundColor: '#29B6F6' }}
                      >
                        {emp.prenom[0]}
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{emp.prenom} {emp.nom}</h3>
                        <p className="text-gray-500 text-xs">{emp.telephone}</p>
                        {!emp.actif && <p className="text-orange-400 text-xs">⚠️ Inactif</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleEmpActif(emp)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                        {emp.actif ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} className="text-gray-500" />}
                      </button>
                      <button onClick={() => openEditEmp(emp)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#29B6F6]/20 flex items-center justify-center transition-colors">
                        <Edit2 size={13} className="text-gray-400" />
                      </button>
                      <button onClick={() => handleDeleteEmp(emp.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <Trash2 size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Services assignés */}
                  {empServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {empServices.map(s => (
                        <span key={s.id} className="text-xs bg-[#29B6F6]/10 text-[#29B6F6] border border-[#29B6F6]/20 px-2 py-0.5 rounded-full">
                          {s.nom}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Horaires résumé */}
                  <div className="flex flex-wrap gap-1">
                    {JOURS.map(jour => (
                      emp.horaires[jour].actif && (
                        <span key={jour} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                          {jour.slice(0, 3)}
                        </span>
                      )
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Modal Service */}
      <Modal open={showSrvModal} onClose={() => setShowSrvModal(false)} title={editingSrv ? 'Modifier le service' : 'Nouveau service'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Nom *</label>
            <input className={inputCls} value={srvForm.nom} onChange={e => setSrvForm(p => ({ ...p, nom: e.target.value }))} placeholder="Tresse africaine" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Durée (min) *</label>
              <input type="number" className={inputCls} value={srvForm.duree} onChange={e => setSrvForm(p => ({ ...p, duree: parseInt(e.target.value) || 30 }))} min={15} />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Prix (FCFA) *</label>
              <input type="number" className={inputCls} value={srvForm.prix} onChange={e => setSrvForm(p => ({ ...p, prix: parseInt(e.target.value) || 0 }))} min={0} />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Description</label>
            <textarea className={`${inputCls} resize-none h-16`} value={srvForm.description} onChange={e => setSrvForm(p => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowSrvModal(false)} className="flex-1 border border-white/10 text-gray-400 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm">Annuler</button>
            <button onClick={handleSaveSrv} disabled={savingSrv} className="flex-1 bg-[#29B6F6] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] disabled:opacity-50 transition-colors text-sm">
              {savingSrv ? 'Sauvegarde...' : editingSrv ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Employé */}
      <Modal open={showEmpModal} onClose={() => setShowEmpModal(false)} title={editingEmp ? 'Modifier l\'employé' : 'Nouvel employé'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Prénom *</label>
              <input className={inputCls} value={empForm.prenom} onChange={e => setEmpForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Khadija" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Nom *</label>
              <input className={inputCls} value={empForm.nom} onChange={e => setEmpForm(p => ({ ...p, nom: e.target.value }))} placeholder="SALL" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Téléphone</label>
            <input className={inputCls} value={empForm.telephone} onChange={e => setEmpForm(p => ({ ...p, telephone: e.target.value }))} placeholder="+221 76 234 56 78" type="tel" />
          </div>

          {/* Services assignés */}
          {services.length > 0 && (
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Services assignés</label>
              <div className="flex flex-wrap gap-2">
                {services.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSrvForEmp(s.id)}
                    className="px-3 py-1 rounded-full text-xs border transition-all"
                    style={{
                      backgroundColor: empForm.servicesIds.includes(s.id) ? 'rgba(41,182,246,0.15)' : '#1a1a1a',
                      borderColor: empForm.servicesIds.includes(s.id) ? '#29B6F6' : 'rgba(255,255,255,0.1)',
                      color: empForm.servicesIds.includes(s.id) ? '#29B6F6' : '#999',
                    }}
                  >
                    {s.nom}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Horaires */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Horaires</label>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
              {JOURS.map(jour => (
                <div key={jour} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={empForm.horaires[jour].actif}
                    onChange={e => setEmpForm(p => ({
                      ...p,
                      horaires: { ...p.horaires, [jour]: { ...p.horaires[jour], actif: e.target.checked } }
                    }))}
                    className="accent-[#29B6F6]"
                  />
                  <span className="text-gray-400 text-xs capitalize w-16">{jour}</span>
                  {empForm.horaires[jour].actif && (
                    <>
                      <input
                        type="time"
                        className="bg-[#111] border border-white/10 text-white text-xs px-2 py-1 rounded-lg focus:border-[#29B6F6] outline-none"
                        value={empForm.horaires[jour].debut}
                        onChange={e => setEmpForm(p => ({
                          ...p,
                          horaires: { ...p.horaires, [jour as JourKey]: { ...p.horaires[jour as JourKey], debut: e.target.value } }
                        }))}
                      />
                      <span className="text-gray-600 text-xs">→</span>
                      <input
                        type="time"
                        className="bg-[#111] border border-white/10 text-white text-xs px-2 py-1 rounded-lg focus:border-[#29B6F6] outline-none"
                        value={empForm.horaires[jour].fin}
                        onChange={e => setEmpForm(p => ({
                          ...p,
                          horaires: { ...p.horaires, [jour as JourKey]: { ...p.horaires[jour as JourKey], fin: e.target.value } }
                        }))}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowEmpModal(false)} className="flex-1 border border-white/10 text-gray-400 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm">Annuler</button>
            <button onClick={handleSaveEmp} disabled={savingEmp} className="flex-1 bg-[#29B6F6] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] disabled:opacity-50 transition-colors text-sm">
              {savingEmp ? 'Sauvegarde...' : editingEmp ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
