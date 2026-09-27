// ============================================================
// PAGE LOGIN — SalonPro
// ============================================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Veuillez saisir votre email.'); return; }
    if (!password) { setError('Veuillez saisir votre mot de passe.'); return; }

    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      toast.success('Connexion réussie ! Bienvenue 👋');
      navigate('/app/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Connexion démo rapide
  const handleDemo = async () => {
    setLoading(true);
    try {
      await authService.login('demo@salonpro.app', 'demo1234');
      toast.success('Mode démo activé 🎉');
      navigate('/app/dashboard');
    } catch {
      setError('Données de démo introuvables. Veuillez créer un compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Logo */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 group">
        <span className="text-[#29B6F6] text-xl font-bold">✦</span>
        <span className="text-white font-bold text-lg group-hover:text-[#29B6F6] transition-colors">SalonPro</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#29B6F6' }}
            >
              <LogIn size={28} className="text-white" />
            </div>
            <h1 className="font-playfair font-bold text-white text-2xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              Connexion
            </h1>
            <p className="text-gray-400 text-sm mt-1">Bienvenue sur SalonPro</p>
          </div>

          {/* Erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6"
            >
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-[#29B6F6] transition-colors"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none focus:border-[#29B6F6] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#29B6F6] text-white font-bold py-3.5 rounded-xl transition-all hover:bg-[#0288D1] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Accès démo */}
          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full border border-[#29B6F6]/50 text-[#29B6F6] font-medium py-3 rounded-xl transition-all hover:bg-[#29B6F6]/10 active:scale-98 disabled:opacity-50"
          >
            🎯 Accéder à la démo
          </button>

          <p className="text-gray-600 text-xs text-center mt-4">
            <strong className="text-gray-400">Démo :</strong> demo@salonpro.app / demo1234
          </p>

          {/* Lien inscription */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link
              to="/onboarding"
              className="text-[#29B6F6] font-semibold hover:underline"
            >
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
