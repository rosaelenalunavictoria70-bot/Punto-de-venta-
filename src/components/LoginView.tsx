import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  Lock,
  User,
  LogIn,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import logoImg from '../assets/images/distribuidora_logo_1792434315123.jpg';

export const LoginView: React.FC = () => {
  const {
    salesUsers,
    loginWithCredentials,
    loginAsDemoUser,
    companyConfig,
    signInWithGoogleCloud,
    firebaseUser,
  } = useApp();

  const isOnline = useOnlineStatus();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = loginWithCredentials(username, pin);
    if (!result.success) {
      setError(result.error || 'Error de autenticación');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogleCloud();
      // Log into the admin sales profile automatically when signing in with Google
      const adminUser = salesUsers.find(u => u.role === 'admin') || salesUsers[0];
      if (adminUser) {
        loginAsDemoUser(adminUser);
      }
    } catch (e) {
      setError('No se pudo iniciar sesión con Google. Puedes ingresar con tu usuario y contraseña.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Left Column: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="Logo"
                  className="w-11 h-11 rounded-xl border border-slate-200 object-cover"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                    RutaVenta <span className="text-emerald-600">POS</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">{companyConfig.companyName}</p>
                </div>
              </div>

              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700 font-semibold">Modo Offline</span>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Acceso de Fuerza de Ventas
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tu usuario o código de vendedor (ej. <span className="font-mono font-semibold text-slate-700">VEN-001</span>) y tu contraseña para iniciar ruta. Funciona con o sin internet.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Usuario o Código de Vendedor
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: rosa.admin, juan.norte o VEN-002"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Contraseña / PIN de Venta
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    placeholder="Ingresa tu contraseña"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/15 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar al Punto de Venta</span>
              </button>
            </form>

            {/* Cloud Google Sign-In option */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || !isOnline}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {firebaseUser
                    ? `Conectado a la Nube (${firebaseUser.email}) — Continuar`
                    : 'Conectar e Ingresar con Google Cloud (Sincronización en Nube)'}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-6 text-[11px] text-slate-400">
            Sistema preparado para trabajo Online y Offline en ruta (Lunes a Sábado).
          </div>
        </div>

        {/* Right Column: Quick Access Accounts for Testing / Force Selection */}
        <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Usuarios de Fuerza de Ventas Activos</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Toca cualquier perfil para autocompletar o ingresar directamente, o crea nuevos vendedores desde el panel de <strong>Fuerza de Ventas</strong>:
            </p>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {salesUsers
                .filter(u => u.active)
                .map(sUser => (
                  <div
                    key={sUser.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                            {sUser.sellerCode}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {sUser.fullName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Usuario: <strong className="font-mono text-slate-700">{sUser.username}</strong> · Clave: <strong className="font-mono text-slate-700">{sUser.accessPin}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {sUser.assignedZone}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => loginAsDemoUser(sUser)}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Control Total de Accesos</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Como Administradora puedes crear todos los usuarios y contraseñas que necesites para tus preventistas y supervisar sus pedidos en tiempo real.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
