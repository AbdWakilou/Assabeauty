// ============================================================
// STATISTIQUES — SalonPro
// ============================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { facturesService, rendezVousService, clientsService, servicesService, employesService } from '../../services/api';
import type { Facture, RendezVous, Client, Employe } from '../../types';
import { formatFCFA } from '../../utils/helpers';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';

const COLORS = ['#29B6F6', '#C9A84C', '#22c55e', '#a855f7', '#ef4444', '#f97316'];

function StatCard({ label, value, sub, color = '#29B6F6' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="font-bold text-2xl" style={{ color }}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: COLORS[i] }}>
            {typeof p.value === 'number' && p.value > 1000 ? formatFCFA(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

type PeriodType = '7j' | '30j' | '3m' | '12m';

export default function Statistiques() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('30j');
  const [factures, setFactures] = useState<Facture[]>([]);
  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [f, r, c, , e] = await Promise.all([
        facturesService.getAll(),
        rendezVousService.getAll(),
        clientsService.getAll(),
        servicesService.getAll(),
        employesService.getAll(),
      ]);
      setFactures(f);
      setRdvList(r);
      setClients(c);
      setEmployes(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrage par période ───────────────────────────────
  const getStartDate = (): string => {
    const d = new Date();
    switch (period) {
      case '7j':  d.setDate(d.getDate() - 7); break;
      case '30j': d.setDate(d.getDate() - 30); break;
      case '3m':  d.setMonth(d.getMonth() - 3); break;
      case '12m': d.setFullYear(d.getFullYear() - 1); break;
    }
    return d.toISOString().split('T')[0];
  };

  const startDate = getStartDate();
  const filteredFactures = factures.filter(f => f.date.slice(0, 10) >= startDate);
  const filteredRdv = rdvList.filter(r => r.date >= startDate);

  // ── Données graphique recettes par jour ───────────────
  const recettesData = (() => {
    const days: Record<string, number> = {};
    filteredFactures.forEach(f => {
      const day = f.date.slice(0, 10);
      days[day] = (days[day] ?? 0) + f.montantPaye;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, recettes]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        recettes,
      }));
  })();

  // ── RDV par statut (pie) ──────────────────────────────
  const rdvStatutData = [
    { name: 'Confirmés', value: filteredRdv.filter(r => r.statut === 'confirme').length },
    { name: 'Terminés',  value: filteredRdv.filter(r => r.statut === 'termine').length },
    { name: 'No-shows',  value: filteredRdv.filter(r => r.statut === 'no_show').length },
    { name: 'Annulés',   value: filteredRdv.filter(r => r.statut === 'annule').length },
  ].filter(d => d.value > 0);

  // ── Top services ──────────────────────────────────────
  const topServices = (() => {
    const counts: Record<string, { nom: string; count: number; ca: number }> = {};
    filteredFactures.forEach(f => {
      f.lignes.forEach(l => {
        if (!counts[l.serviceId]) counts[l.serviceId] = { nom: l.nomService, count: 0, ca: 0 };
        counts[l.serviceId].count += 1;
        counts[l.serviceId].ca += l.prix;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  // ── Top employés ──────────────────────────────────────
  const topEmployes = (() => {
    const scores: Record<string, { nom: string; ca: number; nbFac: number }> = {};
    filteredFactures.forEach(f => {
      f.employesIds.forEach(id => {
        const emp = employes.find(e => e.id === id);
        const nom = emp ? `${emp.prenom} ${emp.nom}` : id;
        if (!scores[id]) scores[id] = { nom, ca: 0, nbFac: 0 };
        scores[id].ca += f.total;
        scores[id].nbFac += 1;
      });
    });
    return Object.values(scores).sort((a, b) => b.ca - a.ca);
  })();

  // ── KPIs ──────────────────────────────────────────────
  const totalRecettes = filteredFactures.reduce((s, f) => s + f.montantPaye, 0);
  const totalRdv = filteredRdv.length;
  const noShows = filteredRdv.filter(r => r.statut === 'no_show').length;
  const tauxNoShow = totalRdv > 0 ? Math.round((noShows / totalRdv) * 100) : 0;
  const clientsFideles = clients.filter(c => c.nombreVisites >= 3).length;
  const tauxFidelisation = clients.length > 0 ? Math.round((clientsFideles / clients.length) * 100) : 0;

  if (loading) {
    return <div className="grid md:grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header + filtre période */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair font-bold text-white text-3xl" style={{ fontFamily: 'Playfair Display, serif' }}>
            Statistiques
          </h1>
          <p className="text-gray-400 text-sm mt-1">Analyse de vos performances</p>
        </div>
        <div className="flex gap-1 bg-[#111111] border border-white/5 rounded-xl p-1">
          {(['7j', '30j', '3m', '12m'] as PeriodType[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: period === p ? '#29B6F6' : 'transparent',
                color: period === p ? 'white' : '#888',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Recettes totales" value={formatFCFA(totalRecettes)} sub="Période sélectionnée" color="#29B6F6" />
        <StatCard label="Rendez-vous" value={totalRdv.toString()} sub={`${noShows} no-shows (${tauxNoShow}%)`} color="#22c55e" />
        <StatCard label="Taux fidélisation" value={`${tauxFidelisation}%`} sub={`${clientsFideles} clients fidèles`} color="#C9A84C" />
        <StatCard label="Clients total" value={clients.length.toString()} sub="Enregistrés" color="#a855f7" />
      </div>

      {/* Graphique recettes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111111] border border-white/5 rounded-2xl p-6"
      >
        <h2 className="text-white font-bold mb-6">Évolution des recettes</h2>
        {recettesData.length === 0 ? (
          <div className="text-center py-12 text-gray-600">Aucune donnée pour cette période</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={recettesData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="recettes" stroke="#29B6F6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#29B6F6' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* RDV par statut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111111] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold mb-6">Répartition des RDV</h2>
          {rdvStatutData.length === 0 ? (
            <div className="text-center py-12 text-gray-600">Aucun RDV sur cette période</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={rdvStatutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rdvStatutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} RDV`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3">
                {rdvStatutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-gray-400">{d.name}</span>
                    <span className="text-white font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Top services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#111111] border border-white/5 rounded-2xl p-6"
        >
          <h2 className="text-white font-bold mb-6">Top services</h2>
          {topServices.length === 0 ? (
            <div className="text-center py-12 text-gray-600">Aucune donnée</div>
          ) : (
            <div className="space-y-3">
              {topServices.map((s, i) => (
                <div key={s.nom}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                      <span className="text-white text-sm">{s.nom}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#29B6F6] text-xs font-bold">{formatFCFA(s.ca)}</span>
                      <span className="text-gray-500 text-xs ml-2">{s.count}×</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: COLORS[i],
                        width: `${(s.count / topServices[0].count) * 100}%`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Top employés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#111111] border border-white/5 rounded-2xl p-6"
      >
        <h2 className="text-white font-bold mb-6">Performance de l'équipe</h2>
        {topEmployes.length === 0 ? (
          <div className="text-center py-12 text-gray-600">Aucune donnée</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topEmployes} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="nom" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ca" fill="#29B6F6" radius={[6, 6, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
}
