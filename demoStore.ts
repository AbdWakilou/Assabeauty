// ============================================================
// DEMO STORE — SalonPro
// ─────────────────────────────────────────────────────────────
// Données fictives réalistes stockées UNIQUEMENT en mémoire.
// Aucune écriture sur Firebase, localStorage, IndexedDB ou
// tout autre support persistant.
// Réinitialisé automatiquement à chaque rechargement de page.
//
// Expose les mêmes interfaces que api.ts :
//   demoClientsService  → clientsService
//   demoServicesService → servicesService
//   demoEmployesService → employesService
//   demoRendezVousService → rendezVousService
//   demoFacturesService → facturesService
//   demoSalonService    → salonService
//   demoAuthService     → authService
// ============================================================

import type {
  Client, Service, Employe, RendezVous, Facture, Salon, User, Horaires,
} from '../types';

// ── Utilitaires ───────────────────────────────────────────────────────────────
function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

let _idCounter = 1000;
function genId(prefix: string): string {
  return `${prefix}-d${++_idCounter}`;
}

const MS_DAY = 86_400_000;
const daysAgo  = (n: number) => new Date(Date.now() - n * MS_DAY).toISOString();
const daysAhead = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

// ── Données initiales réalistes ───────────────────────────────────────────────
const defaultHoraires: Horaires = {
  lundi:    { actif: true,  debut: '08:00', fin: '18:00' },
  mardi:    { actif: true,  debut: '08:00', fin: '18:00' },
  mercredi: { actif: true,  debut: '08:00', fin: '18:00' },
  jeudi:    { actif: true,  debut: '08:00', fin: '18:00' },
  vendredi: { actif: true,  debut: '08:00', fin: '18:00' },
  samedi:   { actif: true,  debut: '09:00', fin: '17:00' },
  dimanche: { actif: false, debut: '00:00', fin: '00:00' },
};

const INIT_CLIENTS: Client[] = [
  {
    id: 'cli-001', prenom: 'Aminata', nom: 'DIALLO',
    telephone: '+221 77 123 45 67', email: 'aminata.diallo@gmail.com',
    dateNaissance: '1992-03-15',
    allergies: 'Latex, certains colorants capillaires',
    notes: 'Préfère les rendez-vous en matinée. Cliente VIP depuis 6 mois.',
    points: 1650, niveau: 'or',
    derniereVisite: daysAgo(7), nombreVisites: 12,
    createdAt: daysAgo(180),
  },
  {
    id: 'cli-002', prenom: 'Fatou', nom: 'KONÉ',
    telephone: '+225 07 456 78 90', email: 'fatou.kone@yahoo.fr',
    dateNaissance: '1988-07-22', allergies: '',
    notes: 'Aime les tresses longues. Vient souvent avec sa fille.',
    points: 820, niveau: 'argent',
    derniereVisite: daysAgo(14), nombreVisites: 7,
    createdAt: daysAgo(120),
  },
  {
    id: 'cli-003', prenom: 'Nadia', nom: 'BAMBA',
    telephone: '+229 96 789 01 23', email: '',
    dateNaissance: '1995-11-08', allergies: '',
    notes: 'Cliente régulière les samedis. Manucure + soin visage.',
    points: 340, niveau: 'bronze',
    derniereVisite: daysAgo(3), nombreVisites: 4,
    createdAt: daysAgo(60),
  },
  {
    id: 'cli-004', prenom: 'Aïssatou', nom: 'BALDÉ',
    telephone: '+224 62 456 78 90', email: 'aissatou.b@hotmail.fr',
    dateNaissance: '1990-05-18', allergies: 'Nickel',
    notes: 'Préfère les produits naturels. Très sensible au cuir chevelu.',
    points: 2100, niveau: 'or',
    derniereVisite: daysAgo(2), nombreVisites: 18,
    createdAt: daysAgo(250),
  },
  {
    id: 'cli-005', prenom: 'Mariama', nom: 'KEITA',
    telephone: '+223 76 123 45 67', email: 'mariama.keita@gmail.com',
    dateNaissance: '1998-09-25', allergies: '',
    notes: 'Nouvelle cliente référée par Aminata DIALLO.',
    points: 0, niveau: 'bronze',
    derniereVisite: '', nombreVisites: 0,
    createdAt: daysAgo(2),
  },
];

