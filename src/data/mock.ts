// ============================================================
// DONNÉES MOCK — SalonPro
// Données fictives réalistes pour l'Afrique de l'Ouest
// Chargées au démarrage si localStorage est vide
// ============================================================

import type { Client, Service, Employe, RendezVous, Facture, Salon, User, Horaires } from '../types';

const defaultHoraires: Horaires = {
  lundi:    { actif: true,  debut: '08:00', fin: '18:00' },
  mardi:    { actif: true,  debut: '08:00', fin: '18:00' },
  mercredi: { actif: true,  debut: '08:00', fin: '18:00' },
  jeudi:    { actif: true,  debut: '08:00', fin: '18:00' },
  vendredi: { actif: true,  debut: '08:00', fin: '18:00' },
  samedi:   { actif: true,  debut: '09:00', fin: '17:00' },
  dimanche: { actif: false, debut: '00:00', fin: '00:00' },
};

export const mockClients: Client[] = [
  {
    id: 'cli-001',
    prenom: 'Aminata',
    nom: 'DIALLO',
    telephone: '+221 77 123 45 67',
    email: 'aminata.diallo@gmail.com',
    dateNaissance: '1992-03-15',
    allergies: 'Latex, certains colorants capillaires',
    notes: 'Préfère les rendez-vous en matinée. Cliente VIP.',
    points: 1650,
    niveau: 'or',
    derniereVisite: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    nombreVisites: 12,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cli-002',
    prenom: 'Fatou',
    nom: 'KONÉ',
    telephone: '+225 07 456 78 90',
    email: 'fatou.kone@yahoo.fr',
    dateNaissance: '1988-07-22',
    allergies: '',
    notes: 'Aime les tresses longues. Vient souvent avec sa fille.',
    points: 820,
    niveau: 'argent',
    derniereVisite: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    nombreVisites: 7,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'cli-003',
    prenom: 'Nadia',
    nom: 'BAMBA',
    telephone: '+229 96 789 01 23',
    email: '',
    dateNaissance: '1995-11-08',
    allergies: '',
    notes: 'Cliente régulière les samedis. Manucure + soin visage.',
    points: 340,
    niveau: 'bronze',
    derniereVisite: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    nombreVisites: 4,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockServices: Service[] = [
  {
    id: 'srv-001',
    nom: 'Tresse africaine',
    duree: 180,
    prix: 15000,
    description: 'Tresse complète avec extensions. Prix variable selon longueur.',
    actif: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv-002',
    nom: 'Manucure complète',
    duree: 60,
    prix: 5000,
    description: 'Soin complet des ongles, vernis gel inclus.',
    actif: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv-003',
    nom: 'Soin visage hydratant',
    duree: 45,
    prix: 8000,
    description: 'Nettoyage profond + masque hydratant + sérum éclat.',
    actif: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockEmployes: Employe[] = [
  {
    id: 'emp-001',
    prenom: 'Khadija',
    nom: 'SALL',
    telephone: '+221 76 234 56 78',
    servicesIds: ['srv-001', 'srv-002'],
    horaires: defaultHoraires,
    actif: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'emp-002',
    prenom: 'Mariama',
    nom: 'TRAORÉ',
    telephone: '+225 05 345 67 89',
    servicesIds: ['srv-002', 'srv-003'],
    horaires: {
      ...defaultHoraires,
      dimanche: { actif: true, debut: '10:00', fin: '15:00' },
    },
    actif: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper pour générer une date relative à aujourd'hui
const dateRelative = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const mockRendezVous: RendezVous[] = [
  {
    id: 'rdv-001',
    clientId: 'cli-001',
    employeId: 'emp-001',
    serviceId: 'srv-001',
    date: dateRelative(0),
    heure: '10:00',
    statut: 'confirme',
    notes: 'Tresse avec extensions dorées',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rdv-002',
    clientId: 'cli-002',
    employeId: 'emp-002',
    serviceId: 'srv-002',
    date: dateRelative(0),
    heure: '14:00',
    statut: 'en_attente',
    notes: '',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rdv-003',
    clientId: 'cli-003',
    employeId: 'emp-002',
    serviceId: 'srv-003',
    date: dateRelative(1),
    heure: '09:30',
    statut: 'confirme',
    notes: 'Première visite pour soin visage',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rdv-004',
    clientId: 'cli-001',
    employeId: 'emp-001',
    serviceId: 'srv-002',
    date: dateRelative(-1),
    heure: '11:00',
    statut: 'termine',
    notes: '',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rdv-005',
    clientId: 'cli-002',
    employeId: 'emp-001',
    serviceId: 'srv-001',
    date: dateRelative(-2),
    heure: '15:00',
    statut: 'no_show',
    notes: 'Cliente ne s\'est pas présentée',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockFactures: Facture[] = [
  {
    id: 'fac-001',
    numero: 'FAC-0001',
    clientId: 'cli-001',
    employesIds: ['emp-001'],
    lignes: [
      { serviceId: 'srv-001', nomService: 'Tresse africaine', duree: 180, prix: 15000 },
    ],
    total: 15000,
    montantPaye: 15000,
    resteAPayer: 0,
    statut: 'paye',
    pointsGeneres: 150,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fac-002',
    numero: 'FAC-0002',
    clientId: 'cli-002',
    employesIds: ['emp-002'],
    lignes: [
      { serviceId: 'srv-002', nomService: 'Manucure complète', duree: 60, prix: 5000 },
      { serviceId: 'srv-003', nomService: 'Soin visage hydratant', duree: 45, prix: 8000 },
    ],
    total: 13000,
    montantPaye: 8000,
    resteAPayer: 5000,
    statut: 'acompte',
    pointsGeneres: 80,
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fac-003',
    numero: 'FAC-0003',
    clientId: 'cli-003',
    employesIds: ['emp-002'],
    lignes: [
      { serviceId: 'srv-003', nomService: 'Soin visage hydratant', duree: 45, prix: 8000 },
    ],
    total: 8000,
    montantPaye: 8000,
    resteAPayer: 0,
    statut: 'paye',
    pointsGeneres: 80,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockSalon: Salon = {
  id: 'salon-001',
  nom: 'Salon Beauté Dorée',
  typesServices: ['coiffure', 'beaute', 'esthetique'],
  ville: 'Dakar',
  adresse: '45 Rue de la Paix, Plateau',
  telephone: '+221 33 867 12 34',
  whatsapp: '+221 77 867 12 34',
  rccm: 'SN-DKR-2024-B-12345',
  ifu: '',
  masquerSignature: false,
  prefixeFacture: 'FAC-',
  mentionLegale: 'Merci pour votre confiance. À bientôt !',
  plan: 'professionnel',
  trialStartDate: new Date().toISOString(),
  trialDays: 5,
};

export const mockUser: User = {
  id: 'user-001',
  prenom: 'Mariam',
  nom: 'SARR',
  telephone: '+221 77 000 00 00',
  email: 'demo@salonpro.app',
  password: 'demo1234',
  salonId: 'salon-001',
  createdAt: new Date().toISOString(),
};

// ============================================================
// INITIALISATION localStorage
// Appelée une seule fois au démarrage si les données n'existent pas
// ============================================================
export function initializeLocalStorage(): void {
  if (!localStorage.getItem('salonpro_clients')) {
    localStorage.setItem('salonpro_clients', JSON.stringify(mockClients));
  }
  if (!localStorage.getItem('salonpro_services')) {
    localStorage.setItem('salonpro_services', JSON.stringify(mockServices));
  }
  if (!localStorage.getItem('salonpro_employes')) {
    localStorage.setItem('salonpro_employes', JSON.stringify(mockEmployes));
  }
  if (!localStorage.getItem('salonpro_rdv')) {
    localStorage.setItem('salonpro_rdv', JSON.stringify(mockRendezVous));
  }
  if (!localStorage.getItem('salonpro_factures')) {
    localStorage.setItem('salonpro_factures', JSON.stringify(mockFactures));
  }
  if (!localStorage.getItem('salonpro_salon')) {
    localStorage.setItem('salonpro_salon', JSON.stringify(mockSalon));
  }
  if (!localStorage.getItem('salonpro_user')) {
    localStorage.setItem('salonpro_user', JSON.stringify(mockUser));
  }
  if (!localStorage.getItem('salonpro_facture_counter')) {
    localStorage.setItem('salonpro_facture_counter', '3');
  }
}
