import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } from '../../firebase/auth';
import { Scale, Mail, Lock, User as UserIcon, ArrowRight, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setError('Por favor ingresa tu nombre');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName.trim());
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMsg('Te hemos enviado un correo de recuperación');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo');
      } else {
        setError('No pudimos completar la solicitud. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Auth error:', {
        code: err?.code,
        message: err?.message,
        name: err?.name,
        customData: err?.customData,
      });
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError('El inicio de sesión con Google fue cancelado.');
      } else if (code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana de Google. Permite ventanas emergentes para Metron e inténtalo nuevamente.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('Ya existe una cuenta registrada con este correo mediante otro método de inicio de sesión.');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Este dominio todavía no está autorizado para iniciar sesión con Google.');
      } else {
        const errCode = err?.code || 'sin código';
        const errMsg = err?.message || 'sin mensaje';
        setError(`No se pudo iniciar sesión con Google.\nCódigo: ${errCode}\nMensaje: ${errMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0d] bg-[radial-gradient(ellipse_at_top_right,_#1a1a1c_0%,_#0c0c0d_70%)] flex flex-col justify-center items-center p-4 relative overflow-hidden text-[#e2e2e2]">
      {/* Background Decorative Accents */}
      <div className="absolute w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md bg-[#131315] border border-[#1e1e20] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Identity */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#18181b] border border-[#c5a059]/40 text-[#c5a059] mb-4 shadow-xl">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="font-serif tracking-[0.2em] text-2xl font-bold text-[#e2e2e2] uppercase">
            METRON
          </h1>
          <p className="text-xs text-[#888888] mt-1 uppercase tracking-widest font-light">
            Medición • Observación • Evolución
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">
                Nombre de usuario
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-[#666666]" />
                <input
                  id="auth-display-name"
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#28282b] rounded-lg py-2.5 pl-9 pr-3 text-sm text-[#e2e2e2] placeholder-[#666666] focus:outline-none focus:border-[#c5a059] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#666666]" />
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#18181b] border border-[#28282b] rounded-lg py-2.5 pl-9 pr-3 text-sm text-[#e2e2e2] placeholder-[#666666] focus:outline-none focus:border-[#c5a059] transition-colors"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#888888]">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                    }}
                    className="text-[11px] text-[#c5a059] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#666666]" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#28282b] rounded-lg py-2.5 pl-9 pr-3 text-sm text-[#e2e2e2] placeholder-[#666666] focus:outline-none focus:border-[#c5a059] transition-colors"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#2a1a1a] border border-[#4a2d2d] rounded-lg text-xs text-[#f87171] whitespace-pre-wrap">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#1a2e1a] border border-[#2d4a2d] rounded-lg text-xs text-[#4ade80]">
              {successMsg}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] font-bold text-xs tracking-wider uppercase rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>
              {mode === 'login'
                ? 'Iniciar sesión'
                : mode === 'register'
                ? 'Crear cuenta'
                : 'Enviar enlace'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode !== 'reset' && (
          <>
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-[#1e1e20]" />
              <span className="px-3 text-[11px] text-[#666666] uppercase tracking-widest font-mono">
                O continuar con
              </span>
              <div className="flex-1 border-t border-[#1e1e20]" />
            </div>

            <button
              id="auth-google-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#18181b] hover:bg-[#222225] border border-[#28282b] rounded-lg text-xs font-medium text-[#e2e2e2] transition-colors flex items-center justify-center space-x-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>
          </>
        )}

        {/* Mode Toggle */}
        <div className="mt-6 text-center text-xs text-[#888888]">
          {mode === 'login' ? (
            <p>
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-[#c5a059] hover:underline font-semibold"
              >
                Regístrate aquí
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-[#c5a059] hover:underline font-semibold"
              >
                Inicia sesión
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="text-[#c5a059] hover:underline font-semibold"
            >
              Volver al inicio de sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
