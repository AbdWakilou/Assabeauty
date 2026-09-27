// ============================================================
// CLIENTS CRM — SalonPro
// ============================================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Download, Star, X } from 'lucide-react';
import { clientsService, facturesService } from '../../services/api';
import type { Client, Facture, NiveauFidelite } from '../../types';
import {
  formatDate, formatFCFA, niveauLabel, niveauColor,
  calculateNiveau, exportCSV
} from '../../utils/helpers';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

const defaultForm = (): Omit<Client, 'id' | 'createdAt'> => ({
  prenom: '',
  nom: '',
  telephone: '',
  email: '',
  dateNaissance: '',
  allergies: '',
  notes: '',
  points: 0,
  niveau: 'bronze',
  derniereVisite: undefined,
  nombreVisites: 0,
});

export default function Clients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [search, setSearch] = useState('');
  const [filterNiveau, setFilterNiveau] = useState<NiveauFidelite | 'tous'>('tous');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, f] = await Promise.all([clientsService.getAll(), facturesService.getAll()]);
      setClients(c.sort((a, b) => a.nom.localeCompare(b.nom)));
      setFactures(f);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingClient(null);
    setForm(defaultForm());
    setShowModal(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      prenom: client.prenom,
      nom: client.nom,
      telephone: client.telephone,
      email: client.email ?? '',
      dateNaissance: client.dateNaissance ?? '',
      allergies: client.allergies ?? '',
      notes: client.notes ?? '',
      points: client.points,
      niveau: client.niveau,
      derniereVisite: client.derniereVisite,
      nombreVisites: client.nombreVisites,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.prenom.trim() || !form.nom.trim()) {
      toast.error('Prénom et nom requis');
      return;
    }
    if (!form.telephone.trim()) {
      toast.error('Téléphone requis');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        niveau: calculateNiveau(form.points),
        email: form.email || null,
        dateNaissance: form.dateNaissance || null,
        allergies: form.allergies || null,
        notes: form.notes || null,
      };
      if (editingClient) {
        await clientsService.update(editingClient.id, data);
        toast.success('Client mis à jour ✅');
      } else {
        await clientsService.create(data);
        toast.success('Client ajouté ✅');
      }
      setShowModal(false);
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    try {
      await clientsService.delete(id);
      toast.success('Client supprimé');
      if (selectedClient?.id === id) setSelectedClient(null);
      await loadAll();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExportCSV = () => {
    exportCSV(
      `clients_salonpro_${new Date().toISOString().split('T')[0]}.csv`,
      ['Prénom', 'Nom', 'Téléphone', 'Email', 'Points', 'Niveau', 'Visites', 'Dernière visite'],
      clients.map((c) => [
        c.prenom, c.nom, c.telephone, c.email ?? '',
        c.points.toString(), niveauLabel(c.niveau),
        c.nombreVisites.toString(),
        c.derniereVisite ? formatDate(c.derniereVisite) : '',
      ])
    );
    toast.success('Export CSV téléchargé');
  };

  // Filtrage
  const filtered = clients.filter((c) => {
    const matchSearch = !search ||
      `${c.prenom} ${c.nom} ${c.telephone}`.toLowerCase().includes(search.toLowerCase());
    const matchNiveau = filterNiveau === 'tous' || c.niveau === filterNiveau;
    return matchSearch && matchNiveau;
  });

  // Historique factures du client sélectionné
  const clientFactures = selectedClient
    ? factures.filter((f) => f.clientId === selectedClient.id)
    : [];

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] transition-colors text-sm placeholder-gray-600';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Clients CRM
          </h1>
          <p className="text-gray-400 text-sm mt-1">{clients.length} clients enregistrés</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-white/10 text-gray-400 px-4 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors text-sm"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#29B6F6] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors text-sm"
          >
            <Plus size={18} /> Nouveau client
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full bg-[#111111] border border-white/10 text-white pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
            placeholder="Nom, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-[#111111] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
          value={filterNiveau}
          onChange={(e) => setFilterNiveau(e.target.value as NiveauFidelite | 'tous')}
        >
          <option value="tous">Tous les niveaux</option>
          <option value="or">🥇 Or (1500+ pts)</option>
          <option value="argent">🥈 Argent (501-1500 pts)</option>
          <option value="bronze">🥉 Bronze (0-500 pts)</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Liste clients */}
        <div className="lg:col-span-2">
          {loading ? (
            <SkeletonTable />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Aucun client"
              description="Ajoutez votre premier client pour commencer."
              ctaLabel="Ajouter un client"
              onCta={openCreate}
            />
          ) : (
            <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
              {filtered.map((client, i) => {
                const isFidele = client.nombreVisites >= 3;
                const isSelected = selectedClient?.id === client.id;
                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedClient(isSelected ? null : client)}
                    className={`flex items-center gap-4 p-4 border-b border-white/5 cursor-pointer transition-all ${isSelected ? 'bg-[#29B6F6]/10' : 'hover:bg-white/2'}`}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                      style={{ backgroundColor: isSelected ? '#29B6F6' : '#1a1a1a', border: `2px solid ${isSelected ? '#29B6F6' : 'rgba(255,255,255,0.1)'}` }}
                    >
                      {client.prenom[0]}{client.nom[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium text-sm">{client.prenom} {client.nom}</p>
                        {isFidele && (
                          <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Fidèle
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs truncate">{client.telephone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full ${niveauColor(client.niveau)}`}>
                        {niveauLabel(client.niveau)}
                      </span>
                      <p className="text-gray-500 text-xs mt-1">{client.points} pts</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(client); }}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#29B6F6]/20 flex items-center justify-center"
                      >
                        <Edit2 size={13} className="text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center"
                      >
                        <Trash2 size={13} className="text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fiche client */}
        <AnimatePresence>
          {selectedClient && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-5 h-fit"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Fiche client</h3>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>

              {/* Avatar + infos */}
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl mx-auto mb-3"
                  style={{ backgroundColor: '#29B6F6' }}
                >
                  {selectedClient.prenom[0]}{selectedClient.nom[0]}
                </div>
                <p className="text-white font-bold">{selectedClient.prenom} {selectedClient.nom}</p>
                <p className="text-gray-400 text-sm">{selectedClient.telephone}</p>
                {selectedClient.email && <p className="text-gray-500 text-xs">{selectedClient.email}</p>}
              </div>

              {/* Niveau + points */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Niveau</p>
                  <p className={`font-bold mt-1 ${niveauColor(selectedClient.niveau)} inline-block px-2 py-0.5 rounded-full text-xs`}>
                    {niveauLabel(selectedClient.niveau)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Points</p>
                  <p className="text-[#C9A84C] font-bold text-lg">{selectedClient.points}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Visites</p>
                  <p className="text-white font-bold text-lg">{selectedClient.nombreVisites}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                  <p className="text-gray-500 text-xs">Dernière visite</p>
                  <p className="text-white text-xs font-medium mt-1">
                    {selectedClient.derniereVisite ? formatDate(selectedClient.derniereVisite) : '—'}
                  </p>
                </div>
              </div>

              {/* Infos personnelles */}
              {(selectedClient.dateNaissance || selectedClient.allergies) && (
                <div className="space-y-2">
                  {selectedClient.dateNaissance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">🎂 Anniversaire</span>
                      <span className="text-white">{formatDate(selectedClient.dateNaissance)}</span>
                    </div>
                  )}
                  {selectedClient.allergies && (
                    <div>
                      <p className="text-gray-500 text-xs">⚠️ Allergies</p>
                      <p className="text-orange-400 text-xs mt-0.5">{selectedClient.allergies}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedClient.notes && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">📝 Notes</p>
                  <p className="text-gray-300 text-xs">{selectedClient.notes}</p>
                </div>
              )}

              {/* Historique factures */}
              <div>
                <p className="text-white font-semibold text-sm mb-2">Historique achats</p>
                {clientFactures.length === 0 ? (
                  <p className="text-gray-600 text-xs">Aucune facture</p>
                ) : (
                  <div className="space-y-2">
                    {clientFactures.slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-2">
                        <div>
                          <p className="text-white text-xs font-medium">{f.numero}</p>
                          <p className="text-gray-500 text-xs">{formatDate(f.date)}</p>
                        </div>
                        <p className="text-[#29B6F6] text-xs font-bold">{formatFCFA(f.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total dépensé */}
              {clientFactures.length > 0 && (
                <div className="bg-[#29B6F6]/10 border border-[#29B6F6]/20 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs">Total dépensé</p>
                  <p className="text-[#29B6F6] font-bold text-lg">
                    {formatFCFA(clientFactures.reduce((s, f) => s + f.total, 0))}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Création/Édition */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingClient ? 'Modifier le client' : 'Nouveau client'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Prénom *</label>
              <input className={inputCls} value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Aminata" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Nom *</label>
              <input className={inputCls} value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="DIALLO" />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Téléphone *</label>
            <input className={inputCls} value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} placeholder="+221 77 000 00 00" type="tel" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Email</label>
            <input className={inputCls} value={form.email ?? ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemple.com" type="email" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Date de naissance (anniversaire)</label>
            <input className={inputCls} type="date" value={form.dateNaissance ?? ''} onChange={e => setForm(p => ({ ...p, dateNaissance: e.target.value }))} />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Allergies / Contre-indications</label>
            <input className={inputCls} value={form.allergies ?? ''} onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))} placeholder="Latex, colorants..." />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Notes</label>
            <textarea className={`${inputCls} resize-none h-16`} value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Préférences, habitudes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 text-gray-400 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#29B6F6] text-white py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors disabled:opacity-50 text-sm">
              {saving ? 'Sauvegarde...' : editingClient ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