const INIT_SERVICES: Service[] = [
  {
    id: 'srv-001', nom: 'Tresse africaine', duree: 180, prix: 15000,
    description: 'Tresse complète avec extensions. Prix variable selon longueur.',
    actif: true, createdAt: daysAgo(200),
  },
  {
    id: 'srv-002', nom: 'Manucure complète', duree: 60, prix: 5000,
    description: 'Soin complet des ongles, vernis gel inclus.',
    actif: true, createdAt: daysAgo(200),
  },
  {
    id: 'srv-003', nom: 'Soin visage hydratant', duree: 45, prix: 8000,
    description: 'Nettoyage profond + masque hydratant + sérum éclat.',
    actif: true, createdAt: daysAgo(200),
  },
  {
    id: 'srv-004', nom: 'Coiffure mariée', duree: 120, prix: 35000,
    description: 'Coiffure complète pour mariage ou baptême. Tresse + mise en plis.',
    actif: true, createdAt: daysAgo(150),
  },
  {
    id: 'srv-005', nom: 'Traitement kératine', duree: 90, prix: 22000,
    description: 'Lissage professionnel longue durée. Résultat visible 3-5 mois.',
    actif: true, createdAt: daysAgo(100),
  },
];

const INIT_EMPLOYES: Employe[] = [
  {
    id: 'emp-001', prenom: 'Khadija', nom: 'SALL',
    telephone: '+221 76 234 56 78',
    servicesIds: ['srv-001', 'srv-002', 'srv-004'],
    horaires: clone(defaultHoraires), actif: true,
    createdAt: daysAgo(365),
  },
  {
    id: 'emp-002', prenom: 'Mariama', nom: 'TRAORÉ',
    telephone: '+225 05 345 67 89',
    servicesIds: ['srv-002', 'srv-003', 'srv-005'],
    horaires: {
      ...clone(defaultHoraires),
      dimanche: { actif: true, debut: '10:00', fin: '15:00' },
    },
    actif: true,
    createdAt: daysAgo(200),
  },
];

const INIT_RENDEZ_VOUS: RendezVous[] = [
  {
    id: 'rdv-001', clientId: 'cli-001', employeId: 'emp-001', serviceId: 'srv-001',
    date: daysAhead(0), heure: '10:00', statut: 'confirme',
    notes: 'Tresse avec extensions dorées', createdAt: daysAgo(3),
  },
  {
    id: 'rdv-002', clientId: 'cli-002', employeId: 'emp-002', serviceId: 'srv-002',
    date: daysAhead(0), heure: '14:00', statut: 'en_attente',
    notes: '', createdAt: daysAgo(1),
  },
  {
    id: 'rdv-003', clientId: 'cli-003', employeId: 'emp-002', serviceId: 'srv-003',
    date: daysAhead(1), heure: '09:30', statut: 'confirme',
    notes: 'Première visite pour soin visage', createdAt: daysAgo(0),
  },
  {
    id: 'rdv-004', clientId: 'cli-004', employeId: 'emp-001', serviceId: 'srv-004',
    date: daysAhead(2), heure: '11:00', statut: 'confirme',
    notes: 'Mariage samedi — coiffure de fête', createdAt: daysAgo(2),
  },
  {
    id: 'rdv-005', clientId: 'cli-005', employeId: 'emp-002', serviceId: 'srv-005',
    date: daysAhead(4), heure: '14:30', statut: 'confirme',
    notes: 'Première visite kératine', createdAt: daysAgo(0),
  },
  {
    id: 'rdv-006', clientId: 'cli-001', employeId: 'emp-001', serviceId: 'srv-002',
    date: daysAhead(-1), heure: '11:00', statut: 'termine',
    notes: '', createdAt: daysAgo(5),
  },
  {
    id: 'rdv-007', clientId: 'cli-002', employeId: 'emp-001', serviceId: 'srv-001',
    date: daysAhead(-2), heure: '15:00', statut: 'no_show',
    notes: "Cliente ne s'est pas présentée", createdAt: daysAgo(7),
  },
  {
    id: 'rdv-008', clientId: 'cli-004', employeId: 'emp-002', serviceId: 'srv-003',
    date: daysAhead(-5), heure: '10:00', statut: 'termine',
    notes: 'Soin anti-taches', createdAt: daysAgo(8),
  },
];

