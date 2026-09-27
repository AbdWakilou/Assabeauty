// ============================================================
// DEMO MODE FLAG — SalonPro
// ─────────────────────────────────────────────────────────────
// Singleton module-level : se réinitialise automatiquement
// à chaque rechargement de page (comportement voulu).
// Aucune persistance (pas de localStorage, pas de cookie).
// ============================================================

let _isDemoMode = false;

/** Retourne true si l'app tourne en mode démo */
export const isDemo = (): boolean => _isDemoMode;

/** Active le mode démo (appelé depuis <Demo /> route) */
export const enterDemoMode = (): void => {
  _isDemoMode = true;
};

/** Désactive le mode démo (appelé à la déconnexion démo) */
export const exitDemoMode = (): void => {
  _isDemoMode = false;
};
