// ============================================================
// FACTURES — SalonPro
// ============================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, Trash2 } from 'lucide-react';
import { facturesService, clientsService, employesService, salonService } from '../../services/api';
import type { Facture, Client, Employe, StatutFacture } from '../../types';
import { formatDate, formatFCFA, statutFactureLabel, statutFactureColor } from '../../utils/helpers';
import { generateFacturePDF } from '../../utils/generatePDF';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

export default function Factures() {
  const [loading, setLoading] = useState(true);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutFacture | 'tous'>('tous');
  const [filterDate, setFilterDate] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [f, c, e] = await Promise.all([
        facturesService.getAll(),
        clientsService.getAll(),
        employesService.getAll(),
      ]);
      setFactures(f.sort((a, b) => b.date.localeCompare(a.date)));
      setClients(c);
      setEmployes(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (facture: Facture) => {
    setDownloading(facture.id);
    try {
      const salon = await salonService.get();
      if (!salon) { toast.error('Informations salon introuvables'); return; }
      const client = clients.find(c => c.id === facture.clientId);
      if (!client) { toast.error('Client introuvable'); return; }
      const empList = employes.filter(e => facture.employesIds.includes(e.id));
      generateFacturePDF(facture, client, empList, salon);
      toast.success(`${facture.numero} téléchargée !`);
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette facture ?')) return;
    try {
      await facturesService.delete(id);
      toast.success('Facture supprimée');
      await loadAll();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Filtrage
  const filtered = factures.filter(f => {
    const client = clients.find(c => c.id === f.clientId);
    const nom = client ? `${client.prenom} ${client.nom}`.toLowerCase() : '';
    const matchSearch = !search || nom.includes(search.toLowerCase()) || f.numero.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'tous' || f.statut === filterStatut;
    const matchDate = !filterDate || f.date.startsWith(filterDate);
    return matchSearch && matchStatut && matchDate;
  });

  // Totaux
  const totalRecettes = filtered.reduce((s, f) => s + f.montantPaye, 0);
  const totalReste = filtered.reduce((s, f) => s + f.resteAPayer, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Factures
          </h1>
          <p className="text-gray-400 text-sm mt-1">{factures.length} factures enregistrées</p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Total facturé</p>
          <p className="text-white font-bold">{formatFCFA(filtered.reduce((s, f) => s + f.total, 0))}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Encaissé</p>
          <p className="text-green-400 font-bold">{formatFCFA(totalRecettes)}</p>
        </div>
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs mb-1">Reste à payer</p>
          <p className="text-orange-400 font-bold">{formatFCFA(totalReste)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full bg-[#111111] border border-white/10 text-white pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
            placeholder="N° facture ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-[#111111] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value as StatutFacture | 'tous')}
        >
          <option value="tous">Tous les statuts</option>
          <option value="paye">✅ Payé</option>
          <option value="acompte">🟡 Acompte</option>
          <option value="credit">🔴 Crédit</option>
        </select>
        <input
          type="month"
          className="bg-[#111111] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          placeholder="Mois"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="text-gray-400 hover:text-white border border-white/10 px-3 py-2.5 rounded-xl text-sm transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Aucune facture"
          description="Les factures apparaîtront ici après chaque vente en caisse."
        />
      ) : (
        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Facture</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Client</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Services</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Date</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Total</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Encaissé</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Statut</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => {
                  const client = clients.find(c => c.id === f.clientId);
                  return (
                    <motion.tr
                      key={f.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[#29B6F6]" />
                          <span className="text-white text-sm font-mono font-medium">{f.numero}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white text-sm">{client ? `${client.prenom} ${client.nom}` : '—'}</p>
                        <p className="text-gray-500 text-xs">{client?.telephone ?? ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-300 text-sm">{f.lignes.map(l => l.nomService).join(', ')}</p>
                        <p className="text-gray-600 text-xs">{f.lignes.length} service(s)</p>
                      </td>
                      <td className="px-5 py-4 text-gray-300 text-sm">{formatDate(f.date)}</td>
                      <td className="px-5 py-4 text-right text-white font-bold text-sm">{formatFCFA(f.total)}</td>
                      <td className="px-5 py-4 text-right text-green-400 font-medium text-sm">{formatFCFA(f.montantPaye)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-lg ${statutFactureColor(f.statut)}`}>
                          {statutFactureLabel(f.statut)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(f)}
                            disabled={downloading === f.id}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#29B6F6]/20 flex items-center justify-center transition-colors"
                            title="Télécharger PDF"
                          >
                            {downloading === f.id ? (
                              <svg className="animate-spin h-3 w-3 text-[#29B6F6]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <Download size={14} className="text-gray-400 hover:text-[#29B6F6]" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                            title="Supprimer"
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
            {filtered.map(f => {
              const client = clients.find(c => c.id === f.clientId);
              return (
                <div key={f.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-mono font-bold text-sm">{f.numero}</p>
                      <p className="text-gray-400 text-xs">{client ? `${client.prenom} ${client.nom}` : '—'}</p>
                      <p className="text-gray-500 text-xs">{formatDate(f.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatFCFA(f.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${statutFactureColor(f.statut)}`}>
                        {statutFactureLabel(f.statut)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(f)}
                    className="flex items-center gap-1 text-xs text-[#29B6F6] border border-[#29B6F6]/30 px-3 py-1 rounded-lg hover:bg-[#29B6F6]/10 transition-colors"
                  >
                    <Download size={12} /> Télécharger PDF
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
