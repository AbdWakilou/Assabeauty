// ============================================================
// UTILITAIRES GÉNÉRAUX — SalonPro
// ============================================================

import type { NiveauFidelite } from '../types';

/** Formate un montant en FCFA */
export function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

/** Formate une date ISO en JJ/MM/AAAA */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formate une date ISO en JJ/MM/AAAA HH:MM */
export function formatDateTime(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formate une heure en HH:MM */
export function formatHeure(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Durée en heures/minutes lisibles */
export function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

/** Calcule le niveau de fidélité selon les points */
export function calculateNiveau(points: number): NiveauFidelite {
  if (points >= 1500) return 'or';
  if (points >= 501) return 'argent';
  return 'bronze';
}

/** Calcule les points générés par un montant payé */
export function calculatePoints(montantPaye: number): number {
  return Math.floor(montantPaye / 100);
}

/** Label du niveau de fidélité */
export function niveauLabel(niveau: NiveauFidelite): string {
  switch (niveau) {
    case 'or': return '🥇 Or';
    case 'argent': return '🥈 Argent';
    case 'bronze': return '🥉 Bronze';
  }
}

/** Couleur badge niveau */
export function niveauColor(niveau: NiveauFidelite): string {
  switch (niveau) {
    case 'or': return 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30';
    case 'argent': return 'text-gray-300 bg-gray-400/10 border border-gray-400/30';
    case 'bronze': return 'text-orange-400 bg-orange-400/10 border border-orange-400/30';
  }
}

/** Label du statut RDV */
export function statutRDVLabel(statut: string): string {
  switch (statut) {
    case 'confirme': return 'Confirmé';
    case 'en_attente': return 'En attente';
    case 'annule': return 'Annulé';
    case 'termine': return 'Terminé';
    case 'no_show': return 'No-show';
    default: return statut;
  }
}

/** Couleur classe pour le statut RDV */
export function statutRDVColor(statut: string): string {
  switch (statut) {
    case 'confirme': return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'en_attente': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'annule': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'termine': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'no_show': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

/** Label du statut facture */
export function statutFactureLabel(statut: string): string {
  switch (statut) {
    case 'paye': return '✅ Payé';
    case 'acompte': return '🟡 Acompte';
    case 'credit': return '🔴 Crédit';
    default: return statut;
  }
}

/** Couleur du statut facture */
export function statutFactureColor(statut: string): string {
  switch (statut) {
    case 'paye': return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'acompte': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'credit': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

/** Exporte un tableau en CSV */
export function exportCSV(filename: string, headers: string[], rows: string[][]): void {
  const BOM = '\uFEFF';
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
  ].join('\n');
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Génère les 7 derniers jours sous forme YYYY-MM-DD */
export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

/** Date courante en YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Jours restants dans l'essai */
export function joursEssaiRestants(trialStartDate: string, trialDays: number): number {
  const start = new Date(trialStartDate);
  const end = new Date(start.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}
