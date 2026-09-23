// ============================================================
// DASHBOARD — SalonPro
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, Calendar, Users, AlertCircle,
  ArrowUpRight, Trophy, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { facturesService, rendezVousService, clientsService, employesService } from '../../services/api';
import type { Facture, RendezVous, Client, Employe } from '../../types';
import { formatFCFA, getLast7Days } from '../../utils/helpers';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';

// ── Carte statistique ──────────────────────────────────────
function StatCard({
  title, value, subtitle, icon, color, onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-[#111111] border border-white/5 rounded-2xl p-6 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <ArrowUpRight size={16} className="text-gray-600" />
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-white text-2xl font-bold mb-1">{value}</p>
      <p className="text-gray-600 text-xs">{subtitle}</p>
    </motion.div>
  );
}

// ── Tooltip personnalisé recharts ─────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-[#29B6F6] font-bold">{formatFCFA(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chartData, setChartData] = useState<{ date: string; recettes: number; label: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [f, r, c, e] = await Promise.all([
        facturesService.getAll(),
        rendezVousService.getAll(),
        clientsService.getAll(),
        employesService.getAll(),
      ]);
      setFactures(f);
      setRdvList(r);
      setClients(c);
      setEmployes(e);

      // Préparer données graphique 7 derniers jours
      const days = getLast7Days();
      const data = days.map((day) => {
        const recettes = f
          .filter((fac) => fac.date.startsWith(day))
          .reduce((sum, fac) => sum + fac.montantPaye, 0);
        const d = new Date(day);
        const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        return { date: day, recettes, label };
      });
      setChartData(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  // ── Calculs ──────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const monthStr = today.slice(0, 7);

  const recettesJour = factures
    .filter((f) => f.date.startsWith(today))
    .reduce((s, f) => s + f.montantPaye, 0);

  const recettesSemaine = factures
    .filter((f) => f.date.slice(0, 10) >= weekStartStr)
    .reduce((s, f) => s + f.montantPaye, 0);

  const recettesMois = factures
    .filter((f) => f.date.startsWith(monthStr))
    .reduce((s, f) => s + f.montantPaye, 0);

  const rdvConfirmes = rdvList.filter((r) => r.statut === 'confirme').length;
  const noShows = rdvList.filter((r) => r.statut === 'no_show').length;
  const rdvTotal = rdvList.filter((r) => ['confirme', 'termine', 'no_show'].includes(r.statut)).length;
  const tauxFidelisation = clients.length > 0
    ? Math.round((clients.filter((c) => c.nombreVisites >= 3).length / clients.length) * 100)
    : 0;

  // Top employé (par nb de factures)
  const empScores: Record<string, number> = {};
  factures.forEach((f) => {
    f.employesIds.forEach((id) => {
      empScores[id] = (empScores[id] ?? 0) + f.total;
    });
  });
  const topEmpId = Object.entries(empScores).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topEmp = employes.find((e) => e.id === topEmpId);

  // Prochains RDV aujourd'hui
  const prochainsRdv = rdvList
    .filter((r) => r.date === today && r.statut !== 'annule')
    .sort((a, b) => a.heure.localeCompare(b.heure))
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Tableau de bord
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/app/caisse')}
          className="bg-[#29B6F6] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors text-sm"
        >
          + Nouvelle vente
        </button>
      </div>

      {/* Cards stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Recettes du jour"
          value={formatFCFA(recettesJour)}
          subtitle="Aujourd'hui"
          icon={<TrendingUp size={22} />}
          color="#29B6F6"
          onClick={() => navigate('/app/factures')}
        />
        <StatCard
          title="Recettes semaine"
          value={formatFCFA(recettesSemaine)}
          subtitle="Cette semaine"
          icon={<TrendingUp size={22} />}
          color="#C9A84C"
        />
        <StatCard
          title="Recettes du mois"
          value={formatFCFA(recettesMois)}
          subtitle="Ce mois-ci"
          icon={<TrendingUp size={22} />}
          color="#22c55e"
        />
        <StatCard
          title="Taux fidélisation"
          value={`${tauxFidelisation}%`}
          subtitle={`${clients.filter(c => c.nombreVisites >= 3).length} clients fidèles`}
          icon={<Users size={22} />}
          color="#a855f7"
          onClick={() => navigate('/app/clients')}
        />
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="RDV confirmés"
          value={rdvConfirmes.toString()}
          subtitle="En attente"
          icon={<Calendar size={22} />}
          color="#29B6F6"
          onClick={() => navigate('/app/reservations')}
        />
        <StatCard
          title="No-shows"
          value={noShows.toString()}
          subtitle={`sur ${rdvTotal} RDV total`}
          icon={<AlertCircle size={22} />}
          color="#ef4444"
        />
        <StatCard
          title="Clients enregistrés"
          value={clients.length.toString()}
          subtitle="Total"
          icon={<Users size={22} />}
          color="#22c55e"
          onClick={() => navigate('/app/clients')}
        />
        <StatCard
          title="Équipe active"
          value={employes.filter(e => e.actif).length.toString()}
          subtitle="Prestataires"
          icon={<Trophy size={22} />}
          color="#C9A84C"
        />
      </div>

      {/* Graphique + Sidebar */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Graphique 7 jours */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-6">Recettes — 7 derniers jours</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#888', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#888', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="recettes"
                fill="#29B6F6"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Panel droit */}
        <div className="space-y-4">
          {/* Top employé */}
          {topEmp && (
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-yellow-400" />
                <span className="text-white font-bold text-sm">Top prestataire</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: '#29B6F6' }}
                >
                  {topEmp.prenom[0]}
                </div>
                <div>
                  <p className="text-white font-medium">{topEmp.prenom} {topEmp.nom}</p>
                  <p className="text-[#29B6F6] text-sm">{formatFCFA(empScores[topEmp.id] ?? 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Prochains RDV */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#29B6F6]" />
                <span className="text-white font-bold text-sm">RDV aujourd'hui</span>
              </div>
              <button
                onClick={() => navigate('/app/reservations')}
                className="text-[#29B6F6] text-xs hover:underline"
              >
                Voir tout
              </button>
            </div>
            {prochainsRdv.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Aucun rendez-vous aujourd'hui</p>
            ) : (
              <div className="space-y-2">
                {prochainsRdv.map((rdv) => {
                  const client = clients.find(c => c.id === rdv.clientId);
                  return (
                    <div
                      key={rdv.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: '#29B6F620', border: '1px solid #29B6F640' }}
                      >
                        {client?.prenom?.[0] ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                        </p>
                        <p className="text-gray-500 text-xs">{rdv.heure}</p>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: rdv.statut === 'confirme' ? '#22c55e'
                            : rdv.statut === 'en_attente' ? '#eab308' : '#888',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