const INIT_FACTURES: Facture[] = [
  {
    id: 'fac-001', numero: 'FAC-0001', clientId: 'cli-001', employesIds: ['emp-001'],
    lignes: [{ serviceId: 'srv-001', nomService: 'Tresse africaine', duree: 180, prix: 15000 }],
    total: 15000, montantPaye: 15000, resteAPayer: 0, statut: 'paye',
    pointsGeneres: 150, date: daysAgo(7), createdAt: daysAgo(7),
  },
  {
    id: 'fac-002', numero: 'FAC-0002', clientId: 'cli-002', employesIds: ['emp-002'],
    lignes: [
      { serviceId: 'srv-002', nomService: 'Manucure complète', duree: 60, prix: 5000 },
      { serviceId: 'srv-003', nomService: 'Soin visage hydratant', duree: 45, prix: 8000 },
    ],
    total: 13000, montantPaye: 8000, resteAPayer: 5000, statut: 'acompte',
    pointsGeneres: 80, date: daysAgo(14), createdAt: daysAgo(14),
  },
  {
    id: 'fac-003', numero: 'FAC-0003', clientId: 'cli-003', employesIds: ['emp-002'],
    lignes: [{ serviceId: 'srv-003', nomService: 'Soin visage hydratant', duree: 45, prix: 8000 }],
    total: 8000, montantPaye: 8000, resteAPayer: 0, statut: 'paye',
    pointsGeneres: 80, date: daysAgo(3), createdAt: daysAgo(3),
  },
  {
    id: 'fac-004', numero: 'FAC-0004', clientId: 'cli-004', employesIds: ['emp-002'],
    lignes: [{ serviceId: 'srv-003', nomService: 'Soin visage hydratant', duree: 45, prix: 8000 }],
    total: 8000, montantPaye: 8000, resteAPayer: 0, statut: 'paye',
    pointsGeneres: 80, date: daysAgo(5), createdAt: daysAgo(5),
  },
  {
    id: 'fac-005', numero: 'FAC-0005', clientId: 'cli-001', employesIds: ['emp-001'],
    lignes: [{ serviceId: 'srv-002', nomService: 'Manucure complète', duree: 60, prix: 5000 }],
    total: 5000, montantPaye: 5000, resteAPayer: 0, statut: 'paye',
    pointsGeneres: 50, date: daysAgo(1), createdAt: daysAgo(1),
  },
];

const INIT_SALON: Salon = {
  id: 'salon-demo',
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
  factureCounter: 5,
  refAffilie: null,
};

const INIT_USER: User = {
  id: 'user-demo',
  prenom: 'Mariam',
  nom: 'SARR',
  telephone: '+221 77 000 00 00',
  email: 'demo@salonpro.app',
  password: '',
  salonId: 'salon-demo',
  createdAt: new Date().toISOString(),
  refAffilie: null,
};

// ── État en mémoire (réinitialisé à chaque rechargement de page) ──────────────
interface DemoState {
  clients:     Client[];
  services:    Service[];
  employes:    Employe[];
  rendezVous:  RendezVous[];
  factures:    Facture[];
  salon:       Salon;
  user:        User;
  factureCounter: number;
}

function buildInitialState(): DemoState {
  return {
    clients:     clone(INIT_CLIENTS),
    services:    clone(INIT_SERVICES),
    employes:    clone(INIT_EMPLOYES),
    rendezVous:  clone(INIT_RENDEZ_VOUS),
    factures:    clone(INIT_FACTURES),
    salon:       clone(INIT_SALON),
    user:        clone(INIT_USER),
    factureCounter: 5,
  };
}

let state: DemoState = buildInitialState();

// ── Clients ───────────────────────────────────────────────────────────────────
export const demoClientsService = {
  getAll: async (): Promise<Client[]> =>
    clone(state.clients).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),

  getById: async (id: string): Promise<Client | null> => {
    const found = state.clients.find(x => x.id === id);
    return found ? clone(found) : null;
  },

  create: async (data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const item: Client = { ...clone(data), id: genId('cli'), createdAt: new Date().toISOString() };
    state.clients.unshift(item);
    return clone(item);
  },

  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    const idx = state.clients.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Client introuvable');
    state.clients[idx] = { ...state.clients[idx], ...clone(data) };
    return clone(state.clients[idx]);
  },

  delete: async (id: string): Promise<void> => {
    state.clients = state.clients.filter(x => x.id !== id);
  },
};

