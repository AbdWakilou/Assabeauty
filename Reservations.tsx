// ============================================================
// RÉSERVATIONS — SalonPro
// ============================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import { rendezVousService, clientsService, servicesService, employesService } from '../../services/api';
import type { RendezVous, Client, Service, Employe, StatutRDV } from '../../types';
import { formatDate, statutRDVLabel, statutRDVColor } from '../../utils/helpers';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const STATUTS: StatutRDV[] = ['confirme', 'en_attente', 'annule', 'termine', 'no_show'];

export default function Reservations() {
  const [loading, setLoading] = useState(true);
  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutRDV | 'tous'>('tous');
  const [showModal, setShowModal] = useState(false);
  const [editingRdv, setEditingRdv] = useState<RendezVous | null>(null);

  // Form state
  const [formClientId, setFormClientId] = useState('');
  const [formEmployeId, setFormEmployeId] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formHeure, setFormHeure] = useState('09:00');
  const [formStatut, setFormStatut] = useState<StatutRDV>('confirme');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, c, s, e] = await Promise.all([
        rendezVousService.getAll(),
        clientsService.getAll(),
        servicesService.getAll(),
        employesService.getAll(),
      ]);
      setRdvList(r.sort((a, b) => `${b.date} ${b.heure}`.localeCompare(`${a.date} ${a.heure}`)));
      setClients(c);
      setServices(s);
      setEmployes(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRdv(null);
    setFormClientId('');
    setFormEmployeId('');
    setFormServiceId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormHeure('09:00');
    setFormStatut('confirme');
    setFormNotes('');
    setShowModal(true);
  };

  const openEdit = (rdv: RendezVous) => {
    setEditingRdv(rdv);
    setFormClientId(rdv.clientId);
    setFormEmployeId(rdv.employeId);
    setFormServiceId(rdv.serviceId);
    setFormDate(rdv.date);
    setFormHeure(rdv.heure);
    setFormStatut(rdv.statut);
    setFormNotes(rdv.notes ?? '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formClientId || !formEmployeId || !formServiceId || !formDate || !formHeure) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      const data = {
        clientId: formClientId,
        employeId: formEmployeId,
        serviceId: formServiceId,
        date: formDate,
        heure: formHeure,
        statut: formStatut,
        notes: formNotes || null,
      };
      if (editingRdv) {
        await rendezVousService.update(editingRdv.id, data);
        toast.success('Rendez-vous mis à jour ✅');
      } else {
        await rendezVousService.create(data);
        toast.success('Rendez-vous créé ✅');
      }
      setShowModal(false);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await rendezVousService.delete(id);
      toast.success('Rendez-vous supprimé');
      await loadAll();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleChangeStatut = async (rdv: RendezVous, statut: StatutRDV) => {
    try {
      await rendezVousService.update(rdv.id, { statut });
      toast.success(`Statut mis à jour : ${statutRDVLabel(statut)}`);
      await loadAll();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Filtrage
  const filtered = rdvList.filter((rdv) => {
    const client = clients.find((c) => c.id === rdv.clientId);
    const nom = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
    const matchSearch = !search || nom.includes(search.toLowerCase());
    const matchStatut = filterStatut === 'tous' || rdv.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm';
  const selectCls = 'w-full bg-[#1a1a1a] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Réservations
          </h1>
          <p className="text-gray-400 text-sm mt-1">{rdvList.length} rendez-vous enregistrés</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#29B6F6] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors text-sm"
        >
          <Plus size={18} /> Nouveau RDV
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full bg-[#111111] border border-white/10 text-white pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            className="bg-[#111111] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as StatutRDV | 'tous')}
          >
            <option value="tous">Tous les statuts</option>
            {STATUTS.map((s) => <option key={s} value={s}>{statutRDVLabel(s)}</option>)}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Aucun rendez-vous"
          description="Créez votre premier rendez-vous pour commencer à gérer votre agenda."
          ctaLabel="Créer un RDV"
          onCta={openCreate}
        />
      ) : (
        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Client</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Service</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Employé</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Date & Heure</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Statut</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rdv, i) => {
                  const client = clients.find((c) => c.id === rdv.clientId);
                  const service = services.find((s) => s.id === rdv.serviceId);
                  const employe = employes.find((e) => e.id === rdv.employeId);
                  return (
                    <motion.tr
                      key={rdv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#29B6F6]/20 border border-[#29B6F6]/30 flex items-center justify-center text-[#29B6F6] text-xs font-bold">
                            {client?.prenom?.[0] ?? '?'}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                            </p>
                            <p className="text-gray-500 text-xs">{client?.telephone ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-300 text-sm">{service?.nom ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-300 text-sm">
                        {employe ? `${employe.prenom} ${employe.nom}` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{formatDate(rdv.date)}</p>
                        <p className="text-gray-500 text-xs">{rdv.heure}</p>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          className={`text-xs px-2 py-1 rounded-lg border ${statutRDVColor(rdv.statut)} bg-transparent outline-none cursor-pointer`}
                          value={rdv.statut}
                          onChange={(e) => handleChangeStatut(rdv, e.target.value as StatutRDV)}
                        >
                          {STATUTS.map((s) => <option key={s} value={s} className="bg-[#1a1a1a] text-white">{statutRDVLabel(s)}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(rdv)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#29B6F6]/20 flex items-center justify-center transition-colors"
                          >
                            <Edit2 size={14} className="text-gray-400 hover:text-[#29B6F6]" />
                          </button>
                          <button
                            onClick={() => handleDelete(rdv.id)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={14} className="text-gray-400 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            {filtered.map((rdv) => {
              const client = clients.find((c) => c.id === rdv.clientId);
              const service = services.find((s) => s.id === rdv.serviceId);
              return (
                <div key={rdv.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                      </p>
                      <p className="text-gray-500 text-xs">{service?.nom ?? '—'} · {rdv.heure}</p>
                      <p className="text-gray-500 text-xs">{formatDate(rdv.date)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg ${statutRDVColor(rdv.statut)}`}>
                      {statutRDVLabel(rdv.statut)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(rdv)} className="text-xs text-[#29B6F6] border border-[#29B6F6]/30 px-3 py-1 rounded-lg hover:bg-[#29B6F6]/10 transition-colors">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(rdv.id)} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Création/Édition */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRdv ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Client *</label>
            <select className={selectCls} value={formClientId} onChange={e => setFormClientId(e.target.value)}>
              <option value="">-- Choisir un client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Service *</label>
              <select className={selectCls} value={formServiceId} onChange={e => setFormServiceId(e.target.value)}>
                <option value="">-- Service --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Prestataire *</label>
              <select className={selectCls} value={formEmployeId} onChange={e => setFormEmployeId(e.target.value)}>
                <option value="">-- Prestataire --</option>
                {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Date *</label>
              <input type="date" className={inputCls} value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Heure *</label>
              <input type="time" className={inputCls} value={formHeure} onChange={e => setFormHeure(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Statut</label>
            <select className={selectCls} value={formStatut} onChange={e => setFormStatut(e.target.value as StatutRDV)}>
              {STATUTS.map(s => <option key={s} value={s}>{statutRDVLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Notes internes</label>
            <textarea
              className={`${inputCls} resize-none h-20`}
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="Informations supplémentaires..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 text-gray-400 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#29B6F6] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors disabled:opacity-50 text-sm">
              {saving ? 'Sauvegarde...' : editingRdv ? 'Mettre à jour' : 'Créer le RDV'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
