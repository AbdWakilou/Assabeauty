// ============================================================
// COUCHE API — SalonPro  (Firestore + Firebase Auth)
// ============================================================
// Structure Firestore :
//   users/{uid}                    → infos user (salonId inclus)
//   salons/{salonId}               → infos salon (plan, trial, abonnement)
//   salons/{salonId}/clients/…
//   salons/{salonId}/services/…
//   salons/{salonId}/employes/…
//   salons/{salonId}/rendezVous/…
//   salons/{salonId}/factures/…
//
// ── MODE DÉMO ──────────────────────────────────────────────
// Quand isDemo() === true, chaque méthode court-circuite Firebase
// et délègue au demoStore (données en mémoire uniquement).
// Le code Firebase ci-dessous est INCHANGÉ et toujours utilisé
// en mode réel.
// ============================================================

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  setDoc, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import type { Client, Service, Employe, RendezVous, Facture, Salon, User } from '../types';

// ── Imports démo (court-circuit local, aucune dépendance Firebase) ──
import { isDemo, exitDemoMode } from '../demo/demoMode';
import {
  demoClientsService,
  demoServicesService,
  demoEmployesService,
  demoRendezVousService,
  demoFacturesService,
  demoSalonService,
  demoAuthService,
} from '../demo/demoStore';

// ── salonId courant (chargé au login, persisté en localStorage) ──────
let _salonId: string | null = localStorage.getItem('salonpro_salon_id');

function getSalonId(): string {
  if (!_salonId) throw new Error('Salon non initialisé — veuillez vous reconnecter.');
  return _salonId;
}

function subCol(name: string) {
  return collection(db, 'salons', getSalonId(), name);
}

// Convertit un Timestamp Firestore ou une string ISO en string ISO
function toISO(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return String(val);
}

