// ============================================================
// GÉNÉRATION PDF — SalonPro
// Utilise jsPDF + jspdf-autotable
// ============================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Facture, Client, Employe, Salon } from '../types';

/**
 * Formate un montant en FCFA
 */
function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
}

/**
 * Formate une date ISO en JJ/MM/AAAA
 */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Formate une heure depuis une date ISO en HH:MM
 */
function formatHeure(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Retourne le label du statut de facture
 */
function statutLabel(statut: string): string {
  switch (statut) {
    case 'paye': return '✅ Payé';
    case 'acompte': return '🟡 Acompte';
    case 'credit': return '🔴 Crédit';
    default: return statut;
  }
}

/**
 * Génère et télécharge une facture PDF
 */
export function generateFacturePDF(
  facture: Facture,
  client: Client,
  employes: Employe[],
  salon: Salon
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // ── COULEURS ──────────────────────────────────────────────
  const CYAN = [41, 182, 246] as [number, number, number];
  const DARK = [10, 10, 10] as [number, number, number];
  const GOLD = [201, 168, 76] as [number, number, number];
  const GRAY = [100, 100, 100] as [number, number, number];
  const WHITE = [255, 255, 255] as [number, number, number];

  // ── EN-TÊTE ───────────────────────────────────────────────
  // Fond noir en-tête
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo salon (si disponible)
  if (salon.logo) {
    try {
      doc.addImage(salon.logo, 'PNG', 12, 8, 28, 28);
    } catch {
      // Logo ignoré si erreur de format
    }
    // Infos salon à droite du logo
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(salon.nom, 45, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`${salon.adresse} — ${salon.ville}`, 45, 25);
    doc.text(`Tél : ${salon.telephone}  |  WhatsApp : ${salon.whatsapp}`, 45, 30);
    const typesLabel = salon.typesServices.join(' · ').toUpperCase();
    doc.text(typesLabel, 45, 35);
  } else {
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(salon.nom, 12, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`${salon.adresse} — ${salon.ville}`, 12, 25);
    doc.text(`Tél : ${salon.telephone}  |  WhatsApp : ${salon.whatsapp}`, 12, 31);
  }

  y = 52;

  // ── BANDE CYAN "FACTURE" ──────────────────────────────────
  doc.setFillColor(...CYAN);
  doc.rect(0, 45, pageWidth, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text(`FACTURE N° ${facture.numero}`, 12, 53);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Date : ${formatDate(facture.date)}   Heure : ${formatHeure(facture.date)}`,
    pageWidth - 12,
    53,
    { align: 'right' }
  );

  y = 65;

  // ── INFORMATIONS CLIENT & EMPLOYÉS ───────────────────────
  doc.setFillColor(245, 240, 232); // Beige
  doc.rect(10, y - 4, 90, 22, 'F');
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENT', 14, y + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${client.prenom} ${client.nom.toUpperCase()}`, 14, y + 7);
  doc.text(`Tél : ${client.telephone}`, 14, y + 13);

  doc.setFillColor(245, 240, 232);
  doc.rect(105, y - 4, 90, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('PRESTATAIRE(S)', 109, y + 1);
  doc.setFont('helvetica', 'normal');
  const nomEmployes = employes.map((e) => `${e.prenom} ${e.nom}`).join(', ');
  const empLines = doc.splitTextToSize(nomEmployes, 82);
  doc.text(empLines, 109, y + 7);

  y += 30;

  // ── TABLEAU DES SERVICES ──────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [['Service', 'Durée', 'Prix']],
    body: facture.lignes.map((l) => [
      l.nomService,
      `${l.duree} min`,
      formatFCFA(l.prix),
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: DARK,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 45, halign: 'right' },
    },
    margin: { left: 12, right: 12 },
  });

  // Récupère la position Y après le tableau
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── BLOC TOTAUX ───────────────────────────────────────────
  const totalsX = pageWidth - 75;
  const totalsWidth = 62;

  doc.setFillColor(...DARK);
  doc.rect(totalsX - 3, y - 2, totalsWidth + 3, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text('TOTAL', totalsX, y + 4);
  doc.text(formatFCFA(facture.total), pageWidth - 12, y + 4, { align: 'right' });

  y += 12;
  doc.setFillColor(240, 255, 240);
  doc.rect(totalsX - 3, y - 2, totalsWidth + 3, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text('Points générés', totalsX, y + 3);
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.text(`${facture.pointsGeneres} pts`, pageWidth - 12, y + 3, { align: 'right' });

  y += 10;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Montant payé', totalsX, y + 3);
  doc.setFont('helvetica', 'bold');
  doc.text(formatFCFA(facture.montantPaye), pageWidth - 12, y + 3, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Reste à payer', totalsX, y + 3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(facture.resteAPayer > 0 ? 239 : 34, facture.resteAPayer > 0 ? 68 : 197, facture.resteAPayer > 0 ? 68 : 94);
  doc.text(formatFCFA(facture.resteAPayer), pageWidth - 12, y + 3, { align: 'right' });

  y += 10;
  // Badge statut
  const statutText = statutLabel(facture.statut);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Statut :', totalsX, y + 3);
  doc.text(statutText, pageWidth - 12, y + 3, { align: 'right' });

  y += 16;

  // ── SÉPARATEUR ───────────────────────────────────────────
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.5);
  doc.line(12, y, pageWidth - 12, y);

  y += 8;

  // ── MENTION LÉGALE ────────────────────────────────────────
  if (salon.mentionLegale) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    const mentionLines = doc.splitTextToSize(salon.mentionLegale, pageWidth - 24);
    doc.text(mentionLines, 12, y);
    y += mentionLines.length * 5 + 6;
  }

  // ── SIGNATURE ─────────────────────────────────────────────
  if (salon.signature && !salon.masquerSignature) {
    try {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text('Signature :', pageWidth - 70, y);
      doc.addImage(salon.signature, 'PNG', pageWidth - 70, y + 4, 55, 22);
    } catch {
      // Signature ignorée si erreur
    }
  }

  // ── PIED DE PAGE ─────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    `${salon.nom}  ·  ${salon.ville}  ·  SalonPro © ${new Date().getFullYear()}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  // ── TÉLÉCHARGEMENT ───────────────────────────────────────
  doc.save(`${facture.numero}_${client.prenom}_${client.nom}.pdf`);
}
