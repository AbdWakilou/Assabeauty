// ============================================================
// TYPES GLOBAUX — SalonPro
// ============================================================

export type ServiceType =
  | 'coiffure'
  | 'beaute'
  | 'esthetique'
  | 'maquillage'
  | 'tatouage'
  | 'henne'
  | 'spa';

export type NiveauFidelite = 'bronze' | 'argent' | 'or';

export type StatutRDV = 'confirme' | 'en_attente' | 'annule' | 'termine' | 'no_show';

export type StatutFacture = 'paye' | 'acompte' | 'credit';

export type PlanAbonnement = 'essentiel' | 'professionnel' | 'reseau';

// ============================================================
// CLIENT
// ============================================================
export interface Client {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  dateNaissance?: string; // YYYY-MM-DD
  allergies?: string;
  notes?: string;
  points: number;
  niveau: NiveauFidelite;
  derniereVisite?: string; // ISO date
  nombreVisites: number;
  createdAt: string;
}

// ============================================================
// SERVICE
// ============================================================
export interface Service {
  id: string;
  nom: string;
  duree: number; // minutes
  prix: number; // FCFA
  description?: string;
  actif: boolean;
  createdAt: string;
}

// ============================================================
// HORAIRE EMPLOYE
// ============================================================
export interface HoraireJour {
  actif: boolean;
  debut: string; // "08:00"
  fin: string;   // "18:00"
}

export interface Horaires {
  lundi: HoraireJour;
  mardi: HoraireJour;
  mercredi: HoraireJour;
  jeudi: HoraireJour;
  vendredi: HoraireJour;
  samedi: HoraireJour;
  dimanche: HoraireJour;
}

// ============================================================
// EMPLOYE
// ============================================================
export interface Employe {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  servicesIds: string[];
  horaires: Horaires;
  actif: boolean;
  createdAt: string;
}

// ============================================================
// RENDEZ-VOUS
// ============================================================
export interface RendezVous {
  id: string;
  clientId: string;
  employeId: string;
  serviceId: string;
  date: string;    // YYYY-MM-DD
  heure: string;   // HH:MM
  statut: StatutRDV;
  notes?: string;
  createdAt: string;
}

// ============================================================
// LIGNE FACTURE
// ============================================================
export interface LigneFacture {
  serviceId: string;
  nomService: string;
  duree: number;
  prix: number;
}

// ============================================================
// FACTURE
// ============================================================
export interface Facture {
  id: string;
  numero: string;    // ex: FAC-0001
  clientId: string;
  employesIds: string[];
  lignes: LigneFacture[];
  total: number;
  montantPaye: number;
  resteAPayer: number;
  statut: StatutFacture;
  pointsGeneres: number;
  date: string;  // ISO
  createdAt: string;
}

// ============================================================
// SALON
// ============================================================
export interface Salon {
  id: string;
  nom: string;
  logo?: string;         // base64
  typesServices: ServiceType[];
  ville: string;
  adresse: string;
  telephone: string;
  whatsapp: string;
  rccm?: string;
  ifu?: string;
  signature?: string;    // base64
  masquerSignature: boolean;
  prefixeFacture: string;
  mentionLegale?: string;
  plan: PlanAbonnement;
  trialStartDate: string; // ISO
  trialDays: number;
  factureCounter?: number;
  refAffilie: string | null; // code affilié tracé à l'inscription
}

// ============================================================
// UTILISATEUR
// ============================================================
export interface User {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  password: string; // Stocké localement — à remplacer par hash côté backend
  salonId?: string;
  refAffilie: string | null; // code affilié ayant parrainé cette inscription
  createdAt: string;
}

// ============================================================
// AFFILIÉ
// ============================================================
export interface Affilie {
  id: string;          // UID Firebase Auth
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  code: string;        // ex: "KOFI202634"
  lien: string;        // URL complète avec ?ref=CODE
  taux: number;        // % commission (15 | 20 | 28 | 35)
  statut: 'actif' | 'suspendu';
  clics: number;
  filleuls: number;
  commissionsGagnees: number;
  commissionsPendantes: number;
  dateInscription: string;
  createdAt: string;
  // ── Mobile Money (payout automatique FedaPay) ──
  mobileMoneyNumero: string;   // ex: "+22997000000"
  mobileMoneyPays: string;     // code ISO 2 lettres ex: "BJ", "SN", "CI"
}

// ============================================================
// INSCRIPTION (log par salon inscrit)
// ============================================================
export interface Inscription {
  userId: string;
  email: string;
  salonNom: string;
  ville: string;
  refAffilie: string | null;
  source: 'affiliation' | 'direct';
  createdAt: string;
}

// ============================================================
// ÉVÉNEMENT COMMISSION (déclenché par webhook paiement)
// ============================================================
export type StatutCommission = 'en_attente' | 'en_cours' | 'verse' | 'echec';
export type TypeEvenement    = 'premier_abonnement' | 'renouvellement';

export interface EvenementCommission {
  id: string;
  affilieId: string;         // UID Firebase de l'affilié
  affilieCode: string;       // code lisible ex: "KOFI202634"
  clientId: string;          // UID Firebase du salon
  plan: PlanAbonnement;
  montantPlan: number;       // FCFA
  taux: number;              // % ex: 20
  montantCommission: number; // montantPlan * taux / 100
  typeEvenement: TypeEvenement;
  datePaiementClient: string;
  statut: StatutCommission;
  transactionId: string;     // ID FedaPay — clé d'idempotence
  createdAt: string;
}

// ============================================================
// STATS DASHBOARD
// ============================================================
export interface StatJour {
  date: string; // YYYY-MM-DD
  recettes: number;
  rdv: number;
  noShows: number;
}

// ============================================================
// FORME ONBOARDING
// ============================================================
export interface OnboardingData {
  // Etape 1
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  password: string;
  // Etape 2
  nomSalon: string;
  logo?: string;
  typesServices: ServiceType[];
  ville: string;
  adresse: string;
  telephoneSalon: string;
  whatsapp: string;
  rccm?: string;
  ifu?: string;
  // Etape 3
  services: Omit<Service, 'id' | 'createdAt'>[];
  employes: Omit<Employe, 'id' | 'createdAt'>[];
  // Etape 4
  signature?: string;
  masquerSignature: boolean;
  prefixeFacture: string;
  mentionLegale?: string;
}

// ============================================================
// PLAN TARIFAIRE
// ============================================================
export interface PlanInfo {
  id: PlanAbonnement;
  nom: string;
  emoji: string;
  description: string;
  prix: number;
  avantages: string[];
  limitations: string[];
}