// ============================================================
// SERVICE : CLIENTS
// ============================================================
export const clientsService = {
  getAll: async (): Promise<Client[]> => {
    if (isDemo()) return demoClientsService.getAll();
    const snap = await getDocs(query(subCol('clients'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Client);
  },

  getById: async (id: string): Promise<Client | null> => {
    if (isDemo()) return demoClientsService.getById(id);
    const snap = await getDoc(doc(db, 'salons', getSalonId(), 'clients', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Client;
  },

  create: async (data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    if (isDemo()) return demoClientsService.create(data);
    const ref = await addDoc(subCol('clients'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    if (isDemo()) return demoClientsService.update(id, data);
    const ref = doc(db, 'salons', getSalonId(), 'clients', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Client;
  },

  delete: async (id: string): Promise<void> => {
    if (isDemo()) return demoClientsService.delete(id);
    await deleteDoc(doc(db, 'salons', getSalonId(), 'clients', id));
  },
};

// ============================================================
// SERVICE : SERVICES (prestations)
// ============================================================
export const servicesService = {
  getAll: async (): Promise<Service[]> => {
    if (isDemo()) return demoServicesService.getAll();
    const snap = await getDocs(query(subCol('services'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Service);
  },

  create: async (data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> => {
    if (isDemo()) return demoServicesService.create(data);
    const ref = await addDoc(subCol('services'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<Service>): Promise<Service> => {
    if (isDemo()) return demoServicesService.update(id, data);
    const ref = doc(db, 'salons', getSalonId(), 'services', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Service;
  },

  delete: async (id: string): Promise<void> => {
    if (isDemo()) return demoServicesService.delete(id);
    await deleteDoc(doc(db, 'salons', getSalonId(), 'services', id));
  },
};

// ============================================================
// SERVICE : EMPLOYÉS
// ============================================================
export const employesService = {
  getAll: async (): Promise<Employe[]> => {
    if (isDemo()) return demoEmployesService.getAll();
    const snap = await getDocs(query(subCol('employes'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Employe);
  },

  create: async (data: Omit<Employe, 'id' | 'createdAt'>): Promise<Employe> => {
    if (isDemo()) return demoEmployesService.create(data);
    const ref = await addDoc(subCol('employes'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<Employe>): Promise<Employe> => {
    if (isDemo()) return demoEmployesService.update(id, data);
    const ref = doc(db, 'salons', getSalonId(), 'employes', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Employe;
  },

  delete: async (id: string): Promise<void> => {
    if (isDemo()) return demoEmployesService.delete(id);
    await deleteDoc(doc(db, 'salons', getSalonId(), 'employes', id));
  },
};

// ============================================================
// SERVICE : RENDEZ-VOUS
// ============================================================
export const rendezVousService = {
  getAll: async (): Promise<RendezVous[]> => {
    if (isDemo()) return demoRendezVousService.getAll();
    const snap = await getDocs(query(subCol('rendezVous'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as RendezVous);
  },

  create: async (data: Omit<RendezVous, 'id' | 'createdAt'>): Promise<RendezVous> => {
    if (isDemo()) return demoRendezVousService.create(data);
    const ref = await addDoc(subCol('rendezVous'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<RendezVous>): Promise<RendezVous> => {
    if (isDemo()) return demoRendezVousService.update(id, data);
    const ref = doc(db, 'salons', getSalonId(), 'rendezVous', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as RendezVous;
  },

  delete: async (id: string): Promise<void> => {
    if (isDemo()) return demoRendezVousService.delete(id);
    await deleteDoc(doc(db, 'salons', getSalonId(), 'rendezVous', id));
  },
};

// ============================================================
// SERVICE : FACTURES
// ============================================================
export const facturesService = {
  getAll: async (): Promise<Facture[]> => {
    if (isDemo()) return demoFacturesService.getAll();
    const snap = await getDocs(query(subCol('factures'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Facture);
  },

  create: async (data: Omit<Facture, 'id' | 'createdAt' | 'numero'>): Promise<Facture> => {
    if (isDemo()) return demoFacturesService.create(data);
    // Numéro auto-incrémenté via un compteur dans le doc salon
    const salonRef = doc(db, 'salons', getSalonId());
    const salonSnap = await getDoc(salonRef);
    const salonData = salonSnap.data() as Salon;
    const counter = (salonData.factureCounter ?? 0) + 1;
    await updateDoc(salonRef, { factureCounter: counter });

    const prefix = salonData.prefixeFacture ?? 'FAC-';
    const numero = `${prefix}${counter.toString().padStart(4, '0')}`;

    const ref = await addDoc(subCol('factures'), { ...data, numero, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, numero, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<Facture>): Promise<Facture> => {
    if (isDemo()) return demoFacturesService.update(id, data);
    const ref = doc(db, 'salons', getSalonId(), 'factures', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Facture;
  },

  delete: async (id: string): Promise<void> => {
    if (isDemo()) return demoFacturesService.delete(id);
    await deleteDoc(doc(db, 'salons', getSalonId(), 'factures', id));
  },
};

// ============================================================
// SERVICE : SALON
// ============================================================
export const salonService = {
  get: async (): Promise<Salon | null> => {
    if (isDemo()) return demoSalonService.get();
    const snap = await getDoc(doc(db, 'salons', getSalonId()));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Salon;
  },

  save: async (data: Salon): Promise<Salon> => {
    if (isDemo()) return demoSalonService.save(data);
    await setDoc(doc(db, 'salons', data.id), {
      ...data,
      refAffilie: data.refAffilie ?? null,
      createdAt:  serverTimestamp(),
    });
    _salonId = data.id;
    localStorage.setItem('salonpro_salon_id', data.id);
    return data;
  },

  update: async (data: Partial<Salon>): Promise<Salon> => {
    if (isDemo()) return demoSalonService.update(data);
    const ref = doc(db, 'salons', getSalonId());
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() } as Salon;
  },
};

// ============================================================
// SERVICE : AUTHENTIFICATION (Firebase Auth + Firestore)
// ============================================================
export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    if (isDemo()) return demoAuthService.login(email, password);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!userSnap.exists()) throw new Error('Profil utilisateur introuvable.');
    const user = { id: userSnap.id, ...userSnap.data() } as User;
    // Mémoriser salonId
    _salonId = user.salonId ?? null;
    if (_salonId) localStorage.setItem('salonpro_salon_id', _salonId);
    return user;
  },

  logout: async (): Promise<void> => {
    if (isDemo()) {
      // Quitte le mode démo proprement — aucun appel Firebase
      exitDemoMode();
      return;
    }
    await signOut(auth);
    _salonId = null;
    localStorage.removeItem('salonpro_salon_id');
    localStorage.removeItem('salonpro_uid');
  },

  getCurrentUser: async (): Promise<User | null> => {
    if (isDemo()) return demoAuthService.getCurrentUser();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
  },

  register: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    if (isDemo()) return demoAuthService.register(userData);
    const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const newUser: User = {
      ...userData,
      id: cred.user.uid,
      refAffilie: userData.refAffilie ?? null,
      createdAt: new Date().toISOString(),
    };
    // Stocker sans le mot de passe en clair (Firebase Auth gère le mdp)
    const { password: _pw, ...userWithoutPw } = newUser;
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...userWithoutPw,
      password:   '',
      refAffilie: newUser.refAffilie,  // tracé explicitement
      createdAt:  serverTimestamp(),
    });
    // Mémoriser salonId en mémoire et localStorage (comme au login)
    _salonId = newUser.salonId ?? null;
    if (_salonId) localStorage.setItem('salonpro_salon_id', _salonId);
    return newUser;
  },

  isAuthenticated: (): boolean => {
    // En mode démo : toujours authentifié (pas de Firebase)
    if (isDemo()) return true;
    // Vérification rapide synchrone (Firebase Auth persiste dans IndexedDB)
    return !!auth.currentUser || !!localStorage.getItem('salonpro_salon_id');
  },
};