// ── Services (prestations) ────────────────────────────────────────────────────
export const demoServicesService = {
  getAll: async (): Promise<Service[]> =>
    clone(state.services).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),

  create: async (data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> => {
    const item: Service = { ...clone(data), id: genId('srv'), createdAt: new Date().toISOString() };
    state.services.unshift(item);
    return clone(item);
  },

  update: async (id: string, data: Partial<Service>): Promise<Service> => {
    const idx = state.services.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Service introuvable');
    state.services[idx] = { ...state.services[idx], ...clone(data) };
    return clone(state.services[idx]);
  },

  delete: async (id: string): Promise<void> => {
    state.services = state.services.filter(x => x.id !== id);
  },
};

// ── Employés ──────────────────────────────────────────────────────────────────
export const demoEmployesService = {
  getAll: async (): Promise<Employe[]> =>
    clone(state.employes).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),

  create: async (data: Omit<Employe, 'id' | 'createdAt'>): Promise<Employe> => {
    const item: Employe = { ...clone(data), id: genId('emp'), createdAt: new Date().toISOString() };
    state.employes.unshift(item);
    return clone(item);
  },

  update: async (id: string, data: Partial<Employe>): Promise<Employe> => {
    const idx = state.employes.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Employé introuvable');
    state.employes[idx] = { ...state.employes[idx], ...clone(data) };
    return clone(state.employes[idx]);
  },

  delete: async (id: string): Promise<void> => {
    state.employes = state.employes.filter(x => x.id !== id);
  },
};

// ── Rendez-vous ───────────────────────────────────────────────────────────────
export const demoRendezVousService = {
  getAll: async (): Promise<RendezVous[]> =>
    clone(state.rendezVous).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),

  create: async (data: Omit<RendezVous, 'id' | 'createdAt'>): Promise<RendezVous> => {
    const item: RendezVous = { ...clone(data), id: genId('rdv'), createdAt: new Date().toISOString() };
    state.rendezVous.unshift(item);
    return clone(item);
  },

  update: async (id: string, data: Partial<RendezVous>): Promise<RendezVous> => {
    const idx = state.rendezVous.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Rendez-vous introuvable');
    state.rendezVous[idx] = { ...state.rendezVous[idx], ...clone(data) };
    return clone(state.rendezVous[idx]);
  },

  delete: async (id: string): Promise<void> => {
    state.rendezVous = state.rendezVous.filter(x => x.id !== id);
  },
};

// ── Factures ──────────────────────────────────────────────────────────────────
export const demoFacturesService = {
  getAll: async (): Promise<Facture[]> =>
    clone(state.factures).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),

  create: async (data: Omit<Facture, 'id' | 'createdAt' | 'numero'>): Promise<Facture> => {
    const counter = ++state.factureCounter;
    const prefix  = state.salon.prefixeFacture ?? 'FAC-';
    const numero  = `${prefix}${counter.toString().padStart(4, '0')}`;
    const item: Facture = {
      ...clone(data), id: genId('fac'), numero, createdAt: new Date().toISOString(),
    };
    state.factures.unshift(item);
    return clone(item);
  },

  update: async (id: string, data: Partial<Facture>): Promise<Facture> => {
    const idx = state.factures.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('Facture introuvable');
    state.factures[idx] = { ...state.factures[idx], ...clone(data) };
    return clone(state.factures[idx]);
  },

  delete: async (id: string): Promise<void> => {
    state.factures = state.factures.filter(x => x.id !== id);
  },
};

// ── Salon ─────────────────────────────────────────────────────────────────────
export const demoSalonService = {
  get: async (): Promise<Salon | null> => clone(state.salon),

  save: async (data: Salon): Promise<Salon> => {
    state.salon = clone(data);
    return clone(state.salon);
  },

  update: async (data: Partial<Salon>): Promise<Salon> => {
    state.salon = { ...state.salon, ...clone(data) };
    return clone(state.salon);
  },
};

// ── Auth démo ─────────────────────────────────────────────────────────────────
export const demoAuthService = {
  login: async (_email: string, _password: string): Promise<User> => clone(state.user),

  logout: async (): Promise<void> => {
    // no-op — exitDemoMode() est appelé dans api.ts
  },

  getCurrentUser: async (): Promise<User | null> => clone(state.user),

  register: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    state.user = { ...clone(data), id: genId('user'), createdAt: new Date().toISOString() };
    return clone(state.user);
  },

  isAuthenticated: (): boolean => true,
};
