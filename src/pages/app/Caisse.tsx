// ============================================================
// CAISSE — SalonPro
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus, Minus, FileText, CheckCircle } from 'lucide-react';
import {
  clientsService, servicesService, employesService,
  facturesService
} from '../../services/api';
import type { Client, Service, Employe, StatutFacture, LigneFacture } from '../../types';
import { formatFCFA, calculatePoints, calculateNiveau } from '../../utils/helpers';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { generateFacturePDF } from '../../utils/generatePDF';
import { salonService } from '../../services/api';
import toast from 'react-hot-toast';

export default function Caisse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);

  // Sélection
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedEmployesIds, setSelectedEmployesIds] = useState<string[]>([]);
  const [lignes, setLignes] = useState<LigneFacture[]>([]);
  const [statut, setStatut] = useState<StatutFacture>('paye');
  const [montantPaye, setMontantPaye] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastFacture, setLastFacture] = useState<{ id: string; numero: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [c, s, e] = await Promise.all([
          clientsService.getAll(),
          servicesService.getAll(),
          employesService.getAll(),
        ]);
        setClients(c);
        setServices(s.filter(sv => sv.actif));
        setEmployes(e.filter(emp => emp.actif));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Calculs
  const total = lignes.reduce((sum, l) => sum + l.prix, 0);
  const resteAPayer = Math.max(0, total - montantPaye);
  const pointsGeneres = calculatePoints(statut === 'paye' ? total : montantPaye);

  // Mise à jour montant payé auto quand statut "paye"
  useEffect(() => {
    if (statut === 'paye') setMontantPaye(total);
  }, [statut, total]);

  // Ajouter un service
  const addService = (service: Service) => {
    if (lignes.find(l => l.serviceId === service.id)) {
      toast.error('Service déjà ajouté');
      return;
    }
    setLignes(prev => [...prev, {
      serviceId: service.id,
      nomService: service.nom,
      duree: service.duree,
      prix: service.prix,
    }]);
  };

  // Retirer un service
  const removeService = (serviceId: string) => {
    setLignes(prev => prev.filter(l => l.serviceId !== serviceId));
  };

  // Toggle employé sélectionné
  const toggleEmploye = (id: string) => {
    setSelectedEmployesIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  // Valider la facture
  const handleValider = async () => {
    if (!selectedClientId) { toast.error('Sélectionnez un client'); return; }
    if (lignes.length === 0) { toast.error('Ajoutez au moins un service'); return; }
    if (selectedEmployesIds.length === 0) { toast.error('Sélectionnez au moins un prestataire'); return; }
    if (statut !== 'paye' && montantPaye <= 0) { toast.error('Saisissez le montant payé'); return; }

    setSaving(true);
    try {
      // Créer la facture
      const facture = await facturesService.create({
        clientId: selectedClientId,
        employesIds: selectedEmployesIds,
        lignes,
        total,
        montantPaye: statut === 'paye' ? total : montantPaye,
        resteAPayer: statut === 'paye' ? 0 : resteAPayer,
        statut,
        pointsGeneres,
        date: new Date().toISOString(),
      });

      // Mettre à jour points + niveau + nb visites du client
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        const newPoints = client.points + pointsGeneres;
        await clientsService.update(client.id, {
          points: newPoints,
          niveau: calculateNiveau(newPoints),
          nombreVisites: client.nombreVisites + 1,
          derniereVisite: new Date().toISOString(),
        });
      }

      setLastFacture({ id: facture.id, numero: facture.numero });
      toast.success(`Facture ${facture.numero} créée ! 💰`);

      // Reset
      setSelectedClientId('');
      setSelectedEmployesIds([]);
      setLignes([]);
      setStatut('paye');
      setMontantPaye(0);

      // Recharger clients (pour maj points)
      const updatedClients = await clientsService.getAll();
      setClients(updatedClients);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création de la facture');
    } finally {
      setSaving(false);
    }
  };

  // Télécharger la dernière facture
  const handleDownloadLastFacture = async () => {
    if (!lastFacture) return;
    try {
      const [allFactures, allClients, allEmployes, salon] = await Promise.all([
        facturesService.getAll(),
        clientsService.getAll(),
        employesService.getAll(),
        salonService.get(),
      ]);
      const facture = allFactures.find(f => f.id === lastFacture.id);
      const client = allClients.find(c => c.id === facture?.clientId);
      const empList = allEmployes.filter(e => facture?.employesIds.includes(e.id));
      if (facture && client && salon) {
        generateFacturePDF(facture, client, empList, salon);
        toast.success('PDF téléchargé !');
      }
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
          Caisse
        </h1>
        <p className="text-gray-400 text-sm mt-1">Créez une nouvelle vente et générez une facture</p>
      </div>

      {/* Dernière facture créée */}
      {lastFacture && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <div>
              <p className="text-green-400 font-semibold text-sm">Facture {lastFacture.numero} créée avec succès</p>
              <p className="text-green-400/70 text-xs">Points attribués automatiquement</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadLastFacture}
              className="flex items-center gap-2 text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <FileText size={14} /> Télécharger PDF
            </button>
            <button
              onClick={() => navigate('/app/factures')}
              className="text-xs text-green-400/70 hover:text-green-400 px-2 py-1.5 transition-colors"
            >
              Voir tout
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Panel gauche — sélection */}
        <div className="space-y-5">
          {/* Client */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-[#29B6F6]">①</span> Client
            </h2>
            <select
              className="w-full bg-[#1a1a1a] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
            >
              <option value="">-- Choisir un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom} — {c.points} pts</option>
              ))}
            </select>

            {selectedClient && (
              <div className="mt-3 bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: '#29B6F6' }}
                >
                  {selectedClient.prenom[0]}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{selectedClient.prenom} {selectedClient.nom}</p>
                  <p className="text-[#C9A84C] text-xs">{selectedClient.points} points · {selectedClient.nombreVisites} visites</p>
                </div>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-[#29B6F6]">②</span> Services
            </h2>
            {services.length === 0 ? (
              <EmptyState icon="💈" title="Aucun service" description="Ajoutez des services dans la section Services." />
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {services.map(service => {
                  const isAdded = lignes.some(l => l.serviceId === service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => isAdded ? removeService(service.id) : addService(service)}
                      className="flex items-center justify-between p-3 rounded-xl border transition-all text-left"
                      style={{
                        backgroundColor: isAdded ? 'rgba(41,182,246,0.1)' : '#1a1a1a',
                        borderColor: isAdded ? '#29B6F6' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div>
                        <p className="text-white text-sm font-medium">{service.nom}</p>
                        <p className="text-gray-500 text-xs">{service.duree} min</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#29B6F6] font-bold text-sm">{formatFCFA(service.prix)}</span>
                        {isAdded
                          ? <Minus size={16} className="text-red-400" />
                          : <Plus size={16} className="text-green-400" />
                        }
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prestataires */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-[#29B6F6]">③</span> Prestataire(s)
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {employes.map(emp => {
                const isSelected = selectedEmployesIds.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    onClick={() => toggleEmploye(emp.id)}
                    className="p-3 rounded-xl border transition-all text-left"
                    style={{
                      backgroundColor: isSelected ? 'rgba(41,182,246,0.1)' : '#1a1a1a',
                      borderColor: isSelected ? '#29B6F6' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs mb-1"
                      style={{ backgroundColor: isSelected ? '#29B6F6' : '#333' }}
                    >
                      {emp.prenom[0]}
                    </div>
                    <p className="text-white text-xs font-medium">{emp.prenom} {emp.nom}</p>
                    {isSelected && <CheckCircle size={12} className="text-[#29B6F6] mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel droit — récapitulatif */}
        <div className="space-y-5">
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 sticky top-4">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#29B6F6]" />
              Récapitulatif
            </h2>

            {/* Lignes */}
            {lignes.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun service sélectionné</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {lignes.map(l => (
                  <div key={l.serviceId} className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded-lg">
                    <div>
                      <p className="text-white text-sm">{l.nomService}</p>
                      <p className="text-gray-500 text-xs">{l.duree} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{formatFCFA(l.prix)}</span>
                      <button
                        onClick={() => removeService(l.serviceId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Séparateur */}
            <div className="border-t border-white/10 my-4" />

            {/* Total */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-bold text-xl">{formatFCFA(total)}</span>
            </div>

            {/* Points */}
            {total > 0 && (
              <div className="flex items-center justify-between mb-4 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl p-2">
                <span className="text-[#C9A84C] text-sm">🏆 Points à attribuer</span>
                <span className="text-[#C9A84C] font-bold">{pointsGeneres} pts</span>
              </div>
            )}

            {/* Statut paiement */}
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">Statut du paiement</label>
              <div className="flex gap-2">
                {(['paye', 'acompte', 'credit'] as StatutFacture[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatut(s)}
                    className="flex-1 py-2 px-2 rounded-xl text-xs font-medium border transition-all"
                    style={{
                      backgroundColor: statut === s
                        ? s === 'paye' ? 'rgba(34,197,94,0.2)'
                          : s === 'acompte' ? 'rgba(234,179,8,0.2)'
                          : 'rgba(239,68,68,0.2)'
                        : '#1a1a1a',
                      borderColor: statut === s
                        ? s === 'paye' ? '#22c55e' : s === 'acompte' ? '#eab308' : '#ef4444'
                        : 'rgba(255,255,255,0.08)',
                      color: statut === s
                        ? s === 'paye' ? '#22c55e' : s === 'acompte' ? '#eab308' : '#ef4444'
                        : '#888',
                    }}
                  >
                    {s === 'paye' ? '✅ Payé' : s === 'acompte' ? '🟡 Acompte' : '🔴 Crédit'}
                  </button>
                ))}
              </div>
            </div>

            {/* Montant payé (si acompte ou crédit) */}
            {statut !== 'paye' && (
              <div className="mb-4">
                <label className="text-gray-400 text-xs mb-2 block">Montant encaissé (FCFA)</label>
                <input
                  type="number"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#29B6F6] text-sm"
                  value={montantPaye}
                  onChange={e => setMontantPaye(parseInt(e.target.value) || 0)}
                  min={0}
                  max={total}
                />
                {resteAPayer > 0 && (
                  <p className="text-orange-400 text-xs mt-1">Reste à payer : {formatFCFA(resteAPayer)}</p>
                )}
              </div>
            )}

            {/* Bouton valider */}
            <button
              onClick={handleValider}
              disabled={saving || lignes.length === 0 || !selectedClientId || selectedEmployesIds.length === 0}
              className="w-full bg-[#29B6F6] text-white py-3.5 rounded-xl font-bold hover:bg-[#0288D1] transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Traitement...
                </>
              ) : (
                <><FileText size={18} /> Valider & Générer facture</>
              )}
            </button>

            {/* Indications */}
            <p className="text-gray-600 text-xs text-center mt-2">
              La facture PDF peut être téléchargée après validation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
