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
    const snap = await getDocs(query(subCol('clients'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Client);
  },

  getById: async (id: string): Promise<Client | null> => {
    const snap = await getDoc(doc(db, 'salons', getSalonId(), 'clients', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Client;
  },

  create: async (data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    const ref = await addDoc(subCol('clients'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    const ref = doc(db, 'salons', getSalonId(), 'clients', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Client;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'salons', getSalonId(), 'clients', id));
  },
};

// ============================================================
// SERVICE : SERVICES (prestations)
// ============================================================
export const servicesService = {
  getAll: async (): Promise<Service[]> => {
    const snap = await getDocs(query(subCol('services'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Service);
  },

  create: async (data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> => {
    const ref = await addDoc(subCol('services'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<Service>): Promise<Service> => {
    const ref = doc(db, 'salons', getSalonId(), 'services', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Service;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'salons', getSalonId(), 'services', id));
  },
};

// ============================================================
// SERVICE : EMPLOYÉS
// ============================================================
export const employesService = {
  getAll: async (): Promise<Employe[]> => {
    const snap = await getDocs(query(subCol('employes'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Employe);
  },

  create: async (data: Omit<Employe, 'id' | 'createdAt'>): Promise<Employe> => {
    const ref = await addDoc(subCol('employes'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<Employe>): Promise<Employe> => {
    const ref = doc(db, 'salons', getSalonId(), 'employes', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Employe;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'salons', getSalonId(), 'employes', id));
  },
};

// ============================================================
// SERVICE : RENDEZ-VOUS
// ============================================================
export const rendezVousService = {
  getAll: async (): Promise<RendezVous[]> => {
    const snap = await getDocs(query(subCol('rendezVous'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as RendezVous);
  },

  create: async (data: Omit<RendezVous, 'id' | 'createdAt'>): Promise<RendezVous> => {
    const ref = await addDoc(subCol('rendezVous'), { ...data, createdAt: serverTimestamp() });
    return { ...data, id: ref.id, createdAt: new Date().toISOString() };
  },

  update: async (id: string, data: Partial<RendezVous>): Promise<RendezVous> => {
    const ref = doc(db, 'salons', getSalonId(), 'rendezVous', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as RendezVous;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'salons', getSalonId(), 'rendezVous', id));
  },
};

// ============================================================
// SERVICE : FACTURES
// ============================================================
export const facturesService = {
  getAll: async (): Promise<Facture[]> => {
    const snap = await getDocs(query(subCol('factures'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }) as Facture);
  },

  create: async (data: Omit<Facture, 'id' | 'createdAt' | 'numero'>): Promise<Facture> => {
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
    const ref = doc(db, 'salons', getSalonId(), 'factures', id);
    await updateDoc(ref, data as Record<string, unknown>);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data(), createdAt: toISO(snap.data()?.createdAt) } as Facture;
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'salons', getSalonId(), 'factures', id));
  },
};

// ============================================================
// SERVICE : SALON
// ============================================================
export const salonService = {
  get: async (): Promise<Salon | null> => {
    const snap = await getDoc(doc(db, 'salons', getSalonId()));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Salon;
  },

  save: async (data: Salon): Promise<Salon> => {
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
    await signOut(auth);
    _salonId = null;
    localStorage.removeItem('salonpro_salon_id');
    localStorage.removeItem('salonpro_uid');
  },

  getCurrentUser: async (): Promise<User | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
  },

  register: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
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
    // Vérification rapide synchrone (Firebase Auth persiste dans IndexedDB)
    return !!auth.currentUser || !!localStorage.getItem('salonpro_salon_id');
  },
};
